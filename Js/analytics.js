// Analytics aggregation and history are supplied by MongoDB via the Express API.
const metrics = {
    density: { title: 'Traffic Density Over Time', unit: '%', suffix: '%' },
    wait: { title: 'Average Wait Time Over Time', unit: 'seconds', suffix: 's' },
    vehicles: { title: 'Vehicle Flow Over Time', unit: 'vehicles/hour', suffix: '' },
    score: { title: 'Optimization Score Over Time', unit: '%', suffix: '%' }
};
let paused = false;
let latestData;
let requestVersion = 0;
const text = (id, value) => { document.getElementById(id).textContent = value; };
const selections = () => new URLSearchParams({
    metric: document.getElementById('metricSelect').value,
    intersection: document.getElementById('intersectionSelect').value,
    seconds: document.getElementById('timeRange').value
});

function drawChart(data) {
    const canvas = document.getElementById('analyticsChart');
    const ctx = canvas.getContext('2d');
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width || !height) return;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const points = data.points;
    const padding = 40;
    const max = data.metric === 'vehicles' ? Math.max(1000, ...points.map(point => point.value)) : 100;
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
        const y = padding + (height - padding * 2) * i / 4;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
    }
    ctx.fillStyle = '#71808a';
    ctx.font = '12px Arial';
    ctx.fillText(`${max}${metrics[data.metric].suffix}`, 4, padding - 10);
    if (points.length < 2) {
        ctx.fillText('Collecting traffic history...', padding, height / 2);
        return;
    }
    const start = new Date(points[0].time).getTime();
    const duration = new Date(points.at(-1).time).getTime() - start || 1;
    ctx.beginPath();
    points.forEach((point, index) => {
        const x = padding + (new Date(point.time).getTime() - start) / duration * (width - padding * 2);
        const y = height - padding - point.value / max * (height - padding * 2);
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#00F5A0';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillText(new Date(points[0].time).toLocaleTimeString(), padding, height - 10);
    ctx.fillText(new Date(points.at(-1).time).toLocaleTimeString(), width - 110, height - 10);
}

function renderAnalytics(data) {
    latestData = data;
    const metric = metrics[data.metric];
    const format = value => `${Math.round(value).toLocaleString()}${metric.suffix}`;
    const name = data.intersection === 'all' ? 'All Intersections' : data.intersections.find(item => item.key === data.intersection)?.name;
    text('chartTitle', `${metric.title} · ${name}`);
    text('metricUnit', metric.unit);
    text('currentMetric', format(data.summary.current));
    text('averageMetric', format(data.summary.average));
    text('peakMetric', format(data.summary.peak));
    text('trendMetric', data.summary.trend);
    text('trendDescription', 'Trend over the last five recorded observations');
    text('busiestIntersection', data.insights.busiestIntersection);
    text('peakLoad', `${data.insights.peakLoad}%`);
    text('priorityDirection', data.insights.priority);
    text('insightTitle', data.insights.condition);
    text('insightText', `${data.insights.priority} has the higher demand in the selected intersections.`);
    text('beforeValue', `${Math.round(data.performance.baseline)}%`);
    text('afterValue', `${Math.round(data.performance.current)}%`);
    text('improvementValue', `${data.performance.improvement >= 0 ? '+' : ''}${Math.round(data.performance.improvement)} pp`);
    const container = document.getElementById('intersectionComparison');
    container.replaceChildren();
    for (const intersection of data.intersections) {
        const row = document.createElement('div');
        row.className = 'intersection-performance';
        const nameBox = document.createElement('div');
        nameBox.className = 'performance-name';
        const nameText = document.createElement('strong');
        nameText.textContent = intersection.name;
        const load = document.createElement('small');
        load.textContent = `${intersection.density}% traffic load`;
        nameBox.append(nameText, load);
        const bar = document.createElement('div');
        bar.className = 'performance-bar';
        const fill = document.createElement('span');
        fill.style.width = `${intersection.density}%`;
        bar.append(fill);
        const score = document.createElement('strong');
        score.className = 'performance-score';
        score.textContent = `${intersection.optimizationScore}%`;
        row.append(nameBox, bar, score);
        container.append(row);
    }
    drawChart(data);
}

async function refreshAnalytics() {
    const version = ++requestVersion;
    try {
        const data = await SmartFlowAPI.request(`/analytics?${selections()}`);
        if (paused || version !== requestVersion) return;
        renderAnalytics(data);
        text('chartStatus', '● LIVE');
        SmartFlowAPI.showError('');
    } catch (error) {
        if (version !== requestVersion) return;
        if (error.status === 401) window.location.replace('login.html');
        text('chartStatus', '● OFFLINE');
        SmartFlowAPI.showError(error.message);
    }
}

for (const id of ['metricSelect', 'intersectionSelect', 'timeRange']) {
    document.getElementById(id).addEventListener('change', () => {
        if (!paused) refreshAnalytics();
    });
}
document.getElementById('pauseAnalytics').addEventListener('click', () => {
    paused = !paused;
    requestVersion++;
    text('pauseAnalytics', paused ? '▶ Resume Live Data' : '⏸ Pause Live Data');
    text('chartStatus', paused ? '● PAUSED' : '● LIVE');
    if (!paused) refreshAnalytics();
});
window.addEventListener('resize', () => { if (latestData) drawChart(latestData); });
(async () => {
    try {
        await SmartFlowAPI.requireUser();
        const poll = async () => {
            if (!paused) await refreshAnalytics();
            setTimeout(poll, 3000);
        };
        await poll();
    } catch (error) {
        if (error.status !== 401) SmartFlowAPI.showError(error.message);
    }
})();
