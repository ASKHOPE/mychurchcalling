// User from WorkOS/Convex
export type UserRole = 'admin' | 'member' | 'leader' | 'viewer';

export type UserCalling =
    | 'Bishop' | '1st Counselor' | '2nd Counselor' | 'Ward Clerk' | 'Ward Executive Secretary'
    | 'Relief Society President' | 'RS 1st Counselor' | 'RS 2nd Counselor' | 'Relief Society Secretary'
    | 'Elders Quorum President' | 'EQ 1st Counselor' | 'EQ 2nd Counselor' | 'Elders Quorum Secretary'
    | 'Young Women President' | 'YW 1st Counselor' | 'YW 2nd Counselor' | 'Young Women Secretary'
    | 'Sunday School President' | 'SS 1st Counselor' | 'SS 2nd Counselor'
    | 'YM 1st Assistant' | 'YM 2nd Assistant' | 'Member';

export interface User {
    _id: string;
    _creationTime: number;
    name: string;
    email: string;
    picture?: string;
    tokenIdentifier: string;
    role: UserRole;
    calling?: UserCalling;
    isArchived?: boolean;
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
export type PageRoute = 'home' | 'assignments' | 'users' | 'messages' | 'settings' | 'alerts' | 'bin' | 'logs';

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
    isArchived: boolean;
    status: 'active' | 'pending' | 'suspended';
    lastActive: string;
}

// Audit Log
export interface AuditLogEntry {
    _id: string;
    action: string;
    actor: string;
    target: string;
    description: string;
    timestamp: number;
    metadata?: any;
}

// Recycle Bin
export interface BinItem {
    _id: string;
    type: string;
    originalId: string;
    data: any;
    deletedAt: number;
    deletedBy: string;
    expiresAt: number;
}

// Roles & Callings Config
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
