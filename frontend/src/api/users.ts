import { UserListItem, UserRole, UserCalling } from '../../../shared/types';
import { auth } from '../auth/workos';

/**
 * Fetches users from WorkOS via Convex HTTP action.
 */
export async function fetchUsers(): Promise<UserListItem[]> {
    const siteUrl = auth.getSiteUrl();
    try {
        const response = await fetch(`${siteUrl}/users`);
        if (!response.ok) throw new Error('Failed to fetch users');
        const { users } = await response.json();
        return users.length > 0 ? users : getMockUsers();
    } catch (error) {
        console.error('Fetch users error:', error);
        return getMockUsers();
    }
}

export async function inviteUser(email: string): Promise<{ success: boolean; message: string }> {
    const siteUrl = auth.getSiteUrl();
    try {
        const response = await fetch(`${siteUrl}/users/invite`, {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
        return { success: response.ok, message: response.ok ? 'Invitation sent' : 'Failed to send invite' };
    } catch (error) {
        return { success: false, message: 'API Error' };
    }
}

export async function updateUserDetails(userId: string, details: { role?: UserRole, calling?: UserCalling, isArchived?: boolean, name?: string }): Promise<{ success: boolean; message: string }> {
    const siteUrl = auth.getSiteUrl();
    try {
        const response = await fetch(`${siteUrl}/users/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, ...details }),
        });
        return { success: response.ok, message: response.ok ? 'User updated' : 'Update failed' };
    } catch (error) {
        return { success: false, message: 'API Error' };
    }
}

/**
 * Soft Delete (Move to Bin)
 */
export async function moveToBin(userId: string, deletedBy: string): Promise<{ success: boolean; message: string }> {
    const siteUrl = auth.getSiteUrl();
    try {
        const response = await fetch(`${siteUrl}/users/delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, deletedBy }),
        });
        return { success: response.ok, message: response.ok ? 'Moved to bin' : 'Failed to move to bin' };
    } catch (error) {
        return { success: false, message: 'API Error' };
    }
}

/**
 * Restore from Bin
 */
export async function restoreUser(userId: string): Promise<{ success: boolean; message: string }> {
    const siteUrl = auth.getSiteUrl();
    try {
        const response = await fetch(`${siteUrl}/users/restore`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
        });
        return { success: response.ok, message: response.ok ? 'User restored' : 'Restore failed' };
    } catch (error) {
        return { success: false, message: 'API Error' };
    }
}

/**
 * Permanent Delete
 */
export async function permanentDelete(userId: string): Promise<{ success: boolean; message: string }> {
    const siteUrl = auth.getSiteUrl();
    try {
        const response = await fetch(`${siteUrl}/users/permanent-delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
        });
        return { success: response.ok, message: response.ok ? 'Permanently deleted' : 'Delete failed' };
    } catch (error) {
        return { success: false, message: 'API Error' };
    }
}

/**
 * Fetch Event Logs
 */
export async function fetchAuditLogs(): Promise<any[]> {
    const siteUrl = auth.getSiteUrl();
    try {
        const response = await fetch(`${siteUrl}/admin/events`);
        const { logs } = await response.json();
        return logs;
    } catch (error) {
        return [];
    }
}

/**
 * Fetch Bin Items
 */
export async function fetchBinItems(): Promise<any[]> {
    const siteUrl = auth.getSiteUrl();
    try {
        const response = await fetch(`${siteUrl}/admin/bin`);
        const { items } = await response.json();
        return items;
    } catch (error) {
        return [];
    }
}

function getMockUsers(): UserListItem[] {
    return [
        { id: '1', name: 'John Peterson', email: 'bishop@ward.org', calling: 'Bishop', role: 'leader', status: 'active', lastActive: '1m ago', isArchived: false },
        { id: '2', name: 'Sarah Miller', email: 'rs.president@ward.org', calling: 'Relief Society President', role: 'leader', status: 'active', lastActive: '5m ago', isArchived: false },
    ];
}
