const DEFAULT_REDIRECT_URI = 'http://localhost:3000'

/**
 * Returns the configured Facebook OAuth redirect URI.
 */
export function getFacebookRedirectUri() {
    return process.env.NEXT_PUBLIC_FACEBOOK_REDIRECT_URI || process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || DEFAULT_REDIRECT_URI
}

/**
 * Builds the Facebook OAuth 2.0 authorization URL for redirect flow.
 * 
 * @param {Object} params
 * @param {string} [params.role='USER'] - USER | MERCHANT | DELIVERY_PARTNER
 * @param {string} [params.mode='login'] - login | register
 * @param {string} [params.redirectUri] - Optional custom redirect URI
 * @returns {string} Fully formed Facebook OAuth URL
 */
export function getFacebookOAuthURL({ role = 'USER', mode = 'login', redirectUri } = {}) {
    const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || ""
    if (!appId) {
        console.warn('NEXT_PUBLIC_FACEBOOK_APP_ID is not set in environment.')
    }
    const finalRedirectUri = redirectUri || getFacebookRedirectUri()

    const rootUrl = 'https://www.facebook.com/v21.0/dialog/oauth'
    const options = {
        client_id: appId,
        redirect_uri: finalRedirectUri,
        response_type: 'code',
        scope: 'email,public_profile',
        state: `facebook:${role}:${mode}`,
    }

    const qs = new URLSearchParams(options)
    return `${rootUrl}?${qs.toString()}`
}
