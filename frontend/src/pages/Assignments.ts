import {
    getAssignmentsByMonth,
    getMonthName,
    formatDate,
    getOrdinal,
    SundayAssignment,
    seedAssignmentsData
} from '../api/assignments';
import { UI } from '../utils/core';

let currentYear = 2026;
let currentMonth = 1;
let assignments: SundayAssignment[] = [];
let viewMode: 'calendar' | 'table' = 'calendar';

export function renderAssignmentsPage(): string {
    return `
      <div class="page assignments-page">
        ${UI.header('Sunday Assignments', 'Manage ward teaching assignments and schedules.', renderHeaderActions())}
        
        <div class="assignments-controls">
          <div class="month-nav">
            <button class="btn-icon" id="prev-month">←</button>
            <span class="current-month" id="month-display">${getMonthName(currentMonth)} ${currentYear}</span>
            <button class="btn-icon" id="next-month">→</button>
          </div>
          
          <div class="view-toggle">
            <button class="view-btn ${viewMode === 'calendar' ? 'active' : ''}" data-view="calendar">📅 Calendar</button>
            <button class="view-btn ${viewMode === 'table' ? 'active' : ''}" data-view="table">📋 Table</button>
          </div>
        </div>
        
        <div class="assignments-content" id="assignments-content">
          ${UI.spinner('Loading assignments...')}
        </div>

        <!-- Assignment Detail Modal -->
        <div class="modal" id="assignment-modal" style="display: none;">
          <div class="modal-backdrop"></div>
          <div class="modal-content glass-container modal-large">
            <div class="modal-header">
              <h2 id="modal-title">Sunday Details</h2>
              <button class="btn-icon close-modal">✕</button>
            </div>
            <div class="modal-body" id="modal-body">
              <!-- Content loaded dynamically -->
            </div>
          </div>
        </div>
      </div>
    `;
}

function renderHeaderActions(): string {
    return `
      <div class="header-actions">
        <button class="btn-secondary" id="seed-data-btn">🌱 Seed Data</button>
        <button class="btn-secondary" id="print-btn">🖨️ Print</button>
        <button class="btn-primary" id="add-assignment-btn">➕ Add Sunday</button>
      </div>
    `;
}

function renderCalendarView(assignments: SundayAssignment[]): string {
    if (assignments.length === 0) {
        return `
          <div class="empty-state">
            <span class="empty-icon">📅</span>
            <p>No assignments for ${getMonthName(currentMonth)} ${currentYear}</p>
            <button class="btn-secondary" id="seed-btn-inner">Seed Sample Data</button>
          </div>
        `;
    }

    return `
      <div class="calendar-grid">
        ${assignments.map(a => `
          <div class="calendar-card ${a.status === 'confirmed' ? 'confirmed' : ''}" data-id="${a._id}" data-date="${a.date}">
            <div class="card-header">
              <span class="sunday-number">${getOrdinal(a.sundayNumber)} Sunday</span>
              <span class="status-badge status-${a.status}">${a.status}</span>
            </div>
            <div class="card-date">${formatDate(a.date)}</div>
            
            <div class="card-section">
              <h4>🎵 Hymns</h4>
              <p class="hymn-item">${a.sacrament.openingHymn || 'TBD'}</p>
              <p class="hymn-item">${a.sacrament.sacramentHymn || 'TBD'}</p>
            </div>
            
            <div class="card-section">
              <h4>🎤 Speakers</h4>
              ${a.sacrament.speakers.length > 0
            ? a.sacrament.speakers.map(s => `<p class="speaker-item">${s.name}${s.topic ? ` - ${s.topic}` : ''}</p>`).join('')
            : '<p class="speaker-item muted">No speakers assigned</p>'
        }
            </div>
            
            <div class="card-section">
              <h4>📖 Sunday School</h4>
              <p>${a.sundaySchool.topic}</p>
              ${a.sundaySchool.instructor ? `<p class="instructor">Instructor: ${a.sundaySchool.instructor}</p>` : ''}
            </div>
            
            <div class="card-footer">
              <button class="btn-text view-details-btn" data-id="${a._id}">View Details →</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
}

function renderTableView(assignments: SundayAssignment[]): string {
    if (assignments.length === 0) {
        return `<div class="empty-state"><p>No assignments found</p></div>`;
    }

    return `
      <div class="table-container">
        <table class="assignments-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Opening Hymn</th>
              <th>Sacrament Hymn</th>
              <th>Speakers</th>
              <th>Sunday School</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${assignments.map(a => `
              <tr data-id="${a._id}">
                <td>
                  <strong>${getOrdinal(a.sundayNumber)} Sunday</strong><br/>
                  <span class="date-small">${a.date}</span>
                </td>
                <td>${a.sacrament.openingHymn || '-'}</td>
                <td>${a.sacrament.sacramentHymn || '-'}</td>
                <td>${a.sacrament.speakers.map(s => s.name).join(', ') || '-'}</td>
                <td>${a.sundaySchool.topic}</td>
                <td><span class="status-badge status-${a.status}">${a.status}</span></td>
                <td>
                  <button class="btn-text view-details-btn" data-id="${a._id}">View</button>
                  <button class="btn-text edit-btn" data-id="${a._id}">Edit</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
}

function renderAssignmentDetail(a: SundayAssignment): string {
    return `
      <div class="detail-grid">
        <section class="detail-section">
          <h3>📌 Sacrament Meeting</h3>
          <div class="detail-row">
            <label>Conducting</label>
            <span>${a.sacrament.conductingLeader || 'TBD'}</span>
          </div>
          <div class="detail-row">
            <label>Opening Hymn</label>
            <span>${a.sacrament.openingHymn || 'TBD'}</span>
          </div>
          <div class="detail-row">
            <label>Sacrament Hymn</label>
            <span>${a.sacrament.sacramentHymn || 'TBD'}</span>
          </div>
          <div class="detail-row">
            <label>Closing Hymn</label>
            <span>${a.sacrament.closingHymn || 'TBD'}</span>
          </div>
          <div class="detail-row">
            <label>Opening Prayer</label>
            <span>${a.sacrament.openingPrayer || 'TBD'}</span>
          </div>
          <div class="detail-row">
            <label>Closing Prayer</label>
            <span>${a.sacrament.closingPrayer || 'TBD'}</span>
          </div>
        </section>

        <section class="detail-section">
          <h3>🎤 Speakers</h3>
          ${a.sacrament.speakers.length > 0
            ? a.sacrament.speakers.map((s, i) => `
                <div class="speaker-card">
                  <span class="speaker-num">${i + 1}</span>
                  <div>
                    <strong>${s.name}</strong>
                    ${s.topic ? `<br/><span class="topic">${s.topic}</span>` : ''}
                    ${s.duration ? `<span class="duration">${s.duration} min</span>` : ''}
                  </div>
                </div>
              `).join('')
            : '<p class="muted">No speakers assigned</p>'
        }
        </section>

        <section class="detail-section">
          <h3>📖 Sunday School</h3>
          <div class="detail-row">
            <label>Topic</label>
            <span>${a.sundaySchool.topic}</span>
          </div>
          <div class="detail-row">
            <label>Scripture</label>
            <span>${a.sundaySchool.scripture || '-'}</span>
          </div>
          <div class="detail-row">
            <label>Instructor</label>
            <span>${a.sundaySchool.instructor || 'TBD'}</span>
          </div>
        </section>

        <section class="detail-section">
          <h3>👔 Elders Quorum</h3>
          <div class="detail-row">
            <label>Topic</label>
            <span>${a.elderQuorum.topic}</span>
          </div>
          <div class="detail-row">
            <label>Instructor</label>
            <span>${a.elderQuorum.instructor || 'TBD'}</span>
          </div>
        </section>

        <section class="detail-section">
          <h3>🌸 Relief Society</h3>
          <div class="detail-row">
            <label>Topic</label>
            <span>${a.reliefSociety.topic}</span>
          </div>
          <div class="detail-row">
            <label>Instructor</label>
            <span>${a.reliefSociety.instructor || 'TBD'}</span>
          </div>
        </section>
      </div>

      <div class="modal-actions">
        <button class="btn-secondary" id="close-detail-btn">Close</button>
        <button class="btn-primary" id="edit-detail-btn" data-id="${a._id}">✏️ Edit Assignment</button>
      </div>
    `;
}

export async function loadAssignments(): Promise<void> {
    const content = document.getElementById('assignments-content');
    if (!content) return;

    content.innerHTML = UI.spinner('Loading...');
    assignments = await getAssignmentsByMonth(currentYear, currentMonth);

    content.innerHTML = viewMode === 'calendar'
        ? renderCalendarView(assignments)
        : renderTableView(assignments);
}

export function attachAssignmentsListeners(): void {
    // Month navigation
    document.getElementById('prev-month')?.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 1) { currentMonth = 12; currentYear--; }
        updateMonthDisplay();
        loadAssignments();
    });

    document.getElementById('next-month')?.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 12) { currentMonth = 1; currentYear++; }
        updateMonthDisplay();
        loadAssignments();
    });

    // View toggle
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const target = e.currentTarget as HTMLElement;
            viewMode = target.dataset.view as 'calendar' | 'table';
            document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
            target.classList.add('active');
            loadAssignments();
        });
    });

    // Seed data button
    document.getElementById('seed-data-btn')?.addEventListener('click', async () => {
        await seedAssignmentsData();
        loadAssignments();
    });

    // Print button
    document.getElementById('print-btn')?.addEventListener('click', () => {
        window.print();
    });

    // Detail view
    document.getElementById('assignments-content')?.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (target.classList.contains('view-details-btn') || target.closest('.calendar-card')) {
            const id = target.dataset.id || target.closest('.calendar-card')?.getAttribute('data-id');
            if (id) showAssignmentDetail(id);
        }
    });

    // Modal close
    document.querySelector('.close-modal')?.addEventListener('click', closeModal);
    document.querySelector('.modal-backdrop')?.addEventListener('click', closeModal);

    document.getElementById('seed-btn-inner')?.addEventListener('click', async () => {
        await seedAssignmentsData();
        loadAssignments();
    });

    loadAssignments();
}

function updateMonthDisplay(): void {
    const display = document.getElementById('month-display');
    if (display) display.textContent = `${getMonthName(currentMonth)} ${currentYear}`;
}

function showAssignmentDetail(id: string): void {
    const assignment = assignments.find(a => a._id === id);
    if (!assignment) return;

    const modal = document.getElementById('assignment-modal');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');

    if (modal && title && body) {
        title.textContent = `${getOrdinal(assignment.sundayNumber)} Sunday - ${formatDate(assignment.date)}`;
        body.innerHTML = renderAssignmentDetail(assignment);
        modal.style.display = 'flex';

        document.getElementById('close-detail-btn')?.addEventListener('click', closeModal);
    }
}

function closeModal(): void {
    const modal = document.getElementById('assignment-modal');
    if (modal) modal.style.display = 'none';
}
