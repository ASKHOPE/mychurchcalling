import { AuthState } from '../types';

// @ts-ignore - Vite env
const CONVEX_URL = (import.meta as any).env?.VITE_CONVEX_URL?.replace('.cloud', '.site') || '';

interface LocalLoginResult {
    success: boolean;
    error?: string;
    user?: {
        _id: string;
        username: string;
        name: string;
        email?: string;
        role: string;
        calling: string;
    };
}

/**
 * Login with username and password
 */
export async function localLogin(username: string, password: string): Promise<LocalLoginResult> {
    try {
        const response = await fetch(`${CONVEX_URL}/local/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        return await response.json();
    } catch (error) {
        console.error('Local login error:', error);
        return { success: false, error: 'Connection failed' };
    }
}

/**
 * Register a new local user
 */
export async function localRegister(username: string, password: string, name: string, email?: string): Promise<{ success: boolean; error?: string }> {
    try {
        const response = await fetch(`${CONVEX_URL}/local/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, name, email }),
        });
        return await response.json();
    } catch (error) {
        console.error('Register error:', error);
        return { success: false, error: 'Connection failed' };
    }
}

/**
 * Store local session
 */
export function setLocalSession(user: LocalLoginResult['user']): void {
    if (!user) return;

    const session: AuthState = {
        isAuthenticated: true,
        isLoading: false,
        user: {
            _id: user._id,
            _creationTime: Date.now(),
            name: user.name,
            email: user.email || '',
            tokenIdentifier: `local|${user._id}`,
            role: user.role as any,
            calling: user.calling as any,
        },
        accessToken: `local_${user._id}`,
    };

    localStorage.setItem('local_session', JSON.stringify(session));
}

/**
 * Get local session
 */
export function getLocalSession(): AuthState | null {
    const stored = localStorage.getItem('local_session');
    if (!stored) return null;
    try {
        return JSON.parse(stored);
    } catch {
        return null;
    }
}

/**
 * Clear local session
 */
export function clearLocalSession(): void {
    localStorage.removeItem('local_session');
}
