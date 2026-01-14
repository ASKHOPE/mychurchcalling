import { UserListItem } from '../types';
import { fetchUsers, inviteUser } from '../api/users';
import { renderRoleTag, renderCallingTag } from '../components/Tags';
import { UI } from '../utils/core';

export function renderUsersPage(users: UserListItem[] = []): string {
  const headerActions = UI.button('Invite User', 'invite-user-btn', 'btn-primary', '➕');

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
    { value: 'member', label: 'Member' },
    { value: 'viewer', label: 'Viewer' }
  ])}
            ${renderFilter('status-filter', [
    { value: '', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'pending', label: 'Pending' },
    { value: 'suspended', label: 'Suspended' }
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
            ${users.length > 0
      ? users.map(renderUserRow).join('')
      : '<tr><td colspan="5" class="empty-cell">Loading users from WorkOS...</td></tr>'}
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
            <div class="form-group">
              <label for="invite-role">Role</label>
              <select id="invite-role" class="input-glass select-input">
                <option value="member">Member</option>
                <option value="leader">Leader</option>
                <option value="viewer">Viewer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div class="form-actions">
              ${UI.button('Cancel', 'cancel-invite', 'btn-secondary')}
              ${UI.button('Send Invitation', 'submit-invite', 'btn-primary')}
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
}

function renderFilter(id: string, options: { value: string, label: string }[]): string {
  return `
    <select class="input-glass select-input" id="${id}">
      ${options.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
    </select>
  `;
}

function renderUserRow(user: UserListItem): string {
  const statusClass = {
    active: 'status-active',
    pending: 'status-pending',
    suspended: 'status-suspended',
  }[user.status];

  return `
    <tr data-user-id="${user.id}">
      <td>
        <div class="user-cell">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}" alt="${UI.escape(user.name)}" class="table-avatar" />
          <div>
            <span class="user-name">${UI.escape(user.name)}</span>
            <span class="user-email">${UI.escape(user.email)}</span>
          </div>
        </div>
      </td>
      <td>
        <div class="tags-row">
          ${renderRoleTag(user.role)}
          ${user.calling ? renderCallingTag(user.calling) : ''}
        </div>
      </td>
      <td><span class="status-badge ${statusClass}">${UI.escape(user.status)}</span></td>
      <td>${UI.escape(user.lastActive)}</td>
      <td>
        <div class="action-buttons">
          <button class="icon-btn edit-btn" title="Edit">✏️</button>
          <button class="icon-btn delete-btn" title="Remove">🗑️</button>
        </div>
      </td>
    </tr>
  `;
}

export async function loadUsers(): Promise<UserListItem[]> {
  const users = await fetchUsers();
  const tbody = document.getElementById('users-table-body');
  if (tbody) {
    tbody.innerHTML = users.length > 0
      ? users.map(renderUserRow).join('')
      : '<tr><td colspan="5" class="empty-cell">No users found. Invite someone to get started!</td></tr>';
  }
  return users;
}

export function attachUsersListeners(): void {
  const inviteBtn = document.getElementById('invite-user-btn');
  const modal = document.getElementById('invite-modal');
  const cancelBtn = document.getElementById('cancel-invite');
  const inviteForm = document.getElementById('invite-form');

  inviteBtn?.addEventListener('click', () => {
    if (modal) modal.style.display = 'flex';
  });

  cancelBtn?.addEventListener('click', () => {
    if (modal) modal.style.display = 'none';
  });

  modal?.querySelector('.modal-backdrop')?.addEventListener('click', () => {
    if (modal) modal.style.display = 'none';
  });

  inviteForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const emailInput = document.getElementById('invite-email') as HTMLInputElement;
    const submitBtn = document.getElementById('submit-invite') as HTMLButtonElement;

    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;

    const result = await inviteUser(emailInput.value);

    if (result.success) {
      alert(result.message);
      if (modal) modal.style.display = 'none';
      emailInput.value = '';
      await loadUsers();
    } else {
      alert(`Error: ${result.message}`);
    }

    submitBtn.textContent = 'Send Invitation';
    submitBtn.disabled = false;
  });

  loadUsers();
}
