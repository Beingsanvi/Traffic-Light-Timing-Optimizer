import mongoose from 'mongoose';

const { Schema } = mongoose;
const bounded = (max, defaultValue = 0) => ({ type: Number, min: 0, max, default: defaultValue, required: true });

const userSchema = new Schema({
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    passwordHash: { type: String, required: true, select: false }
}, { timestamps: true });

const sessionSchema = new Schema({
    tokenHash: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, required: true }
}, { timestamps: true });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const intersectionSchema = new Schema({
    key: { type: String, required: true, unique: true, enum: ['central', 'market', 'park', 'main'] },
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    north: bounded(80), south: bounded(80), east: bounded(80), west: bounded(80),
    density: bounded(100), vehiclesPerHour: bounded(5760), waitTime: bounded(100),
    optimizationScore: bounded(100), baselineScore: bounded(100),
    currentGreenTime: { type: Number, min: 20, max: 60, default: 30 },
    recommendedGreenTime: { type: Number, min: 20, max: 60, default: 30 },
    currentPhase: { type: String, enum: ['NS', 'EW'], default: 'NS' },
    signalStage: { type: String, enum: ['GREEN', 'YELLOW'], default: 'GREEN' },
    signalCountdown: bounded(60, 30),
    nextPhase: { type: String, enum: ['NS', 'EW'], default: 'EW' },
    lastTickAt: { type: Date, default: Date.now }
}, { timestamps: true });

const snapshotSchema = new Schema({
    intersection: { type: String, required: true },
    timestamp: { type: Date, required: true, default: Date.now },
    density: bounded(100), waitTime: bounded(100), vehiclesPerHour: bounded(5760), optimizationScore: bounded(100)
});
snapshotSchema.index({ intersection: 1, timestamp: -1 });
snapshotSchema.index({ timestamp: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

const eventSchema = new Schema({
    type: { type: String, required: true, enum: ['initialized', 'optimized', 'traffic_updated'] },
    intersection: { type: String, required: true },
    message: { type: String, required: true },
    actor: { type: Schema.Types.ObjectId, ref: 'User' },
    details: { type: Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now }
});
eventSchema.index({ createdAt: -1 });
eventSchema.index({ intersection: 1, createdAt: -1 });

export const User = mongoose.model('User', userSchema);
export const Session = mongoose.model('Session', sessionSchema);
export const Intersection = mongoose.model('Intersection', intersectionSchema);
export const TrafficSnapshot = mongoose.model('TrafficSnapshot', snapshotSchema);
export const Event = mongoose.model('Event', eventSchema);

export async function initializeCollections() {
    for (const model of [User, Session, Intersection, TrafficSnapshot, Event]) {
        await model.createCollection();
        await model.createIndexes();
    }
}
