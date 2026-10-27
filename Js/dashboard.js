const optimizeButton = document.getElementById('optimizeBtn');
let mutationPending = false;

function updateTime() {
    SmartFlowView.text('currentTime', new Date().toLocaleTimeString());
}
updateTime();
setInterval(updateTime, 1000);

async function refreshDashboard() {
    if (mutationPending) return;
    try {
        const data = await SmartFlowAPI.request('/dashboard');
        if (!mutationPending) SmartFlowView.renderDashboard(data);
        SmartFlowAPI.showError('');
    } catch (error) {
        if (error.status === 401) window.location.replace('login.html');
        SmartFlowAPI.showError(`Live data unavailable: ${error.message}`);
    }
}

optimizeButton.addEventListener('click', async () => {
    mutationPending = true;
    optimizeButton.disabled = true;
    optimizeButton.textContent = 'OPTIMIZING...';
    try {
        await SmartFlowAPI.request('/intersections/central/optimize', { method: 'POST', body: '{}' });
        SmartFlowView.renderDashboard(await SmartFlowAPI.request('/dashboard'));
        SmartFlowAPI.showError('');
    } catch (error) {
        if (error.status === 401) window.location.replace('login.html');
        SmartFlowAPI.showError(error.message);
    } finally {
        mutationPending = false;
        optimizeButton.disabled = false;
        optimizeButton.textContent = '✦ OPTIMIZE SIGNAL TIMING';
    }
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
        await SmartFlowAPI.request('/auth/logout', { method: 'POST', body: '{}' });
        window.location.replace('login.html');
    } catch (error) {
        SmartFlowAPI.showError(error.message);
    }
});

(async () => {
    try {
        const user = await SmartFlowAPI.requireUser();
        SmartFlowView.text('sidebarUser', user.name);
        document.querySelector('.user-avatar').textContent = user.name.slice(0, 2).toUpperCase();
        const poll = async () => {
            await refreshDashboard();
            setTimeout(poll, 1000);
        };
        await poll();
    } catch (error) {
        if (error.status !== 401) SmartFlowAPI.showError(error.message);
    }
})();
