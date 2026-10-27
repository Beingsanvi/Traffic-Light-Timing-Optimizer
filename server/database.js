import mongoose from 'mongoose';
import { config } from './config.js';
import { initializeCollections } from './models.js';
import { seedIntersections } from './traffic.js';
import { validateMongoUri } from './database-errors.js';

export async function initializeDatabase() {
    if (!config.mongoUri) throw new Error('Set MONGO_DB_URL in .env to a MongoDB connection URI');
    validateMongoUri(config.mongoUri);
    await mongoose.connect(config.mongoUri, { dbName: config.dbName, serverSelectionTimeoutMS: 10000 });
    await initializeCollections();
    await seedIntersections();
}
