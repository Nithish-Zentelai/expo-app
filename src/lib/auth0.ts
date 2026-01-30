import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri, useAuthRequest } from 'expo-auth-session';

// Auth0 Configuration
const AUTH0_DOMAIN = 'your-auth0-domain.auth0.com';
const AUTH0_CLIENT_ID = 'your-auth0-client-id';
const AUTH0_AUDIENCE = 'your-auth0-audience'; // Optional

// Complete Auth0 endpoints
const discovery = {
    authorizationEndpoint: `https://${AUTH0_DOMAIN}/authorize`,
    tokenEndpoint: `https://${AUTH0_DOMAIN}/oauth/token`,
    revocationEndpoint: `https://${AUTH0_DOMAIN}/oauth/revoke`,
    userInfoEndpoint: `https://${AUTH0_DOMAIN}/userinfo`,
};

// Redirect URI
const redirectUri = makeRedirectUri({
    scheme: 'com.matrix',
    path: 'oauth-callback',
});

/**
 * Request Auth0 access token and user info
 */
export const useAuth0 = () => {
    const [request, response, promptAsync] = useAuthRequest(
        {
            clientId: AUTH0_CLIENT_ID,
            redirectUri,
            scopes: ['openid', 'profile', 'email'],
            discoveryUrl: `https://${AUTH0_DOMAIN}/.well-known/openid-configuration`,
        },
        discovery
    );

    return { request, response, promptAsync };
};

/**
 * Save user to secure storage
 */
export const saveUser = async (user: any) => {
    try {
        await SecureStore.setItemAsync('auth0_user', JSON.stringify(user));
    } catch (error) {
        console.error('Error saving user:', error);
    }
};

/**
 * Get user from secure storage
 */
export const getUser = async () => {
    try {
        const userJSON = await SecureStore.getItemAsync('auth0_user');
        return userJSON ? JSON.parse(userJSON) : null;
    } catch (error) {
        console.error('Error getting user:', error);
        return null;
    }
};

/**
 * Logout user
 */
export const logout = async () => {
    try {
        await SecureStore.deleteItemAsync('auth0_user');
        await SecureStore.deleteItemAsync('auth0_access_token');
        
        // Optionally logout from Auth0
        const logoutUrl = `https://${AUTH0_DOMAIN}/v2/logout?client_id=${AUTH0_CLIENT_ID}&returnTo=com.matrix://oauth-callback`;
        await WebBrowser.openBrowserAsync(logoutUrl);
    } catch (error) {
        console.error('Error logging out:', error);
    }
};

/**
 * Exchange auth code for tokens and get user info
 */
export const exchangeCodeForToken = async (code: string, codeVerifier: string) => {
    try {
        const response = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: AUTH0_CLIENT_ID,
                code,
                code_verifier: codeVerifier,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
            }),
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error_description || 'Token exchange failed');
        }

        // Save tokens
        await SecureStore.setItemAsync('auth0_access_token', data.access_token);
        if (data.refresh_token) {
            await SecureStore.setItemAsync('auth0_refresh_token', data.refresh_token);
        }

        // Get user info
        const userResponse = await fetch(`https://${AUTH0_DOMAIN}/userinfo`, {
            headers: { Authorization: `Bearer ${data.access_token}` },
        });

        const user = await userResponse.json();
        
        // Save user
        await saveUser(user);
        
        return user;
    } catch (error) {
        console.error('Error exchanging code:', error);
        throw error;
    }
};
