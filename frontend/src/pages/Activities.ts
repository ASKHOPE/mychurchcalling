import { UI } from '../utils/core';

// Types
interface Activity {
  id: string;
  title: string;
  date: Date;
  startTime: string;
  endTime: string;
  type: 'meeting' | 'service' | 'social' | 'training' | 'worship';
  description: string;
  location?: string;
  agenda?: AgendaItem[];
  includeCleaning: boolean;
  cleaningAssignee?: string;
}

interface AgendaItem {
  id: string;
  type: 'opening-prayer' | 'closing-prayer' | 'opening-hymn' | 'closing-hymn' | 'speaker' | 'announcement' | 'custom';
  label: string;
  value: string;
  order: number;
}

interface ActivityTemplate {
  id: string;
  name: string;
  type: Activity['type'];
  items: Omit<AgendaItem, 'id' | 'value'>[];
  includeCleaning: boolean;
}

// Sample templates
let activityTemplates: ActivityTemplate[] = [
  {
    id: 'sacrament-meeting',
    name: 'Sacrament Meeting',
    type: 'worship',
    includeCleaning: true,
    items: [
      { type: 'opening-hymn', label: 'Opening Hymn', order: 1 },
      { type: 'opening-prayer', label: 'Opening Prayer', order: 2 },
      { type: 'announcement', label: 'Ward Business', order: 3 },
      { type: 'custom', label: 'Sacrament Hymn', order: 4 },
      { type: 'speaker', label: 'Speaker 1', order: 5 },
      { type: 'custom', label: 'Intermediate Hymn', order: 6 },
      { type: 'speaker', label: 'Speaker 2', order: 7 },
      { type: 'closing-hymn', label: 'Closing Hymn', order: 8 },
      { type: 'closing-prayer', label: 'Closing Prayer', order: 9 }
    ]
  },
  {
    id: 'relief-society',
    name: 'Relief Society Meeting',
    type: 'meeting',
    includeCleaning: false,
    items: [
      { type: 'opening-hymn', label: 'Opening Hymn', order: 1 },
      { type: 'opening-prayer', label: 'Opening Prayer', order: 2 },
      { type: 'announcement', label: 'Announcements', order: 3 },
      { type: 'custom', label: 'Lesson', order: 4 },
      { type: 'closing-prayer', label: 'Closing Prayer', order: 5 }
    ]
  },
  {
    id: 'youth-activity',
    name: 'Youth Activity',
    type: 'social',
    includeCleaning: true,
    items: [
      { type: 'opening-prayer', label: 'Opening Prayer', order: 1 },
      { type: 'custom', label: 'Welcome & Overview', order: 2 },
      { type: 'custom', label: 'Main Activity', order: 3 },
      { type: 'custom', label: 'Refreshments', order: 4 },
      { type: 'closing-prayer', label: 'Closing Prayer', order: 5 }
    ]
  }
];

// Sample activities data
let activities: Activity[] = [
  {
    id: '1',
    title: 'Ward Council Meeting',
    date: new Date(2026, 0, 18),
    startTime: '09:00',
    endTime: '10:30',
    type: 'meeting',
    description: 'Monthly ward council to discuss ward needs and activities.',
    location: 'Bishop\'s Office',
    includeCleaning: false,
    agenda: [
      { id: 'a1', type: 'opening-prayer', label: 'Opening Prayer', value: 'Brother Johnson', order: 1 },
      { id: 'a2', type: 'custom', label: 'Ward Business', value: 'Bishop Smith', order: 2 },
      { id: 'a3', type: 'custom', label: 'Missionary Update', value: 'Ward Mission Leader', order: 3 },
      { id: 'a4', type: 'closing-prayer', label: 'Closing Prayer', value: 'Sister Williams', order: 4 }
    ]
  },
  {
    id: '2',
    title: 'Youth Temple Trip',
    date: new Date(2026, 0, 20),
    startTime: '06:00',
    endTime: '14:00',
    type: 'worship',
    description: 'Joint youth temple attendance activity.',
    location: 'Bangalore Temple',
    includeCleaning: false
  },
  {
    id: '3',
    title: 'Relief Society Activity Night',
    date: new Date(2026, 0, 22),
    startTime: '19:00',
    endTime: '21:00',
    type: 'social',
    description: 'Craft night and fellowship for all sisters.',
    location: 'Cultural Hall',
    includeCleaning: true,
    cleaningAssignee: 'Relief Society Presidency'
  }
];

// State
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();
let showAddActivityModal = false;
let showDayModal = false;
let showAgendaModal = false;
let showTemplateBuilder = false;
let selectedDayDate: Date | null = null;
let selectedActivity: Activity | null = null;
let editingActivity: Partial<Activity> = {};
let editingTemplate: ActivityTemplate | null = null;

function formatTimeDisplay(timeStr: string): string {
  if (!timeStr) return '';
  const [hours, mins] = timeStr.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 || 12;
  return `${h12}:${mins.toString().padStart(2, '0')} ${period}`;
}

function getActivityTypeStyle(type: Activity['type']): { bg: string; color: string; icon: string } {
  switch (type) {
    case 'meeting':
      return { bg: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', icon: '📋' };
    case 'service':
      return { bg: 'rgba(16, 185, 129, 0.2)', color: '#34d399', icon: '🤝' };
    case 'social':
      return { bg: 'rgba(236, 72, 153, 0.2)', color: '#f472b6', icon: '🎉' };
    case 'training':
      return { bg: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', icon: '📚' };
    case 'worship':
      return { bg: 'rgba(139, 92, 246, 0.2)', color: '#a78bfa', icon: '⛪' };
    default:
      return { bg: 'rgba(107, 114, 128, 0.2)', color: '#9ca3af', icon: '📌' };
  }
}

function getUpcomingActivity(): Activity | null {
  const now = new Date();
  const upcoming = activities
    .filter(a => a.date >= now)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  return upcoming[0] || null;
}

function getAgendaActivities(): Activity[] {
  const now = new Date();
  return activities
    .filter(a => a.date >= now)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 5);
}

function getActivitiesForDate(date: Date): Activity[] {
  return activities.filter(a =>
    a.date.getFullYear() === date.getFullYear() &&
    a.date.getMonth() === date.getMonth() &&
    a.date.getDate() === date.getDate()
  );
}

function formatDateLong(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

function getDaysUntil(date: Date): string {
  const now = new Date();
  const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff < 7) return `In ${diff} days`;
  if (diff < 14) return 'Next week';
  return `In ${Math.floor(diff / 7)} weeks`;
}

function renderUpcomingActivity(activity: Activity | null): string {
  if (!activity) {
    return `
      <div class="upcoming-empty">
        <span class="empty-icon">📅</span>
        <p>No upcoming activities scheduled</p>
      </div>
    `;
  }

  const style = getActivityTypeStyle(activity.type);

  return `
    <div class="upcoming-activity-card">
      <div class="upcoming-header">
        <span class="upcoming-badge" style="background: ${style.bg}; color: ${style.color};">
          ${style.icon} ${activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
        </span>
        <span class="upcoming-countdown">${getDaysUntil(activity.date)}</span>
      </div>
      <h3 class="upcoming-title">${UI.escape(activity.title)}</h3>
      <div class="upcoming-meta">
        <div class="upcoming-meta-item">
          <span class="meta-icon">📅</span>
          <span>${formatDateLong(activity.date)}</span>
        </div>
        <div class="upcoming-meta-item">
          <span class="meta-icon">🕐</span>
          <span>${formatTimeDisplay(activity.startTime)} - ${formatTimeDisplay(activity.endTime)}</span>
        </div>
        ${activity.location ? `
          <div class="upcoming-meta-item">
            <span class="meta-icon">📍</span>
            <span>${UI.escape(activity.location)}</span>
          </div>
        ` : ''}
      </div>
      <p class="upcoming-description">${UI.escape(activity.description)}</p>
      <div class="upcoming-actions">
        <button class="btn-primary btn-sm view-agenda-btn" data-id="${activity.id}">
          <span>📋</span> View Agenda
        </button>
        <button class="btn-secondary btn-sm">
          <span>🔔</span> Set Reminder
        </button>
      </div>
    </div>
  `;
}

function renderAgendaItem(activity: Activity): string {
  const style = getActivityTypeStyle(activity.type);

  return `
    <div class="agenda-item" data-id="${activity.id}">
      <div class="agenda-date-badge">
        <span class="agenda-month">${activity.date.toLocaleDateString('en-US', { month: 'short' })}</span>
        <span class="agenda-day">${activity.date.getDate()}</span>
      </div>
      <div class="agenda-marker" style="background: ${style.color};"></div>
      <div class="agenda-content">
        <h4 class="agenda-title">${UI.escape(activity.title)}</h4>
        <div class="agenda-details">
          <span class="agenda-time">${formatTimeDisplay(activity.startTime)} - ${formatTimeDisplay(activity.endTime)}</span>
          ${activity.location ? `<span class="agenda-location">• ${UI.escape(activity.location)}</span>` : ''}
        </div>
      </div>
      <span class="agenda-type-badge" style="background: ${style.bg}; color: ${style.color};">
        ${style.icon}
      </span>
    </div>
  `;
}

function renderCalendar(): string {
  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDay = firstDay.getDay();

  const monthName = firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Get activities for this month
  const monthActivities = activities.filter(a =>
    a.date.getFullYear() === currentYear && a.date.getMonth() === currentMonth
  );

  // Create a map of day -> activities
  const activityMap = new Map<number, Activity[]>();
  monthActivities.forEach(a => {
    const day = a.date.getDate();
    if (!activityMap.has(day)) {
      activityMap.set(day, []);
    }
    activityMap.get(day)!.push(a);
  });

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === currentYear && today.getMonth() === currentMonth;
  const currentDay = today.getDate();

  let calendarDays = '';

  for (let i = 0; i < startingDay; i++) {
    calendarDays += '<div class="calendar-day empty"></div>';
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dayActivities = activityMap.get(day) || [];
    const isToday = isCurrentMonth && day === currentDay;
    const hasActivities = dayActivities.length > 0;

    const activityDots = dayActivities.slice(0, 3).map(a => {
      const style = getActivityTypeStyle(a.type);
      return `<span class="activity-dot" style="background: ${style.color};" title="${UI.escape(a.title)}"></span>`;
    }).join('');

    calendarDays += `
      <div class="calendar-day ${isToday ? 'today' : ''} ${hasActivities ? 'has-activities' : ''}" data-day="${day}" data-month="${currentMonth}" data-year="${currentYear}">
        <span class="day-number">${day}</span>
        ${hasActivities ? `<div class="day-activities">${activityDots}</div>` : ''}
      </div>
    `;
  }

  return `
    <div class="calendar-container">
      <div class="calendar-header">
        <button class="calendar-nav-btn" id="prev-month">
          <span>◀</span>
        </button>
        <h3 class="calendar-month-title">${monthName}</h3>
        <button class="calendar-nav-btn" id="next-month">
          <span>▶</span>
        </button>
      </div>
      <div class="calendar-weekdays">
        <span>Sun</span>
        <span>Mon</span>
        <span>Tue</span>
        <span>Wed</span>
        <span>Thu</span>
        <span>Fri</span>
        <span>Sat</span>
      </div>
      <div class="calendar-grid">
        ${calendarDays}
      </div>
    </div>
  `;
}

function renderDayModal(): string {
  if (!showDayModal || !selectedDayDate) return '';

  const dayActivities = getActivitiesForDate(selectedDayDate);
  const dateStr = formatDateLong(selectedDayDate);

  return `
    <div class="modal" id="day-modal">
      <div class="modal-backdrop" id="day-modal-backdrop"></div>
      <div class="modal-content glass-container modal-medium">
        <div class="modal-header">
          <h2>📅 ${dateStr}</h2>
          <button class="btn-icon" id="close-day-modal">✕</button>
        </div>
        <div class="modal-body">
          ${dayActivities.length === 0 ? `
            <div class="no-activities-message">
              <span class="empty-icon">📭</span>
              <p>No activities scheduled for this day.</p>
              <button class="btn-primary" id="add-activity-for-day">
                <span>➕</span> Add Activity
              </button>
            </div>
          ` : `
            <div class="day-activities-list">
              ${dayActivities.map(activity => {
    const style = getActivityTypeStyle(activity.type);
    return `
                  <div class="day-activity-card" data-id="${activity.id}">
                    <div class="activity-header-row">
                      <span class="activity-type-badge" style="background: ${style.bg}; color: ${style.color};">
                        ${style.icon} ${activity.type}
                      </span>
                      <span class="activity-time">${formatTimeDisplay(activity.startTime)} - ${formatTimeDisplay(activity.endTime)}</span>
                    </div>
                    <h4 class="activity-title">${UI.escape(activity.title)}</h4>
                    <p class="activity-description">${UI.escape(activity.description)}</p>
                    ${activity.location ? `<p class="activity-location">📍 ${UI.escape(activity.location)}</p>` : ''}
                    <div class="activity-actions">
                      <button class="btn-primary btn-sm view-activity-agenda" data-id="${activity.id}">
                        <span>📋</span> View Agenda
                      </button>
                      <button class="btn-secondary btn-sm edit-activity-btn" data-id="${activity.id}">
                        <span>✏️</span> Edit
                      </button>
                      <button class="btn-secondary btn-sm print-agenda-btn" data-id="${activity.id}">
                        <span>🖨️</span> Print
                      </button>
                    </div>
                  </div>
                `;
  }).join('')}
            </div>
            <button class="btn-primary add-more-btn" id="add-activity-for-day">
              <span>➕</span> Add Another Activity
            </button>
          `}
        </div>
      </div>
    </div>
  `;
}

function renderAgendaModal(): string {
  if (!showAgendaModal || !selectedActivity) return '';

  const style = getActivityTypeStyle(selectedActivity.type);
  const agenda = selectedActivity.agenda || [];

  return `
    <div class="modal" id="agenda-modal">
      <div class="modal-backdrop" id="agenda-modal-backdrop"></div>
      <div class="modal-content glass-container modal-large">
        <div class="modal-header">
          <h2>📋 Activity Agenda</h2>
          <button class="btn-icon" id="close-agenda-modal">✕</button>
        </div>
        <div class="modal-body">
          <div class="agenda-activity-header">
            <span class="activity-type-badge" style="background: ${style.bg}; color: ${style.color};">
              ${style.icon} ${selectedActivity.type}
            </span>
            <h3>${UI.escape(selectedActivity.title)}</h3>
            <p class="agenda-meta">
              📅 ${formatDateLong(selectedActivity.date)} • 🕐 ${formatTimeDisplay(selectedActivity.startTime)} - ${formatTimeDisplay(selectedActivity.endTime)}
              ${selectedActivity.location ? ` • 📍 ${UI.escape(selectedActivity.location)}` : ''}
            </p>
          </div>
          
          <div class="agenda-items-container">
            ${agenda.length === 0 ? `
              <div class="no-agenda-message">
                <p>No agenda items yet.</p>
                <button class="btn-secondary" id="create-agenda-from-template">
                  <span>📄</span> Create from Template
                </button>
              </div>
            ` : `
              <div class="agenda-items-list">
                ${agenda.sort((a, b) => a.order - b.order).map(item => `
                  <div class="agenda-line-item">
                    <span class="agenda-item-order">${item.order}</span>
                    <span class="agenda-item-label">${UI.escape(item.label)}</span>
                    <input type="text" class="agenda-item-input" data-id="${item.id}" placeholder="Enter name or details..." value="${UI.escape(item.value)}">
                  </div>
                `).join('')}
              </div>
            `}
            
            ${selectedActivity.includeCleaning ? `
              <div class="agenda-cleaning-section">
                <div class="cleaning-header">
                  <span class="icon">🧹</span>
                  <h4>Facility Cleaning After Activity</h4>
                </div>
                <div class="cleaning-assignee-input-row">
                  <label>Assigned to:</label>
                  <input type="text" id="agenda-cleaning-assignee" placeholder="e.g., Deacons Quorum" value="${UI.escape(selectedActivity.cleaningAssignee || '')}">
                </div>
              </div>
            ` : ''}
          </div>
          
          <div class="agenda-modal-actions">
            <button class="btn-primary" id="save-agenda-changes">
              <span>💾</span> Save Changes
            </button>
            <button class="btn-secondary" id="print-full-agenda">
              <span>🖨️</span> Print Agenda
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderAddActivityModal(): string {
  if (!showAddActivityModal) return '';

  return `
    <div class="modal" id="add-activity-modal">
      <div class="modal-backdrop" id="add-activity-backdrop"></div>
      <div class="modal-content glass-container modal-large">
        <div class="modal-header">
          <h2>➕ Add New Activity</h2>
          <button class="btn-icon" id="close-add-activity">✕</button>
        </div>
        <div class="modal-body">
          <div class="activity-form">
            <div class="form-section">
              <label class="form-label">Activity Title *</label>
              <input type="text" id="activity-title" class="form-input" placeholder="e.g., Ward Social Night">
            </div>
            
            <div class="form-grid-2col">
              <div class="form-section">
                <label class="form-label">Date *</label>
                <input type="date" id="activity-date" class="form-input" value="${selectedDayDate ? selectedDayDate.toISOString().split('T')[0] : ''}">
              </div>
              <div class="form-grid-2col">
                <div class="form-section">
                  <label class="form-label">Start Time *</label>
                  <input type="time" id="activity-start-time" class="form-input" value="18:00">
                </div>
                <div class="form-section">
                  <label class="form-label">End Time *</label>
                  <input type="time" id="activity-end-time" class="form-input" value="20:00">
                </div>
              </div>
            </div>
            
            <div class="form-section">
              <label class="form-label">Activity Type *</label>
              <div class="type-selector">
                <button class="type-btn ${editingActivity.type === 'meeting' ? 'selected' : ''}" data-type="meeting">📋 Meeting</button>
                <button class="type-btn ${editingActivity.type === 'service' ? 'selected' : ''}" data-type="service">🤝 Service</button>
                <button class="type-btn ${editingActivity.type === 'social' ? 'selected' : ''}" data-type="social">🎉 Social</button>
                <button class="type-btn ${editingActivity.type === 'training' ? 'selected' : ''}" data-type="training">📚 Training</button>
                <button class="type-btn ${editingActivity.type === 'worship' ? 'selected' : ''}" data-type="worship">⛪ Worship</button>
              </div>
            </div>
            
            <div class="form-section">
              <div class="checkbox-row">
                <input type="checkbox" id="activity-include-cleaning" ${editingActivity.includeCleaning ? 'checked' : ''}>
                <label for="activity-include-cleaning">Include facility cleaning section at end of agenda</label>
              </div>
            </div>

            <div class="form-section">
              <label class="form-label">Location</label>
              <input type="text" id="activity-location" class="form-input" placeholder="e.g., Cultural Hall">
            </div>
            
            <div class="form-section">
              <label class="form-label">Description</label>
              <textarea id="activity-description" class="form-textarea" placeholder="Brief description of the activity..."></textarea>
            </div>
            
            <div class="form-section">
              <label class="form-label">Use Template (Optional)</label>
              <div class="template-selector">
                ${activityTemplates.map(t => `
                  <button class="template-btn" data-template="${t.id}">
                    <span class="template-icon">${getActivityTypeStyle(t.type).icon}</span>
                    <span class="template-name">${t.name}</span>
                  </button>
                `).join('')}
              </div>
            </div>
            
            <div class="form-actions">
              <button class="btn-secondary" id="cancel-add-activity">Cancel</button>
              <button class="btn-primary" id="save-activity">
                <span>✓</span> Save Activity
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderTemplateBuilder(): string {
  if (!showTemplateBuilder) return '';

  return `
    <div class="template-builder-page">
      <div class="template-builder-header">
        <button class="btn-icon" id="close-template-builder">←</button>
        <h2>📄 Activity Template Builder</h2>
      </div>
      
      <div class="template-builder-body">
        <div class="template-builder-layout">
          <div class="templates-sidebar glass-container">
            <h4>Saved Templates</h4>
            <div class="templates-list">
              ${activityTemplates.map(t => `
                <div class="template-card ${editingTemplate?.id === t.id ? 'active' : ''}" data-id="${t.id}">
                  <span class="template-icon">${getActivityTypeStyle(t.type).icon}</span>
                  <div class="template-info">
                    <span class="template-name">${t.name}</span>
                    <span class="template-item-count">${t.items.length} items</span>
                  </div>
                  <div class="template-actions">
                    <button class="btn-icon edit-template-btn" data-id="${t.id}">✏️</button>
                    <button class="btn-icon delete-template-btn" data-id="${t.id}">🗑️</button>
                  </div>
                </div>
              `).join('')}
            </div>
            <button class="btn-primary add-new-template-btn" id="new-template-btn">
              <span>➕</span> Create New Template
            </button>
          </div>
          
          <div class="template-editor-panel glass-container">
            <h3>${editingTemplate ? `Editing: ${editingTemplate.name}` : 'Create New Template'}</h3>
            
            <div class="template-form">
              <div class="form-section">
                <label class="form-label">Template Name *</label>
                <input type="text" id="template-name" class="form-input" placeholder="e.g., Ward Conference" value="${editingTemplate?.name || ''}">
              </div>
              
              <div class="form-grid-2col">
                <div class="form-section">
                  <label class="form-label">Default Activity Type</label>
                  <select id="template-type" class="form-input">
                    <option value="meeting" ${editingTemplate?.type === 'meeting' ? 'selected' : ''}>📋 Meeting</option>
                    <option value="service" ${editingTemplate?.type === 'service' ? 'selected' : ''}>🤝 Service</option>
                    <option value="social" ${editingTemplate?.type === 'social' ? 'selected' : ''}>🎉 Social</option>
                    <option value="training" ${editingTemplate?.type === 'training' ? 'selected' : ''}>📚 Training</option>
                    <option value="worship" ${editingTemplate?.type === 'worship' ? 'selected' : ''}>⛪ Worship</option>
                  </select>
                </div>
                <div class="form-section">
                  <label class="form-label">Agenda Options</label>
                  <div class="checkbox-row">
                    <input type="checkbox" id="template-include-cleaning" ${editingTemplate?.includeCleaning ? 'checked' : ''}>
                    <label for="template-include-cleaning">Include cleaning section by default</label>
                  </div>
                </div>
              </div>
              
              <div class="form-section agenda-builder-section">
                <label class="form-label">Agenda Structure</label>
                <div class="template-items-list" id="template-items">
                  ${(editingTemplate?.items || []).map((item, idx) => `
                    <div class="template-item-row" data-order="${item.order}">
                      <span class="item-order">${idx + 1}</span>
                      <select class="item-type-select">
                        <option value="opening-prayer" ${item.type === 'opening-prayer' ? 'selected' : ''}>🙏 Opening Prayer</option>
                        <option value="closing-prayer" ${item.type === 'closing-prayer' ? 'selected' : ''}>🙏 Closing Prayer</option>
                        <option value="opening-hymn" ${item.type === 'opening-hymn' ? 'selected' : ''}>🎵 Opening Hymn</option>
                        <option value="closing-hymn" ${item.type === 'closing-hymn' ? 'selected' : ''}>🎵 Closing Hymn</option>
                        <option value="speaker" ${item.type === 'speaker' ? 'selected' : ''}>🎤 Speaker</option>
                        <option value="announcement" ${item.type === 'announcement' ? 'selected' : ''}>📢 Announcement</option>
                        <option value="custom" ${item.type === 'custom' ? 'selected' : ''}>✏️ Custom Item</option>
                      </select>
                      <input type="text" class="item-label-input" placeholder="Label" value="${item.label}">
                      <button class="btn-icon remove-item-btn">🗑️</button>
                    </div>
                  `).join('')}
                </div>
                <button class="btn-secondary add-item-btn" id="add-template-item">
                  <span>➕</span> Add Agenda Item
                </button>
              </div>
              
              <div class="template-form-actions">
                <button class="btn-secondary" id="clear-template-form">Discard Changes</button>
                <button class="btn-primary" id="save-template">
                  <span>💾</span> Save Template
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function renderActivitiesPage(): string {
  const upcomingActivity = getUpcomingActivity();
  const agendaActivities = getAgendaActivities();

  if (showTemplateBuilder) {
    return renderTemplateBuilder();
  }

  const headerActions = `
    <button class="btn-secondary" id="template-builder-btn">
      <span>📄</span> Activity Templates
    </button>
    <button class="btn-primary" id="add-activity-btn">
      <span>➕</span> Add Activity
    </button>
  `;

  return `
    <div class="page activities-page">
      ${UI.header('Activities', 'Manage ward activities and events calendar.', headerActions)}

      <div class="activities-grid">
        <section class="calendar-section">
          ${UI.card(renderCalendar(), 'calendar-card', '')}
        </section>

        <section class="activities-sidebar">
          <div class="upcoming-section">
            <h3 class="section-title">
              <span class="section-icon">⭐</span>
              Next Upcoming Activity
            </h3>
            ${renderUpcomingActivity(upcomingActivity)}
          </div>

          <div class="agenda-section">
            <h3 class="section-title">
              <span class="section-icon">📋</span>
              Recent Agenda
            </h3>
            <div class="agenda-list">
              ${agendaActivities.length > 0
      ? agendaActivities.map(a => renderAgendaItem(a)).join('')
      : '<p class="agenda-empty">No upcoming activities in your agenda.</p>'
    }
            </div>
          </div>
        </section>
      </div>
      
      ${renderDayModal()}
      ${renderAgendaModal()}
      ${renderAddActivityModal()}
    </div>
  `;
}

function refreshActivitiesPage(): void {
  const container = document.querySelector('.activities-page') || document.querySelector('.template-builder-page');
  if (container) {
    const parent = container.parentElement;
    if (parent) {
      container.outerHTML = renderActivitiesPage();
      attachActivitiesListeners();
    }
  } else {
    // Fallback for initial render if needed
    const root = document.getElementById('app');
    if (root) {
      root.innerHTML = renderActivitiesPage();
      attachActivitiesListeners();
    }
  }
}

function showToast(message: string): void {
  const container = document.getElementById('toast-container') || (() => {
    const div = document.createElement('div');
    div.id = 'toast-container';
    document.body.appendChild(div);
    return div;
  })();

  const toast = document.createElement('div');
  toast.className = 'toast toast-success';
  toast.innerHTML = `<span class="toast-icon">✓</span><span class="toast-message">${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

export function attachActivitiesListeners(): void {
  // Calendar navigation
  document.getElementById('prev-month')?.addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    refreshActivitiesPage();
  });

  document.getElementById('next-month')?.addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    refreshActivitiesPage();
  });

  // Add activity button
  document.getElementById('add-activity-btn')?.addEventListener('click', () => {
    showAddActivityModal = true;
    editingActivity = { type: 'meeting', includeCleaning: false };
    refreshActivitiesPage();
  });

  // Template builder button
  document.getElementById('template-builder-btn')?.addEventListener('click', () => {
    showTemplateBuilder = true;
    editingTemplate = null;
    refreshActivitiesPage();
  });

  // Calendar day click - show day modal
  document.querySelectorAll('.calendar-day:not(.empty)').forEach(day => {
    day.addEventListener('click', () => {
      const dayNum = parseInt(day.getAttribute('data-day') || '1');
      const month = parseInt(day.getAttribute('data-month') || '0');
      const year = parseInt(day.getAttribute('data-year') || '2026');
      selectedDayDate = new Date(year, month, dayNum);
      showDayModal = true;
      refreshActivitiesPage();
    });
  });

  // Agenda item click
  document.querySelectorAll('.agenda-item').forEach(item => {
    item.addEventListener('click', () => {
      const id = item.getAttribute('data-id');
      selectedActivity = activities.find(a => a.id === id) || null;
      if (selectedActivity) {
        showAgendaModal = true;
        refreshActivitiesPage();
      }
    });
  });

  // View agenda buttons
  document.querySelectorAll('.view-agenda-btn, .view-activity-agenda').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = (e.currentTarget as HTMLElement).dataset.id;
      selectedActivity = activities.find(a => a.id === id) || null;
      if (selectedActivity) {
        showDayModal = false;
        showAgendaModal = true;
        refreshActivitiesPage();
      }
    });
  });

  // Close modals
  document.getElementById('close-day-modal')?.addEventListener('click', () => {
    showDayModal = false;
    refreshActivitiesPage();
  });

  document.getElementById('day-modal-backdrop')?.addEventListener('click', () => {
    showDayModal = false;
    refreshActivitiesPage();
  });

  document.getElementById('close-agenda-modal')?.addEventListener('click', () => {
    showAgendaModal = false;
    refreshActivitiesPage();
  });

  document.getElementById('agenda-modal-backdrop')?.addEventListener('click', () => {
    showAgendaModal = false;
    refreshActivitiesPage();
  });

  document.getElementById('close-add-activity')?.addEventListener('click', () => {
    showAddActivityModal = false;
    refreshActivitiesPage();
  });

  document.getElementById('add-activity-backdrop')?.addEventListener('click', () => {
    showAddActivityModal = false;
    refreshActivitiesPage();
  });

  document.getElementById('close-template-builder')?.addEventListener('click', () => {
    showTemplateBuilder = false;
    refreshActivitiesPage();
  });

  // Add activity for day button
  document.getElementById('add-activity-for-day')?.addEventListener('click', () => {
    showDayModal = false;
    showAddActivityModal = true;
    editingActivity = { type: 'meeting', includeCleaning: false };
    refreshActivitiesPage();
  });

  // Activity type selection
  document.querySelectorAll('.type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = (btn as HTMLElement).dataset.type as Activity['type'];
      editingActivity.type = type;
      document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });

  // Save activity
  document.getElementById('save-activity')?.addEventListener('click', () => {
    const title = (document.getElementById('activity-title') as HTMLInputElement)?.value.trim();
    const dateStr = (document.getElementById('activity-date') as HTMLInputElement)?.value;
    const startTime = (document.getElementById('activity-start-time') as HTMLInputElement)?.value;
    const endTime = (document.getElementById('activity-end-time') as HTMLInputElement)?.value;
    const location = (document.getElementById('activity-location') as HTMLInputElement)?.value.trim();
    const description = (document.getElementById('activity-description') as HTMLTextAreaElement)?.value.trim();
    const includeCleaning = (document.getElementById('activity-include-cleaning') as HTMLInputElement)?.checked;

    if (!title || !dateStr || !startTime || !endTime) {
      alert('Please fill in all required fields.');
      return;
    }

    const newActivity: Activity = {
      id: String(Date.now()),
      title,
      date: new Date(dateStr),
      startTime,
      endTime,
      type: editingActivity.type || 'meeting',
      description: description || '',
      location: location || undefined,
      includeCleaning: includeCleaning || false,
      agenda: []
    };

    activities.push(newActivity);
    showAddActivityModal = false;
    showToast(`Activity "${title}" created successfully!`);
    refreshActivitiesPage();
  });

  // Save agenda changes
  document.getElementById('save-agenda-changes')?.addEventListener('click', () => {
    if (!selectedActivity) return;

    // Update agenda items
    const inputs = document.querySelectorAll('.agenda-item-input');
    inputs.forEach(input => {
      const id = (input as HTMLElement).dataset.id;
      const val = (input as HTMLInputElement).value.trim();
      const item = selectedActivity?.agenda?.find(i => i.id === id);
      if (item) item.value = val;
    });

    // Update cleaning assignee
    const cleaningInput = document.getElementById('agenda-cleaning-assignee') as HTMLInputElement;
    if (cleaningInput) {
      selectedActivity.cleaningAssignee = cleaningInput.value.trim();
    }

    showToast('Agenda changes saved!');
    showAgendaModal = false;
    refreshActivitiesPage();
  });

  // Print agenda
  document.querySelectorAll('.print-agenda-btn, #print-full-agenda').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = (e.currentTarget as HTMLElement).dataset?.id;
      const activity = id ? activities.find(a => a.id === id) : selectedActivity;

      if (activity) {
        const printContent = `
                    <html>
                    <head>
                        <title>${activity.title} - Agenda</title>
                        <style>
                            body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
                            h1 { margin-bottom: 5px; color: #333; }
                            .meta { color: #666; margin-bottom: 30px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
                            .agenda-table { width: 100%; border-collapse: collapse; }
                            .agenda-table td { padding: 12px 5px; border-bottom: 1px solid #f0f0f0; }
                            .order { width: 30px; color: #888; }
                            .label { font-weight: bold; width: 40%; }
                            .value { text-align: left; }
                            .cleaning-sec { margin-top: 40px; padding: 15px; background: #f9f9f9; border-radius: 5px; }
                            .cleaning-sec h4 { margin: 0 0 10px; }
                        </style>
                    </head>
                    <body>
                        <h1>${activity.title}</h1>
                        <p class="meta">${formatDateLong(activity.date)} • ${formatTimeDisplay(activity.startTime)} - ${formatTimeDisplay(activity.endTime)} ${activity.location ? `• ${activity.location}` : ''}</p>
                        <table class="agenda-table">
                            ${activity.agenda?.sort((a, b) => a.order - b.order).map(item => `
                                <tr>
                                    <td class="order">${item.order}.</td>
                                    <td class="label">${item.label}</td>
                                    <td class="value">${item.value || '_______________________'}</td>
                                </tr>
                            `).join('') || '<tr><td>No agenda items</td></tr>'}
                        </table>
                        ${activity.includeCleaning ? `
                            <div class="cleaning-sec">
                                <h4>🧹 Facility Cleaning</h4>
                                <p>Assigned to: ${activity.cleaningAssignee || '_______________________'}</p>
                            </div>
                        ` : ''}
                    </body>
                    </html>
                `;
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(printContent);
          printWindow.document.close();
          printWindow.print();
        }
      }
    });
  });

  // Create agenda from template
  document.getElementById('create-agenda-from-template')?.addEventListener('click', () => {
    const type = selectedActivity?.type;
    const template = activityTemplates.find(t => t.type === type) || activityTemplates[0];

    if (selectedActivity && template) {
      selectedActivity.agenda = template.items.map((item, idx) => ({
        id: `agenda-${Date.now()}-${idx}`,
        type: item.type,
        label: item.label,
        value: '',
        order: item.order
      }));
      selectedActivity.includeCleaning = template.includeCleaning;
      refreshActivitiesPage();
    }
  });

  // New template button
  document.getElementById('new-template-btn')?.addEventListener('click', () => {
    editingTemplate = null;
    refreshActivitiesPage();
  });

  // Save template
  document.getElementById('save-template')?.addEventListener('click', () => {
    const name = (document.getElementById('template-name') as HTMLInputElement)?.value.trim();
    const type = (document.getElementById('template-type') as HTMLSelectElement)?.value as Activity['type'];
    const includeCleaning = (document.getElementById('template-include-cleaning') as HTMLInputElement)?.checked;

    if (!name) {
      alert('Please enter a template name.');
      return;
    }

    const items: ActivityTemplate['items'] = [];
    document.querySelectorAll('.template-item-row').forEach((row, idx) => {
      const itemType = (row.querySelector('.item-type-select') as HTMLSelectElement)?.value as AgendaItem['type'];
      const label = (row.querySelector('.item-label-input') as HTMLInputElement)?.value.trim() || 'Item';
      items.push({ type: itemType, label, order: idx + 1 });
    });

    if (editingTemplate) {
      const idx = activityTemplates.findIndex(t => t.id === editingTemplate!.id);
      if (idx !== -1) {
        activityTemplates[idx] = { ...editingTemplate, name, type, items, includeCleaning };
        showToast('Template updated!');
      }
    } else {
      activityTemplates.push({
        id: `template-${Date.now()}`,
        name,
        type,
        items,
        includeCleaning
      });
      showToast('Template created!');
    }

    editingTemplate = null;
    refreshActivitiesPage();
  });

  // Add template item
  document.getElementById('add-template-item')?.addEventListener('click', () => {
    const list = document.getElementById('template-items');
    if (list) {
      const order = list.children.length + 1;
      const row = document.createElement('div');
      row.className = 'template-item-row';
      row.dataset.order = String(order);
      row.innerHTML = `
                <span class="item-order">${order}</span>
                <select class="item-type-select">
                    <option value="opening-prayer">🙏 Opening Prayer</option>
                    <option value="closing-prayer">🙏 Closing Prayer</option>
                    <option value="opening-hymn">🎵 Opening Hymn</option>
                    <option value="closing-hymn">🎵 Closing Hymn</option>
                    <option value="speaker">🎤 Speaker</option>
                    <option value="announcement">📢 Announcement</option>
                    <option value="custom" selected>✏️ Custom Item</option>
                </select>
                <input type="text" class="item-label-input" placeholder="Label">
                <button class="btn-icon remove-item-btn">🗑️</button>
            `;
      list.appendChild(row);

      row.querySelector('.remove-item-btn')?.addEventListener('click', () => row.remove());
    }
  });

  // Edit template button
  document.querySelectorAll('.edit-template-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = (e.currentTarget as HTMLElement).dataset.id;
      editingTemplate = activityTemplates.find(t => t.id === id) || null;
      refreshActivitiesPage();
    });
  });

  // Template card click to select
  document.querySelectorAll('.template-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = (card as HTMLElement).dataset.id;
      editingTemplate = activityTemplates.find(t => t.id === id) || null;
      refreshActivitiesPage();
    });
  });

  // Delete template button
  document.querySelectorAll('.delete-template-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = (e.currentTarget as HTMLElement).dataset.id;
      if (confirm('Delete this template?')) {
        activityTemplates = activityTemplates.filter(t => t.id !== id);
        if (editingTemplate?.id === id) editingTemplate = null;
        showToast('Template deleted.');
        refreshActivitiesPage();
      }
    });
  });

  // Template apply in add modal
  document.querySelectorAll('.template-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const templateId = (btn as HTMLElement).dataset.template;
      const template = activityTemplates.find(t => t.id === templateId);
      if (template) {
        editingActivity.type = template.type;
        editingActivity.includeCleaning = template.includeCleaning;
        showToast(`Template "${template.name}" applied!`);
        refreshActivitiesPage();
      }
    });
  });
}
