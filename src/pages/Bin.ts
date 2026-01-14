import { fetchBinItems, restoreUser, permanentDelete } from '../api/users';
import { UI } from '../utils/core';

export function renderBinPage(items: any[] = []): string {
    return `
      <div class="page bin-page">
        ${UI.header('Recycle Bin', 'Items here are kept for 30 days before permanent deletion.')}
        
        <div class="card users-table-card">
          <table class="users-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Deleted By</th>
                <th>Deleted At</th>
                <th>Expires In</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="bin-table-body">
              ${items.length > 0 ? items.map(renderBinRow).join('') : '<tr><td colspan="5" class="empty-cell">Your bin is empty.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;
}

function renderBinRow(item: any): string {
    const deletedAt = new Date(item.deletedAt).toLocaleDateString();
    const daysLeft = Math.ceil((item.expiresAt - Date.now()) / (1000 * 60 * 60 * 24));

    return `
      <tr data-bin-id="${item._id}" data-original-id="${item.originalId}">
        <td>
          <div class="user-cell">
            <span class="type-icon">${item.type === 'user' ? '👤' : '📄'}</span>
            <div>
              <span class="user-name">${UI.escape(item.data.name || item.originalId)}</span>
              <span class="user-email">${UI.escape(item.data.email || '')}</span>
            </div>
          </div>
        </td>
        <td>${UI.escape(item.deletedBy)}</td>
        <td>${deletedAt}</td>
        <td><span class="badge ${daysLeft < 5 ? 'role-admin' : 'role-member'}">${daysLeft} days</span></td>
        <td>
          <div class="action-buttons">
            <button class="btn-secondary btn-sm restore-btn" data-id="${item.originalId}">Restore</button>
            <button class="btn-text btn-sm delete-perm-btn" data-id="${item.originalId}" style="color: #ef4444;">Delete</button>
          </div>
        </td>
      </tr>
    `;
}

export async function loadBin(): Promise<void> {
    const items = await fetchBinItems();
    const tbody = document.getElementById('bin-table-body');
    if (tbody) {
        tbody.innerHTML = items.length > 0 ? items.map(renderBinRow).join('') : '<tr><td colspan="5" class="empty-cell">Your bin is empty.</td></tr>';
    }
}

export function attachBinListeners(): void {
    const tbody = document.getElementById('bin-table-body');
    tbody?.addEventListener('click', async (e) => {
        const target = e.target as HTMLElement;
        const userId = target.getAttribute('data-id');
        if (!userId) return;

        if (target.classList.contains('restore-btn')) {
            const result = await restoreUser(userId);
            alert(result.message);
            if (result.success) loadBin();
        } else if (target.classList.contains('delete-perm-btn')) {
            if (confirm('Permanently delete this user? This cannot be undone.')) {
                const result = await permanentDelete(userId);
                alert(result.message);
                if (result.success) loadBin();
            }
        }
    });
}
