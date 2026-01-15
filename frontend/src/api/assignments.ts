import { auth } from '../auth/workos';

export interface Speaker {
    name: string;
    topic?: string;
    duration?: number;
}

export interface SacramentMeeting {
    conductingLeader?: string;
    openingHymn?: string;
    sacramentHymn?: string;
    interludeHymn?: string;
    closingHymn?: string;
    specialHymn?: string;
    openingPrayer?: string;
    closingPrayer?: string;
    speakers: Speaker[];
    announcements?: string;
}

export interface ClassInfo {
    topic: string;
    scripture?: string;
    instructor?: string;
    notes?: string;
}

export interface SundayAssignment {
    _id: string;
    year: number;
    month: number;
    sundayNumber: number;
    date: string;
    sacrament: SacramentMeeting;
    sundaySchool: ClassInfo;
    elderQuorum: ClassInfo;
    reliefSociety: ClassInfo;
    youngWomen?: ClassInfo;
    youngMen?: ClassInfo;
    primary?: ClassInfo;
    status: string;
    createdBy?: string;
    updatedAt: number;
    notes?: string;
}

export interface Hymn {
    _id: string;
    number: number;
    title: string;
    category: string;
    isFavorite?: boolean;
}

export interface Member {
    _id: string;
    name: string;
    phone?: string;
    email?: string;
    callings: string[];
    isActive: boolean;
}

const getSiteUrl = () => auth.getSiteUrl();

/**
 * Get assignments for a specific month
 */
export async function getAssignmentsByMonth(year: number, month: number): Promise<SundayAssignment[]> {
    try {
        const response = await fetch(`${getSiteUrl()}/assignments?year=${year}&month=${month}`);
        const { assignments } = await response.json();
        return assignments || [];
    } catch (error) {
        console.error('Error fetching assignments:', error);
        return [];
    }
}

/**
 * Get assignment for a specific date
 */
export async function getAssignmentByDate(date: string): Promise<SundayAssignment | null> {
    try {
        const response = await fetch(`${getSiteUrl()}/assignments/date?date=${date}`);
        const { assignment } = await response.json();
        return assignment;
    } catch (error) {
        console.error('Error fetching assignment:', error);
        return null;
    }
}

/**
 * Get upcoming assignments
 */
export async function getUpcomingAssignments(): Promise<SundayAssignment[]> {
    try {
        const response = await fetch(`${getSiteUrl()}/assignments/upcoming`);
        const { assignments } = await response.json();
        return assignments || [];
    } catch (error) {
        console.error('Error fetching upcoming:', error);
        return [];
    }
}

/**
 * Create a new assignment
 */
export async function createAssignment(data: Partial<SundayAssignment>): Promise<{ success: boolean; id?: string }> {
    try {
        const response = await fetch(`${getSiteUrl()}/assignments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return await response.json();
    } catch (error) {
        return { success: false };
    }
}

/**
 * Update an assignment
 */
export async function updateAssignment(id: string, data: Partial<SundayAssignment>): Promise<{ success: boolean }> {
    try {
        const response = await fetch(`${getSiteUrl()}/assignments/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, ...data }),
        });
        return await response.json();
    } catch (error) {
        return { success: false };
    }
}

/**
 * Delete an assignment
 */
export async function deleteAssignment(id: string): Promise<{ success: boolean }> {
    try {
        const response = await fetch(`${getSiteUrl()}/assignments/delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
        });
        return await response.json();
    } catch (error) {
        return { success: false };
    }
}

/**
 * Get all hymns
 */
export async function getHymns(category?: string): Promise<Hymn[]> {
    try {
        const url = category ? `${getSiteUrl()}/hymns?category=${category}` : `${getSiteUrl()}/hymns`;
        const response = await fetch(url);
        const { hymns } = await response.json();
        return hymns || [];
    } catch (error) {
        console.error('Error fetching hymns:', error);
        return [];
    }
}

/**
 * Get all members
 */
export async function getMembers(): Promise<Member[]> {
    try {
        const response = await fetch(`${getSiteUrl()}/members`);
        const { members } = await response.json();
        return members || [];
    } catch (error) {
        console.error('Error fetching members:', error);
        return [];
    }
}

/**
 * Add a member
 */
export async function addMember(data: { name: string; phone?: string; email?: string; callings: string[] }): Promise<{ success: boolean }> {
    try {
        const response = await fetch(`${getSiteUrl()}/members`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return await response.json();
    } catch (error) {
        return { success: false };
    }
}

/**
 * Seed initial data
 */
export async function seedAssignmentsData(): Promise<void> {
    await fetch(`${getSiteUrl()}/seed`);
}

/**
 * Get month name
 */
export function getMonthName(month: number): string {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month - 1] || '';
}

/**
 * Format date for display
 */
export function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

/**
 * Get ordinal suffix
 */
export function getOrdinal(n: number): string {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
