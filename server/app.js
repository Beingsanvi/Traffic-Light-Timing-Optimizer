import express from 'express';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { z } from 'zod';
import { Event, Intersection, Session, User } from './models.js';
import { getAnalytics, publicIntersection } from './traffic.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const email = z.string().trim().toLowerCase().email().max(254);
const password = z.string().min(6).max(72).refine(value => Buffer.byteLength(value) <= 72, 'Password must be at most 72 UTF-8 bytes');
const keys = z.enum(['central', 'market', 'park', 'main']);
const hash = token => createHash('sha256').update(token).digest('hex');
const publicUser = user => ({ id: user._id.toString(), name: user.name, email: user.email });

export function createApp({ trafficService, production = false, trustProxy = 0 }) {
    const app = express();
    if (trustProxy) app.set('trust proxy', trustProxy);
    app.disable('x-powered-by');
    app.use('/api', (req, res, next) => {
        const started = performance.now();
        const endpoint = req.originalUrl.split('?')[0];
        res.once('finish', () => {
            const duration = (performance.now() - started).toFixed(1);
            console.log(`${new Date().toISOString()} ${req.method} ${endpoint} ${res.statusCode} ${duration} ms`);
        });
        next();
    });
    app.use(express.json({ limit: '16kb' }));
    app.use(cookieParser());
    // Same-origin web app: reject cross-site mutation requests, including cookie CSRF.
    app.use('/api', (req, res, next) => {
        res.set('Cache-Control', 'no-store');
        if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
            const origin = req.get('origin');
            if (req.get('sec-fetch-site') === 'cross-site' || (origin && origin !== `${req.protocol}://${req.get('host')}`)) {
                return res.status(403).json({ error: { message: 'Cross-origin requests are not allowed' } });
            }
        }
        next();
    });
    const cookieOptions = { httpOnly: true, secure: production, sameSite: 'lax', path: '/' };
    const createSession = async (res, user, remember = false) => {
        const token = randomBytes(32).toString('hex');
        const maxAge = (remember ? 30 : 1) * 24 * 60 * 60 * 1000;
        await Session.create({ tokenHash: hash(token), user: user._id, expiresAt: new Date(Date.now() + maxAge) });
        res.cookie('smartflow_session', token, { ...cookieOptions, maxAge });
    };
    const authenticate = async (req, res, next) => {
        const token = req.cookies.smartflow_session;
        const session = typeof token === 'string' && /^[a-f0-9]{64}$/.test(token)
            ? await Session.findOne({ tokenHash: hash(token), expiresAt: { $gt: new Date() } }).populate('user') : null;
        if (!session?.user) return res.status(401).json({ error: { message: 'Please sign in' } });
        req.user = session.user;
        next();
    };
    const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false,
        message: { error: { message: 'Too many authentication attempts; try again later' } } });

    app.get('/api/health', (req, res) => {
        const connected = mongoose.connection.readyState === 1;
        res.status(connected ? 200 : 503).json({ status: connected ? 'ok' : 'unavailable', database: connected ? 'connected' : 'disconnected' });
    });
    app.post('/api/auth/signup', authLimiter, async (req, res) => {
        const input = z.object({ name: z.string().trim().min(1).max(100), email, password }).strict().parse(req.body);
        const user = await User.create({ name: input.name, email: input.email, passwordHash: await bcrypt.hash(input.password, 12) });
        res.status(201).json({ user: publicUser(user) });
    });
    app.post('/api/auth/login', authLimiter, async (req, res) => {
        const input = z.object({ email, password, remember: z.boolean().optional() }).strict().parse(req.body);
        const user = await User.findOne({ email: input.email }).select('+passwordHash');
        if (!user || !await bcrypt.compare(input.password, user.passwordHash)) {
            return res.status(401).json({ error: { message: 'Invalid email or password' } });
        }
        const oldToken = req.cookies.smartflow_session;
        if (typeof oldToken === 'string') await Session.deleteOne({ tokenHash: hash(oldToken) });
        await createSession(res, user, input.remember);
        res.json({ user: publicUser(user) });
    });
    app.get('/api/auth/me', authenticate, (req, res) => res.json({ user: publicUser(req.user) }));
    app.post('/api/auth/logout', async (req, res) => {
        const token = req.cookies.smartflow_session;
        if (typeof token === 'string') await Session.deleteOne({ tokenHash: hash(token) });
        res.clearCookie('smartflow_session', cookieOptions);
        res.status(204).end();
    });

    app.use('/api', authenticate);
    app.get('/api/intersections', async (req, res) => {
        res.json({ intersections: (await Intersection.find().sort({ id: 1 })).map(publicIntersection) });
    });
    app.get('/api/intersections/:key', async (req, res) => {
        res.json({ intersection: publicIntersection(await trafficService.find(keys.parse(req.params.key))) });
    });
    app.patch('/api/intersections/:key/traffic', async (req, res) => {
        const count = z.number().int().min(0).max(80);
        const values = z.object({ north: count, south: count, east: count, west: count }).strict().parse(req.body);
        res.json({ intersection: await trafficService.updateTraffic(keys.parse(req.params.key), values, req.user._id) });
    });
    app.post('/api/intersections/:key/optimize', async (req, res) => {
        z.object({}).strict().parse(req.body ?? {});
        res.json({ intersection: await trafficService.optimize(keys.parse(req.params.key), req.user._id) });
    });
    app.get('/api/dashboard', async (req, res) => {
        const intersections = (await Intersection.find().sort({ id: 1 })).map(publicIntersection);
        const events = await Event.find().sort({ createdAt: -1 }).limit(10).lean();
        res.json({ traffic: intersections.find(item => item.key === 'central'), intersections, events });
    });
    app.get('/api/analytics', async (req, res) => {
        const query = z.object({
            metric: z.enum(['density', 'wait', 'vehicles', 'score']).default('density'),
            intersection: z.enum(['all', 'central', 'market', 'park', 'main']).default('all'),
            seconds: z.coerce.number().int().min(1).max(3600).default(30)
        }).strict().parse(req.query);
        res.json(await getAnalytics(query));
    });
    app.get('/api/events', async (req, res) => {
        const query = z.object({ intersection: keys.optional(), limit: z.coerce.number().int().min(1).max(100).default(20) }).strict().parse(req.query);
        res.json({ events: await Event.find(query.intersection ? { intersection: query.intersection } : {}).sort({ createdAt: -1 }).limit(query.limit).lean() });
    });
    app.use('/api', (req, res) => res.status(404).json({ error: { message: 'API route not found' } }));

    // Serve only public directories/pages; the repository root contains credentials.
    for (const directory of ['Assets', 'Css', 'Js']) app.use(`/${directory}`, express.static(path.join(root, directory)));
    for (const page of ['index', 'login', 'signup', 'dashboard', 'analytics']) {
        app.get(`/${page}.html`, (req, res) => res.sendFile(path.join(root, `${page}.html`)));
    }
    app.get('/', (req, res) => res.sendFile(path.join(root, 'index.html')));
    app.get('/api-docs', (req, res) => res.type('text/plain').sendFile(path.join(root, 'docs/API.md')));
    app.use((req, res) => res.status(404).json({ error: { message: 'Page not found' } }));
    app.use((error, req, res, next) => {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: { message: 'Invalid request', details: error.issues.map(issue => ({ path: issue.path.join('.'), message: issue.message })) } });
        }
        if (error.code === 11000) return res.status(409).json({ error: { message: 'This email is already registered' } });
        const status = error.status || (error.name === 'ValidationError' ? 400 : 500);
        res.status(status).json({ error: { message: status >= 500 ? 'Unable to complete request' : error.message } });
    });
    return app;
}
