import { User } from '../types';

export function renderSettingsPage(user: User | null): string {
    return `
    <div class="page settings-page">
      <header class="page-header">
        <div>
          <h1>Settings</h1>
          <p class="subtitle">Manage your account and preferences.</p>
        </div>
      </header>
      <div class="settings-grid">
        <div class="card premium-card">
          <h3>Profile</h3>
          <div class="profile-section">
            <img src="${user?.picture || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user?.name}" alt="${user?.name}" class="profile-avatar" />
            <div class="profile-info">
              <span class="profile-name">${user?.name}</span>
              <span class="profile-email">${user?.email}</span>
              <span class="profile-role">${user?.role}</span>
            </div>
          </div>
        </div>
        <div class="card premium-card admin-only">
          <h3>Unit Configuration</h3>
          <p class="subtitle">Exclusive admin tools for unit management.</p>
          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-label">Organization Name</span>
              <span class="setting-desc">Change the display name for this unit</span>
            </div>
            <button class="btn-secondary">Edit</button>
          </div>
        </div>
        <div class="card premium-card">
          <h3>Security</h3>
          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-label">Two-Factor Authentication</span>
              <span class="setting-desc">Add an extra layer of security</span>
            </div>
            <button class="btn-secondary">Enable</button>
          </div>
        </div>
      </div>
    </div>
  `;
}
