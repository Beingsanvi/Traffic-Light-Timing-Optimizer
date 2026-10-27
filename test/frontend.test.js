import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';

const source = file => readFile(new URL(`../${file}`, import.meta.url), 'utf8');
const flush = () => new Promise(resolve => setTimeout(resolve, 30));

test('dashboard renders server state and sends exactly one optimizer request per click', async () => {
    const dom = new JSDOM(await source('dashboard.html'), { url: 'http://localhost:3000/dashboard.html', runScripts: 'outside-only' });
    const calls = [];
    const intersection = {
        key: 'central', id: '001', name: 'Central Ave × 5th', north: 40, south: 30, east: 20, west: 10,
        density: 31, vehiclesPerHour: 1800, waitTime: 22, optimizationScore: 84,
        currentGreenTime: 36, recommendedGreenTime: 36, signalCountdown: 29,
        currentPhase: 'EW', signalStage: 'YELLOW', status: 'OPTIMAL',
        decision: { priority: 'NORTH / SOUTH', difference: 40, recommendedGreenTime: 36, estimatedWaitReduction: 32 }
    };
    const payload = {
        traffic: intersection,
        intersections: ['001', '002', '003', '004'].map(id => ({ ...intersection, id })),
        events: [{ type: 'optimized', message: 'Server event', createdAt: new Date().toISOString() }]
    };
    dom.window.fetch = async (url, options) => {
        calls.push({ url, method: options.method || 'GET' });
        return { ok: true, status: 200, json: async () => url === '/api/auth/me' ? { user: { name: 'Operator' } } : payload };
    };
    try {
        for (const file of ['Js/api.js', 'Js/traffic.js', 'Js/dashboard.js']) dom.window.eval(await source(file));
        await flush();
        assert.equal(dom.window.document.getElementById('sidebarUser').textContent, 'Operator');
        assert.equal(dom.window.document.getElementById('signalCountdown').textContent, '29');
        assert.equal(dom.window.document.getElementById('eastWestStatus').textContent, 'READY');
        assert.equal(dom.window.document.getElementById('northSouthStatus').textContent, 'STOP');
        assert.equal(dom.window.document.getElementById('network-status-004').textContent, 'OPTIMAL');
        assert.match(dom.window.document.querySelector('.activity-list').textContent, /Server event/);
        dom.window.document.getElementById('optimizeBtn').click();
        await flush();
        assert.equal(calls.filter(call => call.url.endsWith('/optimize') && call.method === 'POST').length, 1);
        assert.equal(dom.window.document.getElementById('optimizeBtn').disabled, false);
    } finally {
        dom.window.close();
    }
});

test('signup submits credentials to the API and displays server validation failures', async () => {
    const dom = new JSDOM(await source('signup.html'), { url: 'http://localhost:3000/signup.html', runScripts: 'outside-only' });
    const calls = [];
    dom.window.fetch = async (url, options) => {
        calls.push({ url, body: JSON.parse(options.body) });
        return { ok: false, status: 409, json: async () => ({ error: { message: 'This email is already registered' } }) };
    };
    try {
        for (const file of ['Js/api.js', 'Js/auth.js']) dom.window.eval(await source(file));
        const document = dom.window.document;
        document.getElementById('name').value = 'Operator';
        document.getElementById('signupEmail').value = 'operator@example.com';
        document.getElementById('signupPassword').value = 'example-password';
        document.getElementById('confirmPassword').value = 'example-password';
        document.getElementById('signupForm').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
        await flush();
        assert.equal(calls.length, 1);
        assert.equal(calls[0].url, '/api/auth/signup');
        assert.equal(calls[0].body.password, 'example-password');
        assert.equal(document.getElementById('signupMessage').textContent, 'This email is already registered');
        assert.equal(dom.window.localStorage.getItem('smartflowUsers'), null);
        assert.equal(document.querySelector('button[type="submit"]').disabled, false);
    } finally {
        dom.window.close();
    }
});
