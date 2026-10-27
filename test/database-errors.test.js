import { test } from 'node:test';
import assert from 'node:assert/strict';
import { databaseErrorMessage, validateMongoUri } from '../server/database-errors.js';

test('rejects raw @ in credentials before the driver queries the wrong DNS hostname', () => {
    assert.throws(() => validateMongoUri('mongodb+srv://operator:@demo@cluster.example.net/'), { code: 'INVALID_MONGO_URI' });
    assert.doesNotThrow(() => validateMongoUri('mongodb+srv://operator:%40demo@cluster.example.net/'));
    assert.doesNotThrow(() => validateMongoUri('mongodb://127.0.0.1:27017/smartflow'));
});

test('connection diagnostics explain DNS and credential problems without echoing secrets', () => {
    const error = Object.assign(new Error('mongodb+srv://operator:secret@example.net'), { code: 'ENOTFOUND' });
    const message = databaseErrorMessage(error);
    assert.match(message, /DNS/);
    assert.ok(!message.includes('secret'));
    assert.match(databaseErrorMessage({ code: 18 }), /authentication failed/);
});

test('distinguishes Atlas TLS rejection from a generic server-selection timeout', () => {
    const error = {
        name: 'MongooseServerSelectionError',
        reason: { servers: new Map([['host', { error: { cause: { code: 'ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR' } } }]]) }
    };
    assert.match(databaseErrorMessage(error), /TLS handshake failed/);
    assert.match(databaseErrorMessage(error), /current public IP/);
    assert.match(databaseErrorMessage({ name: 'MongooseServerSelectionError' }), /could not be reached/);
});

test('explains direct MongoNetworkError TLS causes as well as server-selection causes', () => {
    const error = {
        name: 'MongoNetworkError',
        cause: { code: 'ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR' }
    };
    assert.match(databaseErrorMessage(error), /Atlas TLS handshake failed/);
    assert.match(databaseErrorMessage(error), /Collections are created automatically/);
    assert.match(databaseErrorMessage({ name: 'MongoNetworkError', cause: { code: 'ECONNRESET' } }), /could not be reached/);
    assert.match(databaseErrorMessage({ name: 'MongoNetworkTimeoutError' }), /could not be reached/);
});
