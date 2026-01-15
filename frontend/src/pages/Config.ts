import { fetchRoles, fetchCallings, createRole, createCalling } from '../api/config';
import { UI } from '../utils/core';

export function renderConfigPage(): string {
    return `
      <div class="page config-page">
        ${UI.header('Roles & Callings', 'Define custom roles and church callings for your ward.')}
        
        <div class="dashboard-main-grid">
            <section class="card-section">
                <div class="card premium-card">
                    <div class="card-header">
                        <h3>System Roles</h3>
                        <button class="btn-primary btn-sm" id="add-role-btn">➕ Add Role</button>
                    </div>
                    <div class="config-list" id="roles-list">
                        ${UI.spinner('Loading roles...')}
                    </div>
                </div>
            </section>

            <section class="card-section">
                <div class="card premium-card">
                    <div class="card-header">
                        <h3>Church Callings</h3>
                        <button class="btn-primary btn-sm" id="add-calling-btn">➕ Add Calling</button>
                    </div>
                    <div class="config-list" id="callings-list">
                        ${UI.spinner('Loading callings...')}
                    </div>
                </div>
            </section>
        </div>

        <!-- Add Role Modal -->
        <div class="modal" id="role-modal" style="display: none;">
            <div class="modal-backdrop"></div>
            <div class="modal-content glass-container">
                <h2>Create System Role</h2>
                <form id="role-form">
                    <div class="form-group">
                        <label>Role Name</label>
                        <input type="text" id="role-name" class="input-glass" placeholder="e.g. ward_clerk" required />
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <textarea id="role-desc" class="input-glass" placeholder="What can this role do?"></textarea>
                    </div>
                    <div class="form-actions">
                        ${UI.button('Cancel', 'cancel-role', 'btn-secondary')}
                        ${UI.button('Create Role', 'submit-role', 'btn-primary')}
                    </div>
                </form>
            </div>
        </div>

        <!-- Add Calling Modal -->
        <div class="modal" id="calling-modal" style="display: none;">
            <div class="modal-backdrop"></div>
            <div class="modal-content glass-container">
                <h2>Add Church Calling</h2>
                <form id="calling-form">
                    <div class="form-group">
                        <label>Calling Name</label>
                        <input type="text" id="calling-name" class="input-glass" placeholder="e.g. Relief Society President" required />
                    </div>
                    <div class="form-group">
                        <label>Category</label>
                        <select id="calling-category" class="input-glass select-input">
                            <option value="General">General</option>
                            <option value="Priesthood">Priesthood</option>
                            <option value="Relief Society">Relief Society</option>
                            <option value="Youth">Youth</option>
                            <option value="Primary">Primary</option>
                        </select>
                    </div>
                    <div class="form-actions">
                        ${UI.button('Cancel', 'cancel-calling', 'btn-secondary')}
                        ${UI.button('Add Calling', 'submit-calling', 'btn-primary')}
                    </div>
                </form>
            </div>
        </div>
      </div>
    `;
}

export async function loadConfig(): Promise<void> {
    const [roles, callings] = await Promise.all([fetchRoles(), fetchCallings()]);

    const roleList = document.getElementById('roles-list');
    if (roleList) {
        roleList.innerHTML = roles.map(r => `
            <div class="config-item">
                <div class="config-info">
                    <span class="config-name">${UI.escape(r.name)}</span>
                    <span class="config-desc">${UI.escape(r.description)}</span>
                </div>
                <div class="config-actions">
                    <button class="btn-text">✏️</button>
                    ${r.name !== 'admin' ? '<button class="btn-text" style="color:#ef4444;">🗑️</button>' : ''}
                </div>
            </div>
        `).join('');
    }

    const callingList = document.getElementById('callings-list');
    if (callingList) {
        callingList.innerHTML = callings.map(c => `
            <div class="config-item">
                <div class="config-info">
                    <span class="config-name">${UI.escape(c.name)}</span>
                    <span class="config-category badge">${UI.escape(c.category)}</span>
                </div>
                 <div class="config-actions">
                    <button class="btn-text">✏️</button>
                    <button class="btn-text" style="color:#ef4444;">🗑️</button>
                </div>
            </div>
        `).join('');
    }
}

export function attachConfigListeners(): void {
    const roleModal = document.getElementById('role-modal');
    const callingModal = document.getElementById('calling-modal');

    document.getElementById('add-role-btn')?.addEventListener('click', () => {
        if (roleModal) roleModal.style.display = 'flex';
    });

    document.getElementById('add-calling-btn')?.addEventListener('click', () => {
        if (callingModal) callingModal.style.display = 'flex';
    });

    document.getElementById('role-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const role = {
            name: (document.getElementById('role-name') as HTMLInputElement).value,
            description: (document.getElementById('role-desc') as HTMLTextAreaElement).value,
            permissions: []
        };
        const res = await createRole(role);
        if (res.success) {
            if (roleModal) roleModal.style.display = 'none';
            loadConfig();
        }
    });

    document.getElementById('calling-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const calling = {
            name: (document.getElementById('calling-name') as HTMLInputElement).value,
            category: (document.getElementById('calling-category') as HTMLSelectElement).value,
        };
        const res = await createCalling(calling);
        if (res.success) {
            if (callingModal) callingModal.style.display = 'none';
            loadConfig();
        }
    });

    document.querySelectorAll('.modal-backdrop, #cancel-role, #cancel-calling').forEach(el => {
        el.addEventListener('click', () => {
            if (roleModal) roleModal.style.display = 'none';
            if (callingModal) callingModal.style.display = 'none';
        });
    });

    loadConfig();
}
