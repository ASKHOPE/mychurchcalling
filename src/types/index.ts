// User from WorkOS/Convex
export type UserRole = 'admin' | 'member' | 'leader' | 'viewer';

export type UserCalling =
    | 'Bishop'
    | '1st Counselor'
    | '2nd Counselor'
    | 'Ward Clerk'
    | 'Ward Executive Secretary'
    | 'Relief Society President'
    | 'RS 1st Counselor'
    | 'RS 2nd Counselor'
    | 'Relief Society Secretary'
    | 'Elders Quorum President'
    | 'EQ 1st Counselor'
    | 'EQ 2nd Counselor'
    | 'Elders Quorum Secretary'
    | 'Young Women President'
    | 'YW 1st Counselor'
    | 'YW 2nd Counselor'
    | 'Young Women Secretary'
    | 'Sunday School President'
    | 'SS 1st Counselor'
    | 'SS 2nd Counselor'
    | 'YM 1st Assistant'
    | 'YM 2nd Assistant'
    | 'Member';

export interface User {
    _id: string;
    _creationTime: number;
    name: string;
    email: string;
    picture?: string;
    tokenIdentifier: string;
    role: UserRole;
    calling?: UserCalling;
    lastLoginAt?: number;
}

export interface Message {
    _id: string;
    _creationTime: number;
    body: string;
    author: string;
    userId?: string;
}

export interface AuthState {
    isAuthenticated: boolean;
    isLoading: boolean;
    user: User | null;
    accessToken: string | null;
}

// Navigation
export type PageRoute = 'home' | 'users' | 'messages' | 'settings' | 'alerts';

export interface NavItem {
    id: PageRoute;
    label: string;
    icon: string;
}

// User Management
export interface UserListItem {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    calling?: UserCalling;
    status: 'active' | 'pending' | 'suspended';
    lastActive: string;
}
