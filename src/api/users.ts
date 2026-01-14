import { UserListItem } from '../types';
import { auth } from '../auth/workos';

interface WorkOSUser {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    profilePictureUrl: string | null;
    emailVerified: boolean;
    createdAt: string;
    updatedAt: string;
}

/**
 * Fetches users from WorkOS via Convex HTTP action.
 */
export async function fetchUsers(): Promise<UserListItem[]> {
    const siteUrl = auth.getSiteUrl();

    try {
        const response = await fetch(`${siteUrl}/users`, {
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch users');
        }

        const { users } = await response.json();

        return users.map((user: WorkOSUser): UserListItem => ({
            id: user.id,
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
            email: user.email,
            role: 'member',
            status: user.emailVerified ? 'active' : 'pending',
            lastActive: formatDate(user.updatedAt),
        }));
    } catch (error) {
        console.error('Failed to fetch users:', error);
        return [];
    }
}

/**
 * Invites a new user via WorkOS.
 */
export async function inviteUser(email: string): Promise<{ success: boolean; message: string }> {
    const siteUrl = auth.getSiteUrl();

    try {
        const response = await fetch(`${siteUrl}/users/invite`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to send invitation');
        }

        const invitation = await response.json();
        return {
            success: true,
            message: `Invitation sent to ${invitation.email}`,
        };
    } catch (error) {
        console.error('Failed to invite user:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to send invitation',
        };
    }
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString();
}
