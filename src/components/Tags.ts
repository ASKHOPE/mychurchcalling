import { UserRole, UserCalling } from '../types';

export function renderRoleTag(role: UserRole): string {
    const icon = {
        admin: '🛡️',
        leader: '👑',
        member: '👤',
        viewer: '👁️'
    }[role] || '👤';

    return `<span class="role-tag ${role}">${icon} ${role}</span>`;
}

export function renderCallingTag(calling: UserCalling): string {
    let orgClass = 'member';
    if (calling.includes('Relief Society') || calling.startsWith('RS')) orgClass = 'rs';
    if (calling.includes('Elders Quorum') || calling.startsWith('EQ')) orgClass = 'eq';
    if (calling.includes('Young Women') || calling.startsWith('YW')) orgClass = 'yw';
    if (calling.includes('YM') || calling.includes('Young Men')) orgClass = 'ym';
    if (calling.includes('Bishop') || calling.includes('Clerk') || calling.includes('Secretary')) orgClass = 'bishopric';
    if (calling.includes('Sunday School') || calling.startsWith('SS')) orgClass = 'ss';

    return `<span class="calling-tag ${orgClass}">${calling}</span>`;
}
