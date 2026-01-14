import { UserListItem } from '../types';
import { fetchUsers, inviteUser } from '../api/users';

export function renderUsersPage(users: UserListItem[] = []): string {

  return `
    <div class="page users-page">
      <header class="page-header">
        <div>
          <h1>User Management</h1>
          <p class="subtitle">Manage your team members and their access.</p>
        </div>
        <div class="header-actions">
          <button class="btn-primary" id="invite-user-btn">
            <span>➕</span> Invite User
          </button>
        </div>
      </header>

      <div class="card users-table-card">
        <div class="table-header">
          <input type="text" class="input-glass search-input" placeholder="Search users..." id="user-search" />
          <div class="filter-group">
            <select class="input-glass select-input" id="role-filter">
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="member">Member</option>
              <option value="viewer">Viewer</option>
            </select>
            <select class="input-glass select-input" id="status-filter">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        <table class="users-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
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
                <option value="viewer">Viewer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div class="form-actions">
              <button type="button" class="btn-secondary" id="cancel-invite">Cancel</button>
              <button type="submit" class="btn-primary" id="submit-invite">Send Invitation</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
}

function renderUserRow(user: UserListItem): string {
  const statusClass = {
    active: 'status-active',
    pending: 'status-pending',
    suspended: 'status-suspended',
  }[user.status];

  const roleClass = {
    admin: 'role-admin',
    leader: 'role-leader',
    member: 'role-member',
    viewer: 'role-viewer',
  }[user.role];

  return `
    <tr data-user-id="${user.id}">
      <td>
        <div class="user-cell">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}" alt="${user.name}" class="table-avatar" />
          <div>
            <span class="user-name">${user.name}</span>
            <span class="user-email">${user.email}</span>
          </div>
        </div>
      </td>
      <td><span class="role-badge ${roleClass}">${user.role}</span></td>
      <td><span class="status-badge ${statusClass}">${user.status}</span></td>
      <td>${user.lastActive}</td>
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

  // Update the table body
  const tbody = document.getElementById('users-table-body');
  if (tbody) {
    if (users.length > 0) {
      tbody.innerHTML = users.map(renderUserRow).join('');
    } else {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-cell">No users found. Invite someone to get started!</td></tr>';
    }
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
    const email = emailInput.value;

    // Show loading state
    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;

    const result = await inviteUser(email);

    if (result.success) {
      alert(result.message);
      if (modal) modal.style.display = 'none';
      emailInput.value = '';
      // Refresh users list
      await loadUsers();
    } else {
      alert(`Error: ${result.message}`);
    }

    // Reset button
    submitBtn.textContent = 'Send Invitation';
    submitBtn.disabled = false;
  });

  // Load users from WorkOS
  loadUsers();
}
