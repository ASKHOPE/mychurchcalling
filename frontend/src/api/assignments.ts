import { auth } from '../auth/workos';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface HymnReference {
    hymnNumber: number;
    title: string;
    url?: string;
}

export interface SpeakerAssignment {
    speakerName: string;
    organization?: string;
    topic?: string;
    sourceType?: string;
    sourceTitle?: string;
    sourceUrl?: string;
    duration?: number;
    order: number;
    assignedLesson?: string; // Format: "cfm:id" or "principle:id" or "talk:id"
}

export interface ClassAssignment {
    lessonType: string;
    scriptureBlock?: string;
    lessonTitle?: string;
    lessonUrl?: string;
    principleSelected?: string;
    principleUrl?: string;
    conferenceTalkSelected?: string;
    conferenceTalkUrl?: string;
    instructor?: string;
    notes?: string;
    classType?: string;
    assignedLesson?: string; // Format: "cfm:id" or "principle:id" or "talk:id"
}

export interface SundayAssignment {
    _id: string;
    year: number;
    month: number;
    monthName: string;
    sundayNumber: number;
    date: string;
    weekRange: string;
    isFastSunday?: boolean;
    meetingType?: 'standard' | 'fast' | 'conference' | 'devotional';
    meetingSubtype?: 'christmas' | 'easter' | 'special' | 'asia-area' | 'stake' | 'ward' | 'apostle' | 'other';

    hymns: {
        opening?: HymnReference;
        sacrament?: HymnReference;
        interlude?: HymnReference;
        special?: HymnReference;
        closing?: HymnReference;
    };

    sacramentMeeting: {
        conductingLeader?: string;
        presiding?: string;
        openingPrayer?: string;
        closingPrayer?: string;
        announcements?: string;
    };

    talks: SpeakerAssignment[];
    sundaySchool: ClassAssignment;
    ysaSundaySchool?: ClassAssignment;
    eldersQuorum: ClassAssignment;
    reliefSociety: ClassAssignment;
    youngWomen?: ClassAssignment;
    youngMen?: ClassAssignment;
    primary?: ClassAssignment;

    status: string;
    createdBy?: string;
    updatedBy?: string;
    updatedAt: number;
    notes?: string;
}

export interface Hymn {
    _id: string;
    number: number;
    title: string;
    category: string;
    url?: string;
    isFavorite?: boolean;
}

export interface CfmLesson {
    _id: string;
    year: number;
    weekNumber: number;
    weekRange: string;
    scriptureBlock: string;
    lessonTitle: string;
    url: string;
    book?: string;
}

export interface GospelPrinciple {
    _id: string;
    number: number;
    title: string;
    url: string;
    category?: string;
}

export interface ConferenceTalk {
    _id: string;
    title: string;
    speaker: string;
    conferenceSession: string;
    year: number;
    month: string;
    url: string;
    topic?: string;
}

export interface Delegation {
    _id: string;
    calling: string;
    assignedPerson: string;
    organization: string;
    permissions: string[];
    isActive: boolean;
}

const getSiteUrl = () => auth.getSiteUrl();

// ============================================
// ASSIGNMENTS API
// ============================================

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

// ============================================
// REFERENCE INDEXES API
// ============================================

export async function getHymns(category?: string): Promise<Hymn[]> {
    try {
        const url = category
            ? `${getSiteUrl()}/indexes/hymns?category=${category}`
            : `${getSiteUrl()}/indexes/hymns`;
        const response = await fetch(url);
        const { hymns } = await response.json();
        return hymns || [];
    } catch (error) {
        console.error('Error fetching hymns:', error);
        return [];
    }
}

export async function getCfmLessons(year: number = 2026): Promise<CfmLesson[]> {
    try {
        const response = await fetch(`${getSiteUrl()}/indexes/cfm?year=${year}`);
        const { lessons } = await response.json();
        return lessons || [];
    } catch (error) {
        console.error('Error fetching CFM lessons:', error);
        return [];
    }
}

export async function getGospelPrinciples(): Promise<GospelPrinciple[]> {
    try {
        const response = await fetch(`${getSiteUrl()}/indexes/gospel-principles`);
        const { principles } = await response.json();
        return principles || [];
    } catch (error) {
        console.error('Error fetching gospel principles:', error);
        return [];
    }
}

export async function getConferenceTalks(year?: number): Promise<ConferenceTalk[]> {
    try {
        const url = year
            ? `${getSiteUrl()}/indexes/conference-talks?year=${year}`
            : `${getSiteUrl()}/indexes/conference-talks`;
        const response = await fetch(url);
        const { talks } = await response.json();
        return talks || [];
    } catch (error) {
        console.error('Error fetching conference talks:', error);
        return [];
    }
}

export async function getDelegations(organization?: string): Promise<Delegation[]> {
    try {
        const url = organization
            ? `${getSiteUrl()}/indexes/delegation?organization=${organization}`
            : `${getSiteUrl()}/indexes/delegation`;
        const response = await fetch(url);
        const { delegations } = await response.json();
        return delegations || [];
    } catch (error) {
        console.error('Error fetching delegations:', error);
        return [];
    }
}

export interface AnnouncementIndex {
    _id: string;
    content: string;
    type: string;
    targetDate?: string;
    category?: string;
    active: boolean;
}

export async function getAnnouncements(): Promise<AnnouncementIndex[]> {
    try {
        const response = await fetch(`${getSiteUrl()}/indexes/announcements`);
        const { announcements } = await response.json();
        return announcements || [];
    } catch (error) {
        console.error('Error fetching announcements:', error);
        return [];
    }
}

export async function createAnnouncement(data: Partial<AnnouncementIndex>): Promise<{ success: boolean; id?: string }> {
    try {
        const response = await fetch(`${getSiteUrl()}/indexes/announcements`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return await response.json();
    } catch (error) {
        return { success: false };
    }
}

export interface MeetingTypeIndex {
    _id: string;
    name: string;
    label: string;
    icon?: string;
    subtypes?: string[];
    active: boolean;
}

export async function getMeetingTypes(): Promise<MeetingTypeIndex[]> {
    try {
        const response = await fetch(`${getSiteUrl()}/indexes/meeting-types`);
        const { types } = await response.json();
        return types || [];
    } catch (error) {
        console.error('Error fetching meeting types:', error);
        return [];
    }
}

export async function updateMeetingType(id: string, data: Partial<MeetingTypeIndex>): Promise<{ success: boolean }> {
    try {
        const response = await fetch(`${getSiteUrl()}/indexes/meeting-types`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, ...data }),
        });
        return await response.json();
    } catch (error) {
        return { success: false };
    }
}

// ============================================
// SEED DATA
// ============================================

export async function seedAllData(): Promise<void> {
    await fetch(`${getSiteUrl()}/seed`);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getMonthName(month: number): string {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month - 1] || '';
}

export function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

export function formatShortDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function getOrdinal(n: number): string {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function formatHymn(hymn?: HymnReference): string {
    if (!hymn) return 'TBD';
    return `#${hymn.hymnNumber} - ${hymn.title}`;
}
