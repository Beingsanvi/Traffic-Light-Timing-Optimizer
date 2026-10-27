import mongoose from 'mongoose';
import { config } from './config.js';
import { initializeDatabase } from './database.js';
import { createApp } from './app.js';
import { createTrafficService } from './traffic.js';
import { databaseErrorMessage } from './database-errors.js';

try {
    await initializeDatabase();
    const trafficService = createTrafficService(config);
    const app = createApp({ trafficService, production: config.production, trustProxy: config.trustProxy });
    const server = app.listen(config.port, error => {
        if (error) return;
        trafficService.start();
        console.log(`SmartFlow running at http://localhost:${server.address().port}`);
    });
    let shuttingDown = false;
    const shutdown = async () => {
        if (shuttingDown) return;
        shuttingDown = true;
        server.close(async () => {
            await trafficService.stop();
            await mongoose.disconnect();
        });
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    server.on('error', async error => {
        console.error(`Server failed to listen (${error.code || error.name}).`);
        await trafficService.stop();
        await mongoose.disconnect();
        process.exitCode = 1;
    });
} catch (error) {
    console.error(`Startup failed (${error.code || error.name}). ${databaseErrorMessage(error)}`);
    await mongoose.disconnect();
    process.exitCode = 1;
}
