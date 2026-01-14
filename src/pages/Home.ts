import { User } from '../types';

export function renderHomePage(user: User | null): string {
  const greeting = getGreeting();
  const userName = user?.name?.split(' ')[0] || 'there';
  const role = user?.role || 'member';

  return `
    <div class="page home-page">
      <header class="page-header">
        <div class="header-main">
          <div class="header-content">
            <span class="welcome-text">${greeting},</span>
            <div class="user-display">
              <h1>${userName}</h1>
              ${renderRoleTag(role)}
            </div>
          </div>
          <p class="subtitle">Welcome to your MyChurchCalling workspace. Here's your ministry overview.</p>
        </div>
        <div class="header-actions">
          <button class="btn-secondary">
            <span>📅</span> ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </button>
        </div>
      </header>

      <section class="stats-grid">
        <div class="stat-card premium">
          <div class="stat-icon" style="background: linear-gradient(135deg, #6366f1, #8b5cf6);">⛪</div>
          <div class="stat-content">
            <span class="stat-value">12</span>
            <span class="stat-label">Active Groups</span>
          </div>
          <span class="stat-trend positive">↑ 2</span>
        </div>

        <div class="stat-card premium">
          <div class="stat-icon" style="background: linear-gradient(135deg, #10b981, #34d399);">👥</div>
          <div class="stat-content">
            <span class="stat-value">148</span>
            <span class="stat-label">Members</span>
          </div>
          <span class="stat-trend positive">+12%</span>
        </div>

        <div class="stat-card premium">
          <div class="stat-icon" style="background: linear-gradient(135deg, #f59e0b, #fbbf24);">📋</div>
          <div class="stat-content">
            <span class="stat-value">84%</span>
            <span class="stat-label">Calling Fulfillment</span>
          </div>
          <span class="stat-trend neutral">—</span>
        </div>

        <div class="stat-card premium">
          <div class="stat-icon" style="background: linear-gradient(135deg, #ec4899, #f472b6);">🔔</div>
          <div class="stat-content">
            <span class="stat-value">5</span>
            <span class="stat-label">Pending Reviews</span>
          </div>
          <span class="stat-trend negative">!</span>
        </div>
      </section>

      <div class="dashboard-main-grid">
        <section class="card-section">
          <div class="card premium-card">
            <div class="card-header">
              <h3>Upcoming Assignments</h3>
              <button class="btn-text">View All</button>
            </div>
            <ul class="activity-list">
              <li class="activity-item">
                <div class="activity-marker bg-indigo"></div>
                <div class="activity-content">
                  <span class="activity-text"><strong>Youth Conference Planning</strong> meeting</span>
                  <span class="activity-time">Today, 7:00 PM</span>
                </div>
              </li>
              <li class="activity-item">
                <div class="activity-marker bg-emerald"></div>
                <div class="activity-content">
                  <span class="activity-text"><strong>Sacrament Meeting</strong> bulletin update</span>
                  <span class="activity-time">Tomorrow, 9:00 AM</span>
                </div>
              </li>
              <li class="activity-item">
                <div class="activity-marker bg-amber"></div>
                <div class="activity-content">
                  <span class="activity-text"><strong>Ministering Interviews</strong> for Bishopric</span>
                  <span class="activity-time">Thursday, 6:00 PM</span>
                </div>
              </li>
            </ul>
          </div>
        </section>

        <section class="card-section">
          <div class="card premium-card">
            <div class="card-header">
              <h3>Quick Actions</h3>
            </div>
            <div class="quick-actions-grid redesign">
              <button class="action-tile">
                <span class="tile-icon">🏷️</span>
                <span class="tile-label">Update Calling</span>
              </button>
              <button class="action-tile leader-only">
                <span class="tile-icon">📧</span>
                <span class="tile-label">Notify Leaders</span>
              </button>
              <button class="action-tile member-plus">
                <span class="tile-icon">📄</span>
                <span class="tile-label">Export Roster</span>
              </button>
              <button class="action-tile admin-only">
                <span class="tile-icon">⚙️</span>
                <span class="tile-label">Unit Settings</span>
              </button>
            </div>
          </div>
          
          <div class="card premium-card mini">
            <div class="card-header">
              <h3>My Account</h3>
            </div>
            <div class="user-mini-profile">
               <img src="${user?.picture || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user?.name}" class="mini-avatar" />
               <div class="mini-info">
                 <span class="mini-name">${user?.name}</span>
                 ${renderRoleTag(role)}
               </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  `;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function renderRoleTag(role: string): string {
  const icon = {
    admin: '🛡️',
    leader: '👑',
    member: '👤',
    viewer: '👁️'
  }[role] || '👤';

  return `<span class="role-tag ${role}">${icon} ${role}</span>`;
}
