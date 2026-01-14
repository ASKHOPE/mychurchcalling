import { User } from '../types';

export function renderHomePage(user: User | null): string {
    const greeting = getGreeting();
    const userName = user?.name?.split(' ')[0] || 'there';

    return `
    <div class="page home-page">
      <header class="page-header">
        <div>
          <h1>${greeting}, ${userName}!</h1>
          <p class="subtitle">Here's what's happening with your workspace today.</p>
        </div>
        <div class="header-actions">
          <button class="btn-secondary">
            <span>📅</span> Jan 14, 2026
          </button>
        </div>
      </header>

      <section class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #6366f1, #8b5cf6);">📊</div>
          <div class="stat-content">
            <span class="stat-value">2,847</span>
            <span class="stat-label">Total Users</span>
          </div>
          <span class="stat-trend positive">+12.5%</span>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #10b981, #34d399);">💬</div>
          <div class="stat-content">
            <span class="stat-value">1,234</span>
            <span class="stat-label">Messages</span>
          </div>
          <span class="stat-trend positive">+8.2%</span>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #f59e0b, #fbbf24);">⚡</div>
          <div class="stat-content">
            <span class="stat-value">99.9%</span>
            <span class="stat-label">Uptime</span>
          </div>
          <span class="stat-trend neutral">—</span>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #ec4899, #f472b6);">🔒</div>
          <div class="stat-content">
            <span class="stat-value">0</span>
            <span class="stat-label">Security Issues</span>
          </div>
          <span class="stat-trend positive">✓</span>
        </div>
      </section>

      <section class="dashboard-grid">
        <div class="card activity-card">
          <h3>Recent Activity</h3>
          <ul class="activity-list">
            <li class="activity-item">
              <span class="activity-icon">👤</span>
              <div class="activity-content">
                <span class="activity-text">New user signed up</span>
                <span class="activity-time">2 minutes ago</span>
              </div>
            </li>
            <li class="activity-item">
              <span class="activity-icon">💬</span>
              <div class="activity-content">
                <span class="activity-text">Message sent to #general</span>
                <span class="activity-time">15 minutes ago</span>
              </div>
            </li>
            <li class="activity-item">
              <span class="activity-icon">🔧</span>
              <div class="activity-content">
                <span class="activity-text">Settings updated</span>
                <span class="activity-time">1 hour ago</span>
              </div>
            </li>
            <li class="activity-item">
              <span class="activity-icon">🚀</span>
              <div class="activity-content">
                <span class="activity-text">Deployment completed</span>
                <span class="activity-time">3 hours ago</span>
              </div>
            </li>
          </ul>
        </div>

        <div class="card quick-actions-card">
          <h3>Quick Actions</h3>
          <div class="quick-actions-grid">
            <button class="quick-action-btn">
              <span>➕</span>
              <span>Add User</span>
            </button>
            <button class="quick-action-btn">
              <span>📨</span>
              <span>Send Message</span>
            </button>
            <button class="quick-action-btn">
              <span>📊</span>
              <span>View Reports</span>
            </button>
            <button class="quick-action-btn">
              <span>🔔</span>
              <span>Notifications</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  `;
}

function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
}
