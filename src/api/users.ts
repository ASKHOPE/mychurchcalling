import { UserListItem, UserCalling } from '../types';
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

        if (!users || users.length === 0) return getMockUsers();

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
        return getMockUsers(); // Fallback for demo
    }
}

function getMockUsers(): UserListItem[] {
    const mockData: { name: string; email: string; calling: UserCalling; role: any }[] = [
        { name: 'John Peterson', email: 'bishop@ward.org', calling: 'Bishop', role: 'leader' },
        { name: 'Sarah Miller', email: 'rs.president@ward.org', calling: 'Relief Society President', role: 'leader' },
        { name: 'Mike Johnson', email: 'eq.president@ward.org', calling: 'Elders Quorum President', role: 'leader' },
        { name: 'Emily White', email: 'yw.president@ward.org', calling: 'Young Women President', role: 'leader' },
        { name: 'David Smith', email: 'sunday.school@ward.org', calling: 'Sunday School President', role: 'leader' },
        { name: 'Robert Brown', email: 'clerk@ward.org', calling: 'Ward Clerk', role: 'leader' },
        { name: 'Alice Young', email: 'rs.secretary@ward.org', calling: 'Relief Society Secretary', role: 'leader' },
        { name: 'Tom Wilson', email: 'member1@ward.org', calling: 'Member', role: 'member' },
    ];

    return mockData.map((user, i) => ({
        id: `mock_${i}`,
        name: user.name,
        email: user.email,
        role: user.role,
        calling: user.calling,
        status: i % 3 === 0 ? 'active' : 'pending',
        lastActive: '2 days ago'
    }));
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
