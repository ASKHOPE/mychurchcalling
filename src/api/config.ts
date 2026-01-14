import { auth } from '../auth/workos';

export interface AppRole {
    _id?: string;
    name: string;
    description: string;
    permissions: string[];
}

export interface AppCalling {
    _id?: string;
    name: string;
    category: string;
}

/**
 * Fetches dynamic roles from Convex.
 */
export async function fetchRoles(): Promise<AppRole[]> {
    const siteUrl = auth.getSiteUrl();
    try {
        const response = await fetch(`${siteUrl}/admin/roles`);
        const { roles } = await response.json();
        return roles;
    } catch (error) {
        console.error('Fetch roles error:', error);
        return [
            { name: 'admin', description: 'Full access', permissions: ['*'] },
            { name: 'leader', description: 'Leadership access', permissions: ['manage_users'] },
            { name: 'member', description: 'General access', permissions: [] }
        ];
    }
}

/**
 * Fetches dynamic callings from Convex.
 */
export async function fetchCallings(): Promise<AppCalling[]> {
    const siteUrl = auth.getSiteUrl();
    try {
        const response = await fetch(`${siteUrl}/admin/callings`);
        const { callings } = await response.json();
        return callings;
    } catch (error) {
        console.error('Fetch callings error:', error);
        return [
            { name: 'Bishop', category: 'General' },
            { name: 'Member', category: 'General' }
        ];
    }
}

/**
 * Creates a new dynamic role.
 */
export async function createRole(role: AppRole): Promise<{ success: boolean }> {
    const siteUrl = auth.getSiteUrl();
    try {
        const response = await fetch(`${siteUrl}/admin/roles`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(role),
        });
        return { success: response.ok };
    } catch (error) {
        return { success: false };
    }
}

/**
 * Creates a new church calling.
 */
export async function createCalling(calling: AppCalling): Promise<{ success: boolean }> {
    const siteUrl = auth.getSiteUrl();
    try {
        const response = await fetch(`${siteUrl}/admin/callings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(calling),
        });
        return { success: response.ok };
    } catch (error) {
        return { success: false };
    }
}
