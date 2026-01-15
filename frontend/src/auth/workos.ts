import { AuthState } from '../../../shared/types';
import { Storage } from '../utils/core';

// Convex HTTP endpoint base URL
const CONVEX_SITE_URL = 'https://agile-eagle-782.convex.site';

class WorkOSAuth {
    private state: AuthState = {
        isAuthenticated: false,
        isLoading: false,
        user: null,
        accessToken: null,
    };

    private listeners: Set<(state: AuthState) => void> = new Set();

    getState(): AuthState {
        return { ...this.state };
    }

    subscribe(listener: (state: AuthState) => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notify(): void {
        this.listeners.forEach((fn) => fn(this.getState()));
    }

    private setState(updates: Partial<AuthState>): void {
        this.state = { ...this.state, ...updates };
        this.notify();
    }

    /**
     * Initiates the WorkOS OAuth flow.
     */
    login(): void {
        this.setState({ isLoading: true });
        window.location.href = `${CONVEX_SITE_URL}/login`;
    }

    /**
     * Check URL for session data from OAuth callback redirect.
     */
    private checkUrlForSession(): boolean {
        const urlParams = new URLSearchParams(window.location.search);
        const encodedSession = urlParams.get('session');
        const encodedRefresh = urlParams.get('refresh');
        const authError = urlParams.get('auth_error');

        // Handle sign-out redirect from WorkOS
        const signout = urlParams.get('signout');
        if (signout) {
            this.logout();
            this.cleanUrl();
            return false;
        }

        if (authError) {
            console.error('Auth error:', authError);
            this.cleanUrl();
            return false;
        }

        if (encodedSession) {
            try {
                const sessionData = this.decodeBase64Url(encodedSession);
                console.log('✅ Decoded session data:', sessionData);

                this.setState(sessionData);
                Storage.save('auth_session', sessionData);

                if (encodedRefresh) {
                    const refreshToken = this.decodeBase64Url(encodedRefresh, false);
                    Storage.save('refresh_token', refreshToken);
                }

                this.cleanUrl();
                return true;
            } catch (e) {
                console.error('Failed to parse session from URL:', e);
            }
        }

        return false;
    }

    private decodeBase64Url(encoded: string, isJson = true): any {
        const standardBase64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
        const decoded = atob(standardBase64);
        return isJson ? JSON.parse(decoded) : decoded;
    }

    private cleanUrl(): void {
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    /**
     * Restores session from URL params or localStorage.
     */
    async restoreSession(): Promise<boolean> {
        if (this.checkUrlForSession()) return true;

        const stored = Storage.get('auth_session');

        if (stored) {
            try {
                if (stored.isAuthenticated && stored.user) {
                    this.setState(stored);
                    return true;
                }
            } catch (e) {
                console.error('Failed to parse stored session:', e);
                this.logout();
            }
        }
        return false;
    }

    /**
     * Logs out the current user.
     */
    logout(): void {
        Storage.remove('auth_session');
        Storage.remove('refresh_token');

        this.setState({
            isAuthenticated: false,
            isLoading: false,
            user: null,
            accessToken: null,
        });
    }

    /**
     * Gets the current access token.
     */
    getAccessToken(): string | null {
        return this.state.accessToken;
    }

    /**
     * Gets the Convex site URL.
     */
    getSiteUrl(): string {
        return CONVEX_SITE_URL;
    }
}

export const auth = new WorkOSAuth();
