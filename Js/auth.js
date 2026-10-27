// Forms collect input; account validation and password verification run on Express.
for (const type of ['signup', 'login']) {
    const form = document.getElementById(`${type}Form`);
    if (!form) continue;
    form.addEventListener('submit', async event => {
        event.preventDefault();
        const message = document.getElementById(`${type}Message`);
        const button = form.querySelector('button[type="submit"]');
        const body = type === 'signup' ? {
            name: document.getElementById('name').value.trim(),
            email: document.getElementById('signupEmail').value.trim(),
            password: document.getElementById('signupPassword').value
        } : {
            email: document.getElementById('email').value.trim(),
            password: document.getElementById('password').value,
            remember: document.getElementById('remember').checked
        };
        message.setAttribute('role', 'alert');
        message.textContent = '';
        if (type === 'signup' && body.password !== document.getElementById('confirmPassword').value) {
            message.textContent = 'Passwords do not match.';
            return;
        }
        button.disabled = true;
        try {
            await SmartFlowAPI.request(`/auth/${type}`, { method: 'POST', body: JSON.stringify(body) });
            // Remove credentials saved by the old browser-only prototype.
            for (const key of ['smartflowUsers', 'smartflowUser', 'smartflowLoggedInUser', 'smartflowLoggedIn']) localStorage.removeItem(key);
            window.location.href = type === 'signup' ? 'login.html' : 'dashboard.html';
        } catch (error) {
            message.textContent = error.message;
        } finally {
            button.disabled = false;
        }
    });
}

const togglePassword = document.getElementById('togglePassword');
togglePassword?.addEventListener('click', () => {
    const input = document.getElementById('password');
    input.type = input.type === 'password' ? 'text' : 'password';
    togglePassword.textContent = input.type === 'password' ? 'SHOW' : 'HIDE';
});
