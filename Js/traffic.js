// Presentation only: all metrics, decisions, and signal transitions come from Express.
window.SmartFlowView = {
    text(id, value) {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    },
    renderDashboard({ traffic, intersections, events }) {
        if (!traffic) return;
        this.text('trafficDensity', `${traffic.density}%`);
        this.text('vehicleCount', traffic.vehiclesPerHour.toLocaleString());
        this.text('waitTime', `${traffic.waitTime}s`);
        this.text('optimizationScore', `${traffic.optimizationScore}%`);
        document.getElementById('densityProgress').style.width = `${traffic.density}%`;
        this.text('densityStatus', traffic.status);
        this.text('vehicleTrend', 'Live server traffic flow');
        this.text('optimizationStatus', 'Server-calculated signal efficiency');
        this.text('waitTrend', 'Estimated from traffic load');
        for (const direction of ['north', 'south', 'east', 'west']) {
            this.text(`${direction}Traffic`, traffic[direction]);
            document.getElementById(`${direction}Bar`).style.width = `${traffic[direction]}%`;
        }
        this.text('greenTime', traffic.recommendedGreenTime);
        this.text('recommendedTime', `${traffic.recommendedGreenTime} seconds`);
        this.text('recommendedGreenTime', `${traffic.recommendedGreenTime}s`);
        this.text('currentGreenTime', `${traffic.currentGreenTime}s`);
        const delta = traffic.recommendedGreenTime - traffic.currentGreenTime;
        this.text('improvementTime', `${delta >= 0 ? '+' : ''}${delta}s`);
        this.text('signalCountdown', traffic.signalCountdown);
        for (const [phase, lightClass, statusId, dotId] of [
            ['NS', '.light-left', 'northSouthStatus', 'northSouthDot'],
            ['EW', '.light-right', 'eastWestStatus', 'eastWestDot']
        ]) {
            const color = traffic.currentPhase === phase ? (traffic.signalStage === 'GREEN' ? 'green' : 'yellow') : 'red';
            document.querySelectorAll(`${lightClass} span`).forEach(light => light.classList.toggle('active-light', light.classList.contains(color)));
            this.text(statusId, color === 'green' ? 'GO' : color === 'yellow' ? 'READY' : 'STOP');
            document.getElementById(dotId).className = `signal-dot ${color}-dot`;
        }
        const analysis = traffic.decision;
        this.text('aiPriority', analysis.priority);
        this.text('aiTrafficDifference', `${analysis.difference}% of total imbalance`);
        this.text('aiRecommendedTime', `${analysis.recommendedGreenTime}s`);
        this.text('aiWaitReduction', `~${analysis.estimatedWaitReduction}%`);
        this.text('aiDecisionStatus', 'LIVE ANALYSIS');
        this.text('aiDecisionMessage', `${analysis.priority} has the higher demand. The controller recommends ${analysis.recommendedGreenTime} seconds of green time.`);
        document.querySelector('.network-count').textContent = `${intersections.length} ACTIVE`;
        for (const intersection of intersections) {
            this.text(`network-score-${intersection.id}`, `${intersection.optimizationScore}%`);
            const color = intersection.status === 'HIGH LOAD' ? 'red' : intersection.status === 'MONITOR' ? 'yellow' : 'green';
            const status = document.getElementById(`network-status-${intersection.id}`);
            status.textContent = intersection.status;
            status.className = `signal-state ${color}-state`;
            document.getElementById(`network-signal-${intersection.id}`).className = `mini-signal ${color}`;
        }
        const list = document.querySelector('.activity-list');
        list.replaceChildren();
        for (const event of events) {
            const row = document.createElement('div');
            row.className = 'activity';
            const icon = document.createElement('span');
            icon.className = 'activity-icon green';
            icon.textContent = event.type === 'optimized' ? '✓' : '◈';
            const content = document.createElement('div');
            const title = document.createElement('strong');
            title.textContent = event.message;
            const time = document.createElement('small');
            time.textContent = new Date(event.createdAt).toLocaleString();
            content.append(title, time);
            row.append(icon, content);
            list.append(row);
        }
    }
};
