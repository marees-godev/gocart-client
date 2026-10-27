const rawBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'
const API_BASE_URL = rawBaseUrl.trim().replace(/\/+$/, '')
const GRAPHQL_ENDPOINT = API_BASE_URL.endsWith('/graphql') || API_BASE_URL.endsWith('/query')
    ? API_BASE_URL
    : `${API_BASE_URL}/query`

export async function graphqlRequest(query, variables = {}, options = {}) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    }

    try {
        // Sanitize non-breaking spaces (\u00A0) that cause GraphQL syntax errors
        const cleanQuery = typeof query === 'string' ? query.replace(/\u00A0/g, ' ') : query

        const response = await fetch(GRAPHQL_ENDPOINT, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                query: cleanQuery,
                variables,
            }),
            ...options
        })

        if (response.status === 401) {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token')
                localStorage.removeItem('user')
                document.cookie = 'token=; Max-Age=0; path=/;'
                window.location.href = '/login'
            }
        }

        const result = await response.json().catch(() => null)

        if (!result) {
            throw new Error(`Server returned non-JSON response (${response.status} ${response.statusText})`)
        }

        // Print GraphQL errors from backend (e.g. email already exists, invalid fields)
        if (result.errors && result.errors.length > 0) {
            const errorMessage = result.errors.map(e => e.message).join(', ')
            throw new Error(errorMessage || 'GraphQL Request Failed')
        }

        return result.data
    } catch (error) {
        console.error('GraphQL Error:', error)
        if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
            throw new Error(`Unable to reach backend at "${GRAPHQL_ENDPOINT}". Check if the backend is running and the URL in .env.local is valid.`)
        }
        throw error
    }
}
