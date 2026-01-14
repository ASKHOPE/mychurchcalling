// User from WorkOS/Convex
export interface User {
    _id: string;
    _creationTime: number;
    name: string;
    email: string;
    picture?: string;
    tokenIdentifier: string;
    role: 'admin' | 'member' | 'viewer';
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
export type PageRoute = 'home' | 'users' | 'messages' | 'settings';

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
    role: User['role'];
    status: 'active' | 'pending' | 'suspended';
    lastActive: string;
}
