const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

export async function apiClient(endpoint, options = {}) {
    const token = typeof window != 'undefined' ? localStorage.getItem('token') : null

    const headers = {
        ...(options.isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers
    };

    const config = {
        ...options,
        headers,
    };

    if (config.body && typeof config.body === 'object' && !options.isFormData) {
        config.body = JSON.stringify(config.body)
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

        if (response.status === 401) {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token')
                localStorage.removeItem('user')
                window.location.href = '/login'
            }
        }
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.message || `API Error: ${response.statusText}`);
        }
        return data;
    } catch (error) {
        console.error(`Request to ${endpoint} failed:`, error)
        throw error
    }
}