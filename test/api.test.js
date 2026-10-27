import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import request from 'supertest';
import { createApp } from '../server/app.js';
import { Event, Intersection, Session, TrafficSnapshot, User, initializeCollections } from '../server/models.js';
import { createTrafficService, seedIntersections } from '../server/traffic.js';

let database;
let app;
let service;
const account = { name: 'Test Operator', email: 'operator@example.com', password: 'test-password-123' };

before(async () => {
    database = await MongoMemoryServer.create();
    await mongoose.connect(database.getUri(), { dbName: 'smartflow_test' });
    await initializeCollections();
    await seedIntersections();
    service = createTrafficService({ simulationEnabled: false });
    app = createApp({ trafficService: service });
});

after(async () => {
    await service?.stop();
    await mongoose.disconnect();
    await database?.stop();
});

test('initialization creates indexed collections and preserves existing traffic when repeated', async () => {
    assert.equal(await Intersection.countDocuments(), 4);
    assert.equal(await Event.countDocuments({ type: 'initialized' }), 4);
    await Intersection.updateOne({ key: 'park' }, { $set: { north: 42 } });
    await seedIntersections();
    assert.equal((await Intersection.findOne({ key: 'park' })).north, 42);
    assert.equal(await Event.countDocuments({ type: 'initialized' }), 4);
    const indexes = await Session.collection.indexes();
    assert.ok(indexes.some(index => index.expireAfterSeconds === 0));
});

test('authentication persists hashed credentials, protects routes, and revokes sessions', async () => {
    await request(app).get('/api/dashboard').expect(401);
    const agent = request.agent(app);
    const signup = await agent.post('/api/auth/signup').send(account).expect(201);
    assert.equal(signup.body.user.name, account.name);
    assert.equal(signup.body.user.passwordHash, undefined);
    const user = await User.findOne({ email: account.email }).select('+passwordHash');
    assert.notEqual(user.passwordHash, account.password);
    await agent.post('/api/auth/signup').send({ ...account, email: 'OPERATOR@example.com' }).expect(409);
    await agent.post('/api/auth/login').send({ email: account.email, password: 'wrong-password' }).expect(401);
    const login = await agent.post('/api/auth/login').send({ email: account.email, password: account.password }).expect(200);
    assert.match(login.headers['set-cookie'][0], /HttpOnly/);
    assert.match(login.headers['set-cookie'][0], /SameSite=Lax/);
    const token = login.headers['set-cookie'][0].match(/smartflow_session=([^;]+)/)[1];
    assert.notEqual((await Session.findOne()).tokenHash, token);
    await agent.get('/api/auth/me').expect(200);
    await agent.post('/api/auth/logout').send({}).expect(204);
    await agent.get('/api/auth/me').expect(401);
    assert.equal(await Session.countDocuments(), 0);
    await agent.post('/api/auth/login').send({ email: account.email, password: account.password }).expect(200);
    await Session.updateMany({}, { $set: { expiresAt: new Date(Date.now() - 1000) } });
    await agent.get('/api/auth/me').expect(401);
});

test('traffic updates and optimization persist one consistent state, snapshots, and actor events', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ email: account.email, password: account.password }).expect(200);
    const input = { north: 70, south: 60, east: 10, west: 20 };
    const update = await agent.patch('/api/intersections/central/traffic').send(input).expect(200);
    assert.equal(update.body.intersection.density, 50);
    assert.equal(update.body.intersection.vehiclesPerHour, 2880);
    assert.equal(update.body.intersection.waitTime, 31);
    assert.equal(update.body.intersection.optimizationScore, 60);
    const optimized = await agent.post('/api/intersections/central/optimize').send({}).expect(200);
    assert.equal(optimized.body.intersection.currentGreenTime, 53);
    assert.equal((await Intersection.findOne({ key: 'central' })).currentGreenTime, 53);
    const event = await Event.findOne({ type: 'optimized', intersection: 'central' });
    assert.ok(event.actor);
    assert.equal(event.details.greenTime, 53);
    assert.ok(await TrafficSnapshot.countDocuments({ intersection: 'central' }) >= 3);
    const dashboard = await agent.get('/api/dashboard').expect(200);
    assert.equal(dashboard.body.traffic.density, update.body.intersection.density);
    assert.equal(dashboard.body.intersections.length, 4);
    const analytics = await agent.get('/api/analytics?metric=density&intersection=central&seconds=300').expect(200);
    assert.equal(analytics.body.summary.current, 50);
    assert.ok(analytics.body.points.length >= 3);
    const flow = await agent.get('/api/analytics?metric=vehicles&intersection=all').expect(200);
    assert.equal(flow.body.summary.current, dashboard.body.intersections.reduce((sum, item) => sum + item.vehiclesPerHour, 0));
    // The park count was changed directly above; history must reflect its last
    // recorded snapshot rather than substituting a current-state value.
    const latestSnapshots = await TrafficSnapshot.aggregate([
        { $sort: { timestamp: -1, _id: -1 } },
        { $group: { _id: '$intersection', flow: { $first: '$vehiclesPerHour' } } }
    ]);
    assert.equal(flow.body.points.at(-1).value, latestSnapshots.reduce((sum, item) => sum + item.flow, 0));
    await agent.get('/api/events?intersection=central&limit=1').expect(200).then(response => assert.equal(response.body.events.length, 1));
});

test('validation rejects invalid counts, unknown fields, query injection, and cross-origin writes', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ email: account.email, password: account.password }).expect(200);
    const input = { north: 20, south: 20, east: 20, west: 20 };
    await agent.patch('/api/intersections/central/traffic').send({ ...input, north: 81 }).expect(400);
    await agent.patch('/api/intersections/central/traffic').send({ ...input, east: 2.5 }).expect(400);
    await agent.patch('/api/intersections/central/traffic').send({ ...input, currentPhase: 'EW' }).expect(400);
    await agent.post('/api/intersections/central/optimize').send({ currentGreenTime: 500 }).expect(400);
    await agent.get('/api/analytics?seconds=-1').expect(400);
    await agent.get('/api/analytics?metric=invalid').expect(400);
    await agent.get('/api/analytics?intersection[$ne]=central').expect(400);
    await agent.post('/api/intersections/central/optimize').set('Origin', 'https://example.com').send({}).expect(403);
});

test('signal clock transitions through yellow and does not simulate traffic when disabled', async () => {
    await Intersection.updateOne({ key: 'central' }, { $set: {
        currentPhase: 'NS', signalStage: 'GREEN', signalCountdown: 1, lastTickAt: new Date(), north: 70
    } });
    service.start();
    await new Promise(resolve => setTimeout(resolve, 1400));
    let intersection = await Intersection.findOne({ key: 'central' });
    assert.equal(intersection.signalStage, 'YELLOW');
    assert.equal(intersection.nextPhase, 'EW');
    assert.equal(intersection.north, 70);
    await new Promise(resolve => setTimeout(resolve, 3400));
    intersection = await Intersection.findOne({ key: 'central' });
    assert.equal(intersection.signalStage, 'GREEN');
    assert.equal(intersection.currentPhase, 'EW');
    assert.equal(intersection.north, 70);
    await service.stop();
});

test('public pages and documentation load without exposing server files or credentials', async () => {
    await request(app).get('/api/health').expect(200);
    for (const url of ['/', '/login.html', '/dashboard.html', '/analytics.html', '/Js/api.js', '/api-docs']) {
        await request(app).get(url).expect(200);
    }
    for (const url of ['/.env', '/server/config.js', '/package.json', '/opencode.json', '/.git/config']) {
        await request(app).get(url).expect(404);
    }
});
