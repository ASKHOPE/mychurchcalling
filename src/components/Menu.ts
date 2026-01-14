import { NavItem, PageRoute, User } from '../types';

const navItems: NavItem[] = [
  { id: 'home', label: 'Dashboard', icon: '🏠' },
  { id: 'users', label: 'User Management', icon: '👥' },
  { id: 'settings', label: 'Roles & Callings', icon: '🛠️' }, // Re-using settings or adding config
  { id: 'logs', label: 'Change Log', icon: '📜' },
  { id: 'bin', label: 'Recycle Bin', icon: '♻️' },
  { id: 'alerts', label: 'System Alerts', icon: '🔔' },
  { id: 'messages', label: 'Messages', icon: '💬' },
];

export function renderMenu(
  user: User | null,
  currentPage: PageRoute,
  _onNavigate: (page: PageRoute) => void,
  _onLogout: () => void
): string {
  const userAvatar = user?.picture || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user?.name;
  const userName = user?.name || 'Guest';
  const role = user?.role || 'member';

  const filteredItems = navItems.filter(item => {
    if (role === 'admin') return true;
    if (role === 'leader') return ['home', 'users', 'logs', 'bin', 'messages', 'settings'].includes(item.id);
    return ['home', 'messages', 'settings'].includes(item.id);
  });

  return `
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo">
          <span class="logo-icon">⛪</span>
          <span class="logo-text">MyCC</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        ${filteredItems
      .map(
        (item) => `
          <button class="nav-item ${currentPage === item.id ? 'active' : ''}" data-page="${item.id}">
            <span class="nav-icon">${item.icon}</span>
            <span class="nav-label">${item.label}</span>
          </button>
        `)
      .join('')}
      </nav>

      <div class="sidebar-footer">
        <div class="user-card">
          <img src="${userAvatar}" alt="${userName}" class="user-avatar" />
          <div class="user-info">
            <span class="user-name">${userName}</span>
            <span class="user-email">${user?.email || ''}</span>
          </div>
        </div>
        <button id="logout-btn" class="logout-btn">
          <span>🚪</span> Sign Out
        </button>
      </div>
    </aside>
  `;
}

export function attachMenuListeners(onNavigate: (page: PageRoute) => void, onLogout: () => void): void {
  document.querySelectorAll('.nav-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      onNavigate(btn.getAttribute('data-page') as PageRoute);
    });
  });
  document.getElementById('logout-btn')?.addEventListener('click', onLogout);
}
