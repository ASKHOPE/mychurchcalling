import { User } from '../types';
import { renderRoleTag, renderCallingTag } from '../components/Tags';
import { UI } from '../utils/core';

export function renderHomePage(user: User | null): string {
  const greeting = getGreeting();
  const userName = UI.escape(user?.name?.split(' ')[0] || 'there');
  const role = user?.role || 'member';
  const calling = user?.calling;

  const headerActions = `
    <button class="btn-secondary">
      <span>📅</span> ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
    </button>
  `;

  return `
    <div class="page home-page">
      ${UI.header(`${greeting}, ${userName}`, "Welcome back to your MyChurchCalling workspace.", headerActions)}

      <div class="user-status-row">
        <div class="tags-row">
          ${renderRoleTag(role)}
          ${calling ? renderCallingTag(calling) : ''}
        </div>
      </div>

      <section class="stats-grid">
        ${renderStatCard('⛪', '12', 'Active Groups', '↑ 2', 'linear-gradient(135deg, #6366f1, #8b5cf6)')}
        ${renderStatCard('👥', '148', 'Members', '+12%', 'linear-gradient(135deg, #10b981, #34d399)')}
        ${renderStatCard('📋', '84%', 'Calling Fulfillment', '—', 'linear-gradient(135deg, #f59e0b, #fbbf24)')}
        ${renderStatCard('🔔', '5', 'Pending Reviews', '!', 'linear-gradient(135deg, #ec4899, #f472b6)')}
      </section>

      <div class="dashboard-main-grid">
        <section class="card-section">
          ${UI.card(`
            <ul class="activity-list">
              ${renderActivityItem('Youth Conference Planning', 'Today, 7:00 PM', 'bg-indigo')}
              ${renderActivityItem('Sacrament Meeting Bulletin', 'Tomorrow, 9:00 AM', 'bg-emerald')}
              ${renderActivityItem('Ministering Interviews', 'Thursday, 6:00 PM', 'bg-amber')}
            </ul>
          `, '', 'Upcoming Assignments')}
        </section>

        <section class="card-section">
          ${UI.card(`
            <div class="quick-actions-grid redesign">
              ${renderQuickAction('🏷️', 'Update Calling')}
              ${renderQuickAction('📧', 'Notify Leaders', 'leader-only')}
              ${renderQuickAction('📄', 'Export Roster', 'member-plus')}
              ${renderQuickAction('⚙️', 'Unit Settings', 'admin-only')}
            </div>
          `, '', 'Quick Actions')}
          
          ${UI.card(`
            <div class="user-mini-profile">
               <img src="${user?.picture || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + userName}" class="mini-avatar" />
               <div class="mini-info">
                 <span class="mini-name">${userName}</span>
                 <div class="tags-row">
                   ${renderRoleTag(role)}
                   ${calling ? renderCallingTag(calling) : ''}
                 </div>
               </div>
            </div>
          `, 'mini', 'My Account')}
        </section>
      </div>
    </div>
  `;
}

function renderStatCard(icon: string, value: string, label: string, trend: string, bg: string): string {
  return `
    <div class="stat-card premium">
      <div class="stat-icon" style="background: ${bg};">${icon}</div>
      <div class="stat-content">
        <span class="stat-value">${value}</span>
        <span class="stat-label">${label}</span>
      </div>
      <span class="stat-trend ${trend.includes('↑') || trend.includes('+') ? 'positive' : trend === '!' ? 'negative' : 'neutral'}">${trend}</span>
    </div>
  `;
}

function renderActivityItem(text: string, time: string, markerClass: string): string {
  return `
    <li class="activity-item">
      <div class="activity-marker ${markerClass}"></div>
      <div class="activity-content">
        <span class="activity-text"><strong>${UI.escape(text)}</strong></span>
        <span class="activity-time">${UI.escape(time)}</span>
      </div>
    </li>
  `;
}

function renderQuickAction(icon: string, label: string, className = ''): string {
  return `
    <button class="action-tile ${className}">
      <span class="tile-icon">${icon}</span>
      <span class="tile-label">${UI.escape(label)}</span>
    </button>
  `;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}
