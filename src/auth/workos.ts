import { AuthState, User } from '../types';

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

        console.log('🔍 Checking URL for session. Params:', {
            hasSession: !!encodedSession,
            hasRefresh: !!encodedRefresh,
            authError
        });

        // Handle sign-out redirect from WorkOS
        const signout = urlParams.get('signout');
        if (signout) {
            console.log('👋 Sign-out detected, clearing session');
            localStorage.removeItem('auth_session');
            localStorage.removeItem('refresh_token');
            window.history.replaceState({}, document.title, window.location.pathname);
            return false;
        }

        if (authError) {
            console.error('Auth error:', authError);
            window.history.replaceState({}, document.title, window.location.pathname);
            return false;
        }

        if (encodedSession) {
            try {
                // Decode URL-safe base64 (convert back to standard base64 first)
                const standardBase64 = encodedSession
                    .replace(/-/g, '+')
                    .replace(/_/g, '/');
                const sessionJson = atob(standardBase64);
                const sessionData = JSON.parse(sessionJson);

                console.log('✅ Decoded session data:', sessionData);

                this.setState(sessionData);
                localStorage.setItem('auth_session', JSON.stringify(sessionData));

                if (encodedRefresh) {
                    const standardRefresh = encodedRefresh
                        .replace(/-/g, '+')
                        .replace(/_/g, '/');
                    const refreshToken = atob(standardRefresh);
                    localStorage.setItem('refresh_token', refreshToken);
                }

                // Clean URL
                window.history.replaceState({}, document.title, window.location.pathname);

                console.log('✅ Session restored from URL!');
                return true;
            } catch (e) {
                console.error('Failed to parse session from URL:', e);
            }
        }

        return false;
    }

    /**
     * Restores session from URL params or localStorage.
     */
    async restoreSession(): Promise<boolean> {
        // First check URL for session data from OAuth callback
        if (this.checkUrlForSession()) {
            return true;
        }

        // Then check localStorage
        const stored = localStorage.getItem('auth_session');

        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (parsed.isAuthenticated && parsed.user) {
                    this.setState(parsed);
                    console.log('✅ Session restored from localStorage:', parsed);
                    return true;
                }
            } catch (e) {
                console.error('Failed to parse stored session:', e);
                localStorage.removeItem('auth_session');
                localStorage.removeItem('refresh_token');
            }
        }
        return false;
    }

    /**
     * Logs out the current user.
     */
    logout(): void {
        localStorage.removeItem('auth_session');
        localStorage.removeItem('refresh_token');

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
