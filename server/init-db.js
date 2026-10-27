import mongoose from 'mongoose';
import { initializeDatabase } from './database.js';
import { config } from './config.js';
import { databaseErrorMessage } from './database-errors.js';

try {
    await initializeDatabase();
    console.log(`Database ${config.dbName}: collections, indexes, and intersections initialized.`);
} catch (error) {
    console.error(`Database initialization failed (${error.code || error.name}). ${databaseErrorMessage(error)}`);
    process.exitCode = 1;
} finally {
    await mongoose.disconnect();
}
