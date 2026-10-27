// Shared same-origin API client. Authentication uses an HttpOnly session cookie.
window.SmartFlowAPI = {
    async request(endpoint, options = {}) {
        const response = await fetch(`/api${endpoint}`, {
            credentials: 'same-origin',
            ...options,
            headers: { 'Content-Type': 'application/json', ...options.headers }
        });
        const data = response.status === 204 ? null : await response.json();
        if (!response.ok) {
            const error = new Error(data?.error?.details?.map(item => item.message).join('. ') || data?.error?.message || 'Request failed');
            error.status = response.status;
            throw error;
        }
        return data;
    },
    async requireUser() {
        try {
            const { user } = await this.request('/auth/me');
            return user;
        } catch (error) {
            if (error.status === 401) window.location.replace('login.html');
            throw error;
        }
    },
    showError(message) {
        let element = document.getElementById('apiError');
        if (!element) {
            element = document.createElement('p');
            element.id = 'apiError';
            element.setAttribute('role', 'alert');
            element.style.cssText = 'padding:12px;color:#ff7474;background:#23191c;position:sticky;top:0;z-index:20';
            document.querySelector('main, .analytics-page, body').prepend(element);
        }
        element.textContent = message;
        element.hidden = !message;
    }
};
