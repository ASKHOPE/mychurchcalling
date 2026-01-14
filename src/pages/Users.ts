import { UserListItem, UserRole, UserCalling } from '../types';
import { fetchUsers, inviteUser, updateUserDetails, moveToBin } from '../api/users';
import { renderRoleTag, renderCallingTag } from '../components/Tags';
import { UI } from '../utils/core';

let currentUsers: UserListItem[] = [];
let showArchived = false;

export function renderUsersPage(users: UserListItem[] = []): string {
  currentUsers = users;
  const headerActions = `
    <div class="header-actions">
      <button class="btn-secondary" id="toggle-archived">
        ${showArchived ? '📁 View Active' : '📦 View Archived'}
      </button>
      ${UI.button('Invite User', 'invite-user-btn', 'btn-primary', '➕')}
    </div>
  `;

  return `
    <div class="page users-page">
      ${UI.header('User Management', 'Manage your team members and their access.', headerActions)}

      <div class="card users-table-card">
        <div class="table-header">
          <input type="text" class="input-glass search-input" placeholder="Search users..." id="user-search" />
          <div class="filter-group">
            ${renderFilter('role-filter', [
    { value: '', label: 'All Roles' },
    { value: 'admin', label: 'Admin' },
    { value: 'leader', label: 'Leader' },
    { value: 'member', label: 'Member' }
  ])}
          </div>
        </div>

        <table class="users-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role & Calling</th>
              <th>Status</th>
              <th>Last Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="users-table-body">
            ${renderUserRows(users)}
          </tbody>
        </table>
      </div>

      <!-- Invite User Modal -->
      <div class="modal" id="invite-modal" style="display: none;">
        <div class="modal-backdrop"></div>
        <div class="modal-content glass-container">
          <h2>Invite New User</h2>
          <form id="invite-form">
            <div class="form-group">
              <label for="invite-email">Email Address</label>
              <input type="email" id="invite-email" class="input-glass" placeholder="user@company.com" required />
            </div>
            <div class="form-actions">
              ${UI.button('Cancel', 'cancel-invite', 'btn-secondary')}
              ${UI.button('Send Invitation', 'submit-invite', 'btn-primary')}
            </div>
          </form>
        </div>
      </div>

      <!-- Edit User Modal -->
      <div class="modal" id="edit-modal" style="display: none;">
        <div class="modal-backdrop"></div>
        <div class="modal-content glass-container">
          <h2>Edit User</h2>
          <form id="edit-form">
            <input type="hidden" id="edit-user-id" />
            <div class="form-group"><div id="edit-user-display" class="user-cell"></div></div>
            <div class="form-group">
              <label for="edit-role">System Role</label>
              <select id="edit-role" class="input-glass select-input">
                <option value="admin">Admin</option>
                <option value="leader">Leader</option>
                <option value="member">Member</option>
              </select>
            </div>
            <div class="form-group">
              <label for="edit-calling">Church Calling</label>
              <select id="edit-calling" class="input-glass select-input">
                ${getCallingOptions().map(c => `<option value="${c}">${c}</option>`).join('')}
              </select>
            </div>
            <div class="form-actions">
              ${UI.button('Cancel', 'cancel-edit', 'btn-secondary')}
              ${UI.button('Save Changes', 'submit-edit', 'btn-primary')}
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
}

function renderUserRows(users: UserListItem[]): string {
  const filtered = users.filter(u => !!u.isArchived === showArchived);
  if (filtered.length === 0) return '<tr><td colspan="5" class="empty-cell">No users found.</td></tr>';
  return filtered.map(renderUserRow).join('');
}

function renderFilter(id: string, options: { value: string, label: string }[]): string {
  return `<select class="input-glass select-input" id="${id}">${options.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}</select>`;
}

function renderUserRow(user: UserListItem): string {
  return `
    <tr data-user-id="${user.id}">
      <td>
        <div class="user-cell">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}" class="table-avatar" />
          <div><span class="user-name">${UI.escape(user.name)}</span><span class="user-email">${UI.escape(user.email)}</span></div>
        </div>
      </td>
      <td><div class="tags-row">${renderRoleTag(user.role)}${user.calling ? renderCallingTag(user.calling) : ''}</div></td>
      <td><span class="status-badge ${user.isArchived ? 'status-suspended' : 'status-active'}">${user.isArchived ? 'Archived' : user.status}</span></td>
      <td>${UI.escape(user.lastActive)}</td>
      <td>
        <div class="action-buttons">
          <button class="icon-btn edit-btn" data-id="${user.id}" title="Edit">✏️</button>
          <button class="icon-btn archive-btn" data-id="${user.id}" title="${user.isArchived ? 'Unarchive' : 'Archive'}">${user.isArchived ? '📥' : '📦'}</button>
          <button class="icon-btn delete-btn" data-id="${user.id}" title="Move to Bin">🗑️</button>
        </div>
      </td>
    </tr>
  `;
}

export async function loadUsers(): Promise<void> {
  const users = await fetchUsers();
  currentUsers = users;
  const tbody = document.getElementById('users-table-body');
  if (tbody) tbody.innerHTML = renderUserRows(users);
}

export function attachUsersListeners(): void {
  const tbody = document.getElementById('users-table-body');

  // Navigation Toggles
  document.getElementById('toggle-archived')?.addEventListener('click', (e) => {
    showArchived = !showArchived;
    const btn = e.currentTarget as HTMLButtonElement;
    btn.innerHTML = showArchived ? '📁 View Active' : '📦 View Archived';
    loadUsers();
  });

  // Table Actions
  tbody?.addEventListener('click', async (e) => {
    const target = e.target as HTMLElement;
    const btn = target.closest('.icon-btn') as HTMLElement;
    if (!btn) return;
    const userId = btn.getAttribute('data-id')!;

    if (btn.classList.contains('edit-btn')) {
      handleOpenEditModal(userId);
    } else if (btn.classList.contains('archive-btn')) {
      const user = currentUsers.find(u => u.id === userId);
      const res = await updateUserDetails(userId, { isArchived: !user?.isArchived });
      if (res.success) loadUsers();
    } else if (btn.classList.contains('delete-btn')) {
      if (confirm('Move this user to Recycle Bin? They will be permanently removed in 30 days.')) {
        const res = await moveToBin(userId, 'Current Admin');
        if (res.success) loadUsers();
      }
    }
  });

  // Modal Handlers
  document.getElementById('invite-user-btn')?.addEventListener('click', () => {
    document.getElementById('invite-modal')!.style.display = 'flex';
  });

  document.getElementById('invite-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = (document.getElementById('invite-email') as HTMLInputElement).value;
    const res = await inviteUser(email);
    alert(res.message);
    if (res.success) {
      document.getElementById('invite-modal')!.style.display = 'none';
      loadUsers();
    }
  });

  document.getElementById('edit-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userId = (document.getElementById('edit-user-id') as HTMLInputElement).value;
    const role = (document.getElementById('edit-role') as HTMLSelectElement).value as UserRole;
    const calling = (document.getElementById('edit-calling') as HTMLSelectElement).value as UserCalling;
    const res = await updateUserDetails(userId, { role, calling });
    if (res.success) {
      document.getElementById('edit-modal')!.style.display = 'none';
      loadUsers();
    }
  });

  document.querySelectorAll('.modal-backdrop, #cancel-invite, #cancel-edit').forEach(el => {
    el.addEventListener('click', () => {
      document.querySelectorAll('.modal').forEach(m => (m as HTMLElement).style.display = 'none');
    });
  });

  loadUsers();
}

function handleOpenEditModal(userId: string) {
  const user = currentUsers.find(u => u.id === userId);
  if (!user) return;
  (document.getElementById('edit-user-id') as HTMLInputElement).value = user.id;
  (document.getElementById('edit-role') as HTMLSelectElement).value = user.role;
  (document.getElementById('edit-calling') as HTMLSelectElement).value = user.calling || 'Member';
  document.getElementById('edit-user-display')!.innerHTML = `
    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}" class="table-avatar" />
    <div><strong>${UI.escape(user.name)}</strong><br/><small>${UI.escape(user.email)}</small></div>
  `;
  document.getElementById('edit-modal')!.style.display = 'flex';
}

function getCallingOptions(): UserCalling[] {
  return [
    'Bishop', '1st Counselor', '2nd Counselor', 'Ward Clerk', 'Ward Executive Secretary',
    'Relief Society President', 'RS 1st Counselor', 'RS 2nd Counselor', 'Relief Society Secretary',
    'Elders Quorum President', 'EQ 1st Counselor', 'EQ 2nd Counselor', 'Elders Quorum Secretary',
    'Young Women President', 'YW 1st Counselor', 'YW 2nd Counselor', 'Young Women Secretary',
    'Sunday School President', 'SS 1st Counselor', 'SS 2nd Counselor', 'Member'
  ];
}
