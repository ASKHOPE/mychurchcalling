import { NavItem, PageRoute, User } from '../types';

const navItems: NavItem[] = [
  { id: 'home', label: 'Dashboard', icon: '🏠' },
  { id: 'users', label: 'User Management', icon: '👥' },
  { id: 'alerts', label: 'System Alerts', icon: '🔔' },
  { id: 'messages', label: 'Messages', icon: '💬' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

export function renderMenu(
  user: User | null,
  currentPage: PageRoute,
  _onNavigate: (page: PageRoute) => void,
  _onLogout: () => void
): string {
  const userAvatar = user?.picture || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user?.name;
  const userName = user?.name || 'Guest';
  const userEmail = user?.email || '';
  const role = user?.role || 'member';

  // Filter items based on role
  const filteredItems = navItems.filter(item => {
    if (role === 'admin') return true;
    if (role === 'leader') return ['home', 'users', 'messages', 'settings'].includes(item.id);
    if (role === 'member') return ['home', 'messages', 'settings'].includes(item.id);
    return ['home'].includes(item.id); // Guests/others
  });

  return `
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo">
          <span class="logo-icon">⛪</span>
          <span class="logo-text">MyChurchCalling</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        ${filteredItems
      .map(
        (item) => `
          <button 
            class="nav-item ${currentPage === item.id ? 'active' : ''}" 
            data-page="${item.id}"
          >
            <span class="nav-icon">${item.icon}</span>
            <span class="nav-label">${item.label}</span>
          </button>
        `
      )
      .join('')}
      </nav>

      <div class="sidebar-footer">
        <div class="user-card">
          <img src="${userAvatar}" alt="${userName}" class="user-avatar" />
          <div class="user-info">
            <span class="user-name">${userName}</span>
            <span class="user-email">${userEmail}</span>
          </div>
        </div>
        <button id="logout-btn" class="logout-btn">
          <span>🚪</span> Sign Out
        </button>
      </div>
    </aside>
  `;
}

export function attachMenuListeners(
  onNavigate: (page: PageRoute) => void,
  onLogout: () => void
): void {
  document.querySelectorAll('.nav-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      const page = btn.getAttribute('data-page') as PageRoute;
      onNavigate(page);
    });
  });

  document.getElementById('logout-btn')?.addEventListener('click', onLogout);
}
