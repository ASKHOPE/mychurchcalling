import { NavItem, PageRoute, User } from '../types';

const navItems: NavItem[] = [
  { id: 'home', label: 'Dashboard', icon: '🏠' },
  { id: 'users', label: 'User Management', icon: '👥' },
  { id: 'messages', label: 'Messages', icon: '💬' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

export function renderMenu(
  user: User | null,
  currentPage: PageRoute,
  onNavigate: (page: PageRoute) => void,
  onLogout: () => void
): string {
  const userAvatar = user?.picture || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default';
  const userName = user?.name || 'Guest';
  const userEmail = user?.email || '';

  return `
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo">
          <span class="logo-icon">⛪</span>
          <span class="logo-text">MyChurchCalling</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        ${navItems
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
