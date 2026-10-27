import { Event, Intersection, TrafficSnapshot } from './models.js';

const directions = ['north', 'south', 'east', 'west'];
const seeds = [
    ['central', '001', 'Central Ave × 5th', 25, 20, 35, 30, 'NS'],
    ['market', '002', 'Market St × 3rd', 40, 35, 55, 45, 'EW'],
    ['park', '003', 'Park Ave × 8th', 20, 25, 30, 25, 'NS'],
    ['main', '004', 'Main St × 2nd', 60, 55, 65, 60, 'EW']
];
export const metricFields = { density: 'density', wait: 'waitTime', vehicles: 'vehiclesPerHour', score: 'optimizationScore' };
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function calculateMetrics(intersection) {
    const total = directions.reduce((sum, direction) => sum + intersection[direction], 0);
    const imbalance = Math.abs(intersection.north + intersection.south - intersection.east - intersection.west);
    intersection.density = Math.round(total / 320 * 100);
    intersection.vehiclesPerHour = total * 18;
    intersection.waitTime = Math.max(5, Math.round(8 + intersection.density * 0.45));
    intersection.optimizationScore = clamp(Math.round(100 - imbalance * 0.4), 45, 98);
    intersection.recommendedGreenTime = clamp(Math.round(25 + intersection.density * 0.35), 20, 60);
    return intersection;
}

export function decision(intersection) {
    const ns = intersection.north + intersection.south;
    const ew = intersection.east + intersection.west;
    const difference = ns + ew ? Math.round(Math.abs(ns - ew) / (ns + ew) * 100) : 0;
    return {
        priority: ns >= ew ? 'NORTH / SOUTH' : 'EAST / WEST',
        phase: ns >= ew ? 'NS' : 'EW',
        difference,
        recommendedGreenTime: intersection.recommendedGreenTime,
        estimatedWaitReduction: ns + ew ? clamp(Math.round(difference * 0.8), 5, 35) : 0
    };
}

export function publicIntersection(intersection) {
    const data = intersection.toObject ? intersection.toObject() : intersection;
    const { _id, __v, ...result } = data;
    return {
        ...result,
        status: data.density >= 80 ? 'HIGH LOAD' : data.density >= 60 ? 'MONITOR' : 'OPTIMAL',
        decision: decision(data)
    };
}

export async function recordSnapshots(intersections, timestamp = new Date()) {
    await TrafficSnapshot.insertMany(intersections.map(intersection => ({
        intersection: intersection.key,
        timestamp,
        ...Object.fromEntries(Object.values(metricFields).map(field => [field, intersection[field]]))
    })));
}

export async function seedIntersections() {
    for (const [key, id, name, north, south, east, west, currentPhase] of seeds) {
        const state = calculateMetrics({ key, id, name, north, south, east, west, currentPhase });
        state.baselineScore = state.optimizationScore;
        state.currentGreenTime = state.recommendedGreenTime;
        state.signalCountdown = state.currentGreenTime;
        const result = await Intersection.updateOne({ key }, { $setOnInsert: state }, { upsert: true });
        if (result.upsertedCount) {
            await Event.create({ type: 'initialized', intersection: key, message: `${name} initialized` });
            await recordSnapshots([state]);
        }
    }
}

// Serialize simulation and API mutations so a tick cannot overwrite an optimization.
export function createTrafficService({ simulationEnabled = true } = {}) {
    let queue = Promise.resolve();
    let timer;
    let ticks = 0;
    const mutate = operation => {
        const result = queue.then(operation);
        queue = result.catch(() => {});
        return result;
    };
    const find = async key => {
        const intersection = await Intersection.findOne({ key });
        if (!intersection) {
            const error = new Error('Intersection not found');
            error.status = 404;
            throw error;
        }
        return intersection;
    };
    return {
        mutate,
        find,
        updateTraffic: (key, values, actor) => mutate(async () => {
            const intersection = await find(key);
            Object.assign(intersection, values);
            calculateMetrics(intersection);
            await intersection.save();
            await recordSnapshots([intersection]);
            await Event.create({ type: 'traffic_updated', intersection: key, actor, message: `${intersection.name}: traffic updated` });
            return publicIntersection(intersection);
        }),
        optimize: (key, actor) => mutate(async () => {
            const intersection = await find(key);
            const before = { phase: intersection.currentPhase, greenTime: intersection.currentGreenTime, score: intersection.optimizationScore };
            const analysis = decision(intersection);
            const load = Math.max(intersection.north + intersection.south, intersection.east + intersection.west);
            intersection.currentGreenTime = clamp(Math.round(20 + load * 0.25), 20, 60);
            intersection.recommendedGreenTime = intersection.currentGreenTime;
            // Direction changes pass through the yellow stage of the existing phase.
            if (intersection.currentPhase !== analysis.phase || intersection.signalStage === 'YELLOW') {
                intersection.nextPhase = analysis.phase;
                intersection.signalStage = 'YELLOW';
                intersection.signalCountdown = 3;
            } else {
                intersection.signalCountdown = intersection.currentGreenTime;
            }
            intersection.lastTickAt = new Date();
            await intersection.save();
            await Event.create({
                type: 'optimized', intersection: key, actor,
                message: `${intersection.name}: optimized to ${intersection.currentGreenTime}s (${analysis.priority})`,
                details: { before, greenTime: intersection.currentGreenTime, phase: analysis.phase, estimatedWaitReduction: analysis.estimatedWaitReduction }
            });
            await recordSnapshots([intersection]);
            return publicIntersection(intersection);
        }),
        start() {
            if (timer) return;
            // Recursive timeout prevents an unbounded backlog when the database is slow.
            const tick = async () => {
                try {
                    await mutate(async () => {
                        const intersections = await Intersection.find().sort({ id: 1 });
                        const now = new Date();
                        ticks++;
                        for (const intersection of intersections) {
                            if (simulationEnabled && ticks % 3 === 0) {
                                for (const direction of directions) {
                                    intersection[direction] = clamp(intersection[direction] + Math.floor(Math.random() * 15) - 7, 0, 80);
                                }
                                calculateMetrics(intersection);
                            }
                            const elapsed = Math.max(1, Math.floor((now - intersection.lastTickAt) / 1000));
                            intersection.signalCountdown -= elapsed;
                            if (intersection.signalCountdown <= 0) {
                                if (intersection.signalStage === 'GREEN') {
                                    intersection.signalStage = 'YELLOW';
                                    intersection.nextPhase = intersection.currentPhase === 'NS' ? 'EW' : 'NS';
                                    intersection.signalCountdown = 3;
                                } else {
                                    intersection.currentPhase = intersection.nextPhase;
                                    intersection.signalStage = 'GREEN';
                                    intersection.currentGreenTime = intersection.recommendedGreenTime;
                                    intersection.signalCountdown = intersection.currentGreenTime;
                                }
                            }
                            intersection.lastTickAt = now;
                            await intersection.save();
                        }
                        if (ticks % 3 === 0) await recordSnapshots(intersections, now);
                    });
                } catch {
                    console.error('Traffic tick failed; retrying on next tick.');
                } finally {
                    if (timer) timer = setTimeout(tick, 1000);
                }
            };
            timer = setTimeout(tick, 1000);
        },
        async stop() {
            clearTimeout(timer);
            timer = undefined;
            await queue;
        }
    };
}

export async function getAnalytics({ metric, intersection, seconds }) {
    const field = metricFields[metric];
    const since = new Date(Date.now() - seconds * 1000);
    let points;
    if (intersection === 'all') {
        // An API update records only one intersection. Carry the last known values
        // forward so network history never mistakes that partial update for the whole network.
        const preceding = await TrafficSnapshot.aggregate([
            { $match: { timestamp: { $lt: since } } },
            { $sort: { intersection: 1, timestamp: -1 } },
            { $group: { _id: '$intersection', value: { $first: `$${field}` } } }
        ]);
        const observations = await TrafficSnapshot.find({ timestamp: { $gte: since } })
            .select(`intersection timestamp ${field}`).sort({ timestamp: 1, _id: 1 }).lean();
        const lastValues = new Map(preceding.map(item => [item._id, item.value]));
        const groups = new Map();
        for (const item of observations) {
            const time = item.timestamp.getTime();
            if (!groups.has(time)) groups.set(time, []);
            groups.get(time).push(item);
        }
        points = [];
        for (const [time, group] of groups) {
            for (const item of group) lastValues.set(item.intersection, item[field]);
            // During first initialization there is no complete network observation yet.
            if (lastValues.size !== seeds.length) continue;
            const total = [...lastValues.values()].reduce((sum, value) => sum + value, 0);
            points.push({ time: new Date(time), value: metric === 'vehicles' ? total : total / lastValues.size });
        }
    } else {
        points = await TrafficSnapshot.aggregate([
            { $match: { timestamp: { $gte: since }, intersection } },
            { $group: { _id: '$timestamp', value: { $avg: `$${field}` } } },
            { $sort: { _id: 1 } },
            { $project: { _id: 0, time: '$_id', value: 1 } }
        ]);
    }
    const intersections = (await Intersection.find().sort({ id: 1 })).map(publicIntersection);
    const selected = intersection === 'all' ? intersections : intersections.filter(item => item.key === intersection);
    const current = selected.reduce((sum, item) => sum + item[field], 0) / (metric === 'vehicles' && intersection === 'all' ? 1 : selected.length);
    const values = points.map(point => point.value);
    const change = values.length >= 5 ? values.at(-1) - values.at(-5) : 0;
    const threshold = metric === 'vehicles' ? 40 : 2;
    const busiest = intersections.reduce((best, item) => !best || item.density > best.density ? item : best, null);
    const baseline = selected.reduce((sum, item) => sum + item.baselineScore, 0) / selected.length;
    const score = selected.reduce((sum, item) => sum + item.optimizationScore, 0) / selected.length;
    const ns = selected.reduce((sum, item) => sum + item.north + item.south, 0);
    const ew = selected.reduce((sum, item) => sum + item.east + item.west, 0);
    const density = selected.reduce((sum, item) => sum + item.density, 0) / selected.length;
    return {
        metric, intersection, seconds, points,
        summary: {
            current, average: values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : current,
            peak: values.length ? Math.max(...values) : current,
            trend: change > threshold ? 'RISING' : change < -threshold ? 'FALLING' : 'STABLE'
        },
        insights: {
            busiestIntersection: busiest?.name, peakLoad: busiest?.density,
            priority: ns >= ew ? 'NORTH / SOUTH' : 'EAST / WEST',
            condition: density >= 70 ? 'High congestion detected' : density >= 45 ? 'Moderate traffic detected' : 'Traffic flow is healthy'
        },
        intersections,
        performance: { baseline, current: score, improvement: score - baseline }
    };
}
