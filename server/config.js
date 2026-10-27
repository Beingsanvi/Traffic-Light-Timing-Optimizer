import dotenv from 'dotenv';

dotenv.config({ quiet: true });

export const config = {
    mongoUri: process.env.MONGO_DB_URL || process.env.MONGODB_URI,
    dbName: process.env.MONGO_DB_NAME || 'smartflow',
    port: Number(process.env.PORT || 3000),
    production: process.env.NODE_ENV === 'production',
    trustProxy: Number(process.env.TRUST_PROXY || 0),
    simulationEnabled: process.env.SIMULATION_ENABLED !== 'false'
};
