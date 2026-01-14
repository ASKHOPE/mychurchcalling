import { UserListItem, UserRole, UserCalling } from '../types';
import { fetchUsers, inviteUser, updateUserDetails, removeUser } from '../api/users';
import { renderRoleTag, renderCallingTag } from '../components/Tags';
import { UI } from '../utils/core';

let currentUsers: UserListItem[] = [];

export function renderUsersPage(users: UserListItem[] = []): string {
  currentUsers = users;
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

      <!-- Edit User Modal -->
      <div class="modal" id="edit-modal" style="display: none;">
        <div class="modal-backdrop"></div>
        <div class="modal-content glass-container">
          <h2>Edit User Access</h2>
          <form id="edit-form">
            <input type="hidden" id="edit-user-id" />
            <div class="form-group">
              <label>User</label>
              <div id="edit-user-display" class="user-cell" style="margin-bottom: 1rem;"></div>
            </div>
            <div class="form-group">
              <label for="edit-role">System Role</label>
              <select id="edit-role" class="input-glass select-input">
                <option value="admin">Admin</option>
                <option value="leader">Leader</option>
                <option value="member">Member</option>
                <option value="viewer">Viewer</option>
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
  }[user.status] || 'status-pending';

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
          <button class="icon-btn edit-btn" data-id="${user.id}" title="Edit">✏️</button>
          <button class="icon-btn delete-btn" data-id="${user.id}" title="Remove">🗑️</button>
        </div>
      </td>
    </tr>
  `;
}

export async function loadUsers(): Promise<UserListItem[]> {
  const users = await fetchUsers();
  currentUsers = users;
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
  const inviteModal = document.getElementById('invite-modal');
  const editModal = document.getElementById('edit-modal');
  const inviteForm = document.getElementById('invite-form');
  const editForm = document.getElementById('edit-form');
  const tbody = document.getElementById('users-table-body');

  // Open Invite Modal
  inviteBtn?.addEventListener('click', () => {
    if (inviteModal) inviteModal.style.display = 'flex';
  });

  // Handle Edit/Delete Button Clicks (Delegation)
  tbody?.addEventListener('click', async (e) => {
    const target = e.target as HTMLElement;
    const btn = target.closest('.icon-btn');
    if (!btn) return;

    const userId = btn.getAttribute('data-id');
    if (!userId) return;

    if (btn.classList.contains('edit-btn')) {
      handleOpenEditModal(userId);
    } else if (btn.classList.contains('delete-btn')) {
      if (confirm('Are you sure you want to remove this user? This action cannot be undone.')) {
        const result = await removeUser(userId);
        alert(result.message);
        if (result.success) loadUsers();
      }
    }
  });

  // Modal Backdrops
  [inviteModal, editModal].forEach(modal => {
    modal?.querySelector('.modal-backdrop')?.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  });

  document.getElementById('cancel-invite')?.addEventListener('click', () => {
    if (inviteModal) inviteModal.style.display = 'none';
  });

  document.getElementById('cancel-edit')?.addEventListener('click', () => {
    if (editModal) editModal.style.display = 'none';
  });

  // Invite Form Submit
  inviteForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const emailInput = document.getElementById('invite-email') as HTMLInputElement;
    const submitBtn = document.getElementById('submit-invite') as HTMLButtonElement;

    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;

    const result = await inviteUser(emailInput.value);
    alert(result.message);

    if (result.success) {
      if (inviteModal) inviteModal.style.display = 'none';
      emailInput.value = '';
      await loadUsers();
    }
    submitBtn.textContent = 'Send Invitation';
    submitBtn.disabled = false;
  });

  // Edit Form Submit
  editForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userId = (document.getElementById('edit-user-id') as HTMLInputElement).value;
    const role = (document.getElementById('edit-role') as HTMLSelectElement).value as UserRole;
    const calling = (document.getElementById('edit-calling') as HTMLSelectElement).value as UserCalling;
    const submitBtn = document.getElementById('submit-edit') as HTMLButtonElement;

    submitBtn.textContent = 'Saving...';
    submitBtn.disabled = true;

    const result = await updateUserDetails(userId, role, calling);
    alert(result.message);

    if (result.success) {
      if (editModal) editModal.style.display = 'none';
      await loadUsers();
    }
    submitBtn.textContent = 'Save Changes';
    submitBtn.disabled = false;
  });

  loadUsers();
}

function handleOpenEditModal(userId: string) {
  const user = currentUsers.find(u => u.id === userId);
  if (!user) return;

  const modal = document.getElementById('edit-modal');
  const userIdInput = document.getElementById('edit-user-id') as HTMLInputElement;
  const roleSelect = document.getElementById('edit-role') as HTMLSelectElement;
  const callingSelect = document.getElementById('edit-calling') as HTMLSelectElement;
  const userDisplay = document.getElementById('edit-user-display');

  if (modal && userIdInput && roleSelect && callingSelect && userDisplay) {
    userIdInput.value = user.id;
    roleSelect.value = user.role;
    callingSelect.value = user.calling || 'Member';
    userDisplay.innerHTML = `
      <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}" class="table-avatar" />
      <div>
        <span class="user-name">${UI.escape(user.name)}</span>
        <span class="user-email" style="display:block; font-size: 0.8rem; opacity: 0.6;">${UI.escape(user.email)}</span>
      </div>
    `;
    modal.style.display = 'flex';
  }
}

function getCallingOptions(): UserCalling[] {
  return [
    'Bishop', '1st Counselor', '2nd Counselor', 'Ward Clerk', 'Ward Executive Secretary',
    'Relief Society President', 'RS 1st Counselor', 'RS 2nd Counselor', 'Relief Society Secretary',
    'Elders Quorum President', 'EQ 1st Counselor', 'EQ 2nd Counselor', 'Elders Quorum Secretary',
    'Young Women President', 'YW 1st Counselor', 'YW 2nd Counselor', 'Young Women Secretary',
    'Sunday School President', 'SS 1st Counselor', 'SS 2nd Counselor',
    'YM 1st Assistant', 'YM 2nd Assistant', 'Member'
  ];
}
