import { UI } from '../utils/core';

// Types
interface CleaningAssignment {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  assignedTo: string;
  rooms: string[];
  status: 'draft' | 'scheduled' | 'completed' | 'cancelled' | 'archived';
  notes?: string;
  createdAt: number;
}

interface Room {
  id: string;
  number: string;
  name: string;
  icon: string;
  description: string;
}

// Editable Rooms List
let churchRooms: Room[] = [
  { id: 'chapel', number: '101', name: 'Chapel', icon: '⛪', description: 'Main worship area including pews and pulpit' },
  { id: 'cultural-hall', number: '102', name: 'Cultural Hall', icon: '🏀', description: 'Gym and stage area' },
  { id: 'foyer', number: '103', name: 'Foyer', icon: '🚪', description: 'Entrance and lobby areas' },
  { id: 'restrooms', number: '104', name: 'Restrooms', icon: '🚻', description: 'All bathroom facilities' },
  { id: 'kitchen', number: '105', name: 'Kitchen', icon: '🍽️', description: 'Kitchen and serving area' },
  { id: 'classroom-1', number: '201', name: 'Classroom 1', icon: '📚', description: 'Primary classroom' },
  { id: 'classroom-2', number: '202', name: 'Classroom 2', icon: '📚', description: 'Sunday School classroom' },
  { id: 'classroom-3', number: '203', name: 'Classroom 3', icon: '📚', description: 'Gospel Doctrine classroom' },
  { id: 'relief-society', number: '204', name: 'Relief Society Room', icon: '🌸', description: 'Relief Society meeting room' },
  { id: 'elders-quorum', number: '205', name: 'Elders Quorum Room', icon: '👔', description: 'Elders Quorum meeting room' },
  { id: 'youth-room-yw', number: '206', name: 'Young Women Room', icon: '🌟', description: 'Young Women meeting area' },
  { id: 'youth-room-ym', number: '207', name: 'Young Men Room', icon: '🔥', description: 'Young Men meeting area' },
  { id: 'nursery', number: '208', name: 'Nursery', icon: '👶', description: 'Nursery and toddler areas' },
  { id: 'primary-room', number: '209', name: 'Primary Room', icon: '🌈', description: 'Primary sharing time room' },
  { id: 'hallways', number: 'H01', name: 'Hallways', icon: '🚶', description: 'All corridors and walkways' },
  { id: 'parking-lot', number: 'EXT', name: 'Parking Lot', icon: '🅿️', description: 'Exterior parking area and sidewalks' },
];

// Available dates for cleaning (admin controlled)
// If empty, all Saturdays are available by default
let availableDates: Set<string> = new Set([
  '2026-01-17', '2026-01-18', '2026-01-24', '2026-01-25', '2026-01-31',
  '2026-02-01', '2026-02-07', '2026-02-08', '2026-02-14', '2026-02-15'
]);

// Sample cleaning assignments (in real app, would come from database)
let cleaningAssignments: CleaningAssignment[] = [
  {
    id: '1',
    date: '2026-01-17',
    startTime: '09:00',
    endTime: '11:00',
    assignedTo: 'Smith Family',
    rooms: ['chapel', 'foyer', 'restrooms'],
    status: 'scheduled',
    createdAt: Date.now()
  },
  {
    id: '2',
    date: '2026-01-24',
    startTime: '10:00',
    endTime: '12:00',
    assignedTo: 'Johnson Family',
    rooms: ['cultural-hall', 'kitchen', 'classroom-1'],
    status: 'scheduled',
    createdAt: Date.now()
  },
  {
    id: '3',
    date: '2026-01-31',
    startTime: '08:00',
    endTime: '10:00',
    assignedTo: 'Williams Family',
    rooms: ['chapel', 'restrooms', 'hallways'],
    status: 'draft',
    createdAt: Date.now()
  }
];

// State
let currentYear = 2026;
let currentMonth = 1;
let selectedDate: string | null = null;
let selectedRooms: Set<string> = new Set();
let assigneeName: string = '';
let selectedStartTime: string = '09:00';
let selectedEndTime: string = '11:00';
let showRoomManager: boolean = false;
let editingRoom: Room | null = null;
let showBookingsManager: boolean = false;
let showAvailableDatesManager: boolean = false;
let bookingFilter: 'all' | 'draft' | 'scheduled' | 'completed' | 'cancelled' | 'archived' = 'all';

function getCleaningsForDate(date: string): CleaningAssignment[] {
  return cleaningAssignments.filter(a => a.date === date);
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

function renderCleaningCalendar(): string {
  const firstDay = new Date(currentYear, currentMonth - 1, 1);
  const lastDay = new Date(currentYear, currentMonth, 0);
  const daysInMonth = lastDay.getDate();
  const startingDay = firstDay.getDay();

  const monthName = firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === currentYear && today.getMonth() === currentMonth - 1;
  const currentDay = today.getDate();

  let calendarDays = '';

  for (let i = 0; i < startingDay; i++) {
    calendarDays += '<div class="cleaning-calendar-day empty"></div>';
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const date = new Date(currentYear, currentMonth - 1, day);
    const isSaturday = date.getDay() === 6;
    const isToday = isCurrentMonth && day === currentDay;
    const isAvailable = availableDates.has(dateStr);
    const bookingsForDate = cleaningAssignments.filter(a => a.date === dateStr && a.status !== 'cancelled' && a.status !== 'archived');
    const hasBookings = bookingsForDate.length > 0;
    const isSelected = selectedDate === dateStr;
    const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());

    calendarDays += `
      <div class="cleaning-calendar-day ${isSaturday ? 'saturday' : ''} ${isToday ? 'today' : ''} ${isAvailable ? 'available' : 'unavailable'} ${hasBookings ? 'has-bookings' : ''} ${isSelected ? 'selected' : ''} ${isPast ? 'past' : ''}" 
           data-date="${dateStr}" ${isPast ? 'data-past="true"' : ''} ${!isAvailable && !isPast ? 'data-unavailable="true"' : ''}>
        <span class="day-num">${day}</span>
        ${isSaturday ? '<span class="sat-label">SAT</span>' : ''}
        ${isAvailable && !isPast ? '<span class="available-indicator">✓</span>' : ''}
        ${hasBookings ? `<span class="booking-count">${bookingsForDate.length}</span>` : ''}
      </div>
    `;
  }

  return `
    <div class="cleaning-calendar-container">
      <div class="cleaning-calendar-header">
        <button class="cleaning-nav-btn" id="cleaning-prev-month">◀</button>
        <h4 class="cleaning-month-title">${monthName}</h4>
        <button class="cleaning-nav-btn" id="cleaning-next-month">▶</button>
      </div>
      <div class="cleaning-calendar-weekdays">
        <span>Sun</span>
        <span>Mon</span>
        <span>Tue</span>
        <span>Wed</span>
        <span>Thu</span>
        <span>Fri</span>
        <span class="sat">Sat</span>
      </div>
      <div class="cleaning-calendar-grid">
        ${calendarDays}
      </div>
      <div class="cleaning-calendar-legend">
        <span class="legend-item"><span class="legend-dot available"></span> Open for Booking</span>
        <span class="legend-item"><span class="legend-dot has-bookings"></span> Has Signups</span>
        <span class="legend-item"><span class="legend-dot unavailable"></span> Not Available</span>
      </div>
    </div>
  `;
}

function renderRoomSelection(): string {
  return `
    <div class="room-selection-grid">
      ${churchRooms.map(room => `
        <div class="room-card ${selectedRooms.has(room.id) ? 'selected' : ''}" data-room="${room.id}">
          <div class="room-number-badge">${room.number}</div>
          <div class="room-icon">${room.icon}</div>
          <div class="room-info">
            <span class="room-name">${room.name}</span>
            <span class="room-desc">${room.description}</span>
          </div>
          <div class="room-checkbox">
            ${selectedRooms.has(room.id) ? '✓' : ''}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderUpcomingCleanings(): string {
  // Only show confirmed (scheduled) appointments in the public view
  const upcoming = cleaningAssignments
    .filter(a => a.status === 'scheduled' && new Date(a.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  if (upcoming.length === 0) {
    return `
      <div class="no-cleanings">
        <span class="empty-icon">🧹</span>
        <p>No upcoming confirmed cleaning assignments</p>
      </div>
    `;
  }

  return `
    <div class="upcoming-cleanings-list">
      ${upcoming.map(a => {
    const rooms = a.rooms.map((r: string) => churchRooms.find(cr => cr.id === r)).filter(Boolean);
    return `
          <div class="upcoming-cleaning-card ${a.status}">
            <div class="cleaning-date-badge">
              <span class="cleaning-month">${new Date(a.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}</span>
              <span class="cleaning-day">${new Date(a.date + 'T00:00:00').getDate()}</span>
            </div>
            <div class="cleaning-details">
              <span class="cleaning-assignee">${UI.escape(a.assignedTo)}</span>
              <div class="cleaning-rooms-mini">
                ${rooms.map((r: Room | undefined) => `<span class="room-tag"><span class="room-num-mini">${r!.number}</span> ${r!.icon} ${r!.name}</span>`).join('')}
              </div>
            </div>
            <span class="cleaning-status-badge status-${a.status}">${a.status}</span>
          </div>
        `;
  }).join('')}
    </div>
  `;
}

function renderBlockingForm(): string {
  if (!selectedDate) {
    return `
      <div class="no-date-message">
        <span class="icon">📅</span>
        <h4>Select a Date</h4>
        <p>Click on a date in the calendar to sign up for cleaning duty.</p>
        <p class="tip">💡 Saturdays are the preferred cleaning days.</p>
      </div>
    `;
  }

  const existingAssignments = getCleaningsForDate(selectedDate);

  // Separate confirmed vs user's own non-confirmed appointments
  // For now, we'll use assigneeName to simulate "current user" matching
  const confirmedBookings = existingAssignments.filter(a => a.status === 'scheduled' || a.status === 'completed');
  const userOwnBookings = existingAssignments.filter(a =>
    (a.status === 'draft' || a.status === 'cancelled' || a.status === 'archived')
    && assigneeName && a.assignedTo.toLowerCase().includes(assigneeName.toLowerCase())
  );

  // Build the existing assignments section
  let existingSection = '';

  // Show confirmed bookings (visible to everyone)
  if (confirmedBookings.length > 0) {
    existingSection += `
      <div class="existing-bookings-section confirmed-section">
        <div class="existing-bookings-header">
          <span class="icon">✅</span>
          <h5>Confirmed Signups (${confirmedBookings.length})</h5>
        </div>
        <div class="existing-bookings-list">
          ${confirmedBookings.map(assignment => {
      const rooms = assignment.rooms.map((r: string) => churchRooms.find(cr => cr.id === r)).filter(Boolean);
      return `
              <div class="existing-booking-item">
                <div class="booking-info">
                  <span class="booking-name">${UI.escape(assignment.assignedTo)}</span>
                  <span class="booking-time">🕐 ${formatTime(assignment.startTime)} - ${formatTime(assignment.endTime)}</span>
                </div>
                <div class="booking-rooms">
                  ${rooms.map((r: Room | undefined) => `<span class="room-tag-mini">${r!.number} ${r!.icon}</span>`).join('')}
                </div>
              </div>
            `;
    }).join('')}
        </div>
      </div>
    `;
  }

  // Show user's own non-confirmed bookings (only visible to them)
  if (userOwnBookings.length > 0) {
    existingSection += `
      <div class="existing-bookings-section personal-section">
        <div class="existing-bookings-header">
          <span class="icon">👤</span>
          <h5>Your Bookings (${userOwnBookings.length})</h5>
        </div>
        <div class="existing-bookings-list">
          ${userOwnBookings.map(assignment => {
      const rooms = assignment.rooms.map((r: string) => churchRooms.find(cr => cr.id === r)).filter(Boolean);
      return `
              <div class="existing-booking-item status-${assignment.status}">
                <div class="booking-info">
                  <span class="booking-name">${UI.escape(assignment.assignedTo)}</span>
                  <span class="booking-status-mini status-${assignment.status}">${assignment.status}</span>
                  <span class="booking-time">🕐 ${formatTime(assignment.startTime)} - ${formatTime(assignment.endTime)}</span>
                </div>
                <div class="booking-rooms">
                  ${rooms.map((r: Room | undefined) => `<span class="room-tag-mini">${r!.number} ${r!.icon}</span>`).join('')}
                </div>
              </div>
            `;
    }).join('')}
        </div>
      </div>
    `;
  }

  if (existingSection) {
    existingSection += `<p class="existing-note">You can still sign up for the same or different rooms!</p>`;
  }

  return `
    <div class="blocking-form">
      <div class="form-header">
        <h4>🧹 Sign Up for Cleaning</h4>
        <span class="selected-date">${formatDate(selectedDate)}</span>
      </div>
      
      ${existingSection}
      
      <div class="form-section">
        <label class="form-label">Your Name / Family Name</label>
        <input type="text" id="assignee-input" class="form-input" placeholder="e.g., Smith Family" value="${UI.escape(assigneeName)}">
      </div>
      
      <div class="form-section">
        <label class="form-label">Time Frame</label>
        <p class="form-hint">Select when you plan to clean.</p>
        <div class="time-frame-inputs">
          <div class="time-input-group">
            <label>Start Time</label>
            <select id="start-time-input" class="form-input">
              ${generateTimeOptions(selectedStartTime)}
            </select>
          </div>
          <span class="time-separator">to</span>
          <div class="time-input-group">
            <label>End Time</label>
            <select id="end-time-input" class="form-input">
              ${generateTimeOptions(selectedEndTime)}
            </select>
          </div>
        </div>
      </div>
      
      <div class="form-section">
        <label class="form-label">Select Rooms to Clean</label>
        <p class="form-hint">Click rooms to select them. You can select multiple rooms.</p>
        ${renderRoomSelection()}
        <div class="selected-rooms-count">
          <span id="rooms-count">${selectedRooms.size}</span> rooms selected
        </div>
      </div>
      
      <div class="form-section">
        <label class="form-label">Notes (Optional)</label>
        <textarea id="cleaning-notes" class="form-textarea" placeholder="Any special notes or instructions..."></textarea>
      </div>
      
      <div class="form-actions">
        <button class="btn-secondary" id="cancel-booking-btn">
          <span>✕</span> Cancel
        </button>
        <button class="btn-primary" id="confirm-booking-btn" ${selectedRooms.size === 0 ? 'disabled' : ''}>
          <span>✓</span> Confirm Booking
        </button>
      </div>
    </div>
  `;
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

function generateTimeOptions(selected: string): string {
  const times: string[] = [];
  for (let h = 6; h <= 21; h++) {
    times.push(`${h.toString().padStart(2, '0')}:00`);
    times.push(`${h.toString().padStart(2, '0')}:30`);
  }
  return times.map(t => `<option value="${t}" ${t === selected ? 'selected' : ''}>${formatTime(t)}</option>`).join('');
}

function renderRoomManagerModal(): string {
  if (!showRoomManager) return '';

  return `
    <div class="modal" id="room-manager-modal">
      <div class="modal-backdrop" id="room-manager-backdrop"></div>
      <div class="modal-content glass-container modal-large">
        <div class="modal-header">
          <h2>🏠 Manage Rooms</h2>
          <button class="btn-icon" id="close-room-manager">✕</button>
        </div>
        <div class="modal-body">
          ${editingRoom ? renderRoomEditForm() : renderRoomsList()}
        </div>
      </div>
    </div>
  `;
}

function renderRoomsList(): string {
  return `
    <div class="room-manager-content">
      <div class="room-manager-header">
        <p class="room-manager-info">Manage the rooms available for cleaning assignments. Each room has a number, name, and description.</p>
        <button class="btn-primary" id="add-room-btn">
          <span>➕</span> Add New Room
        </button>
      </div>
      
      <div class="rooms-list">
        ${churchRooms.map(room => `
          <div class="room-manager-item" data-room-id="${room.id}">
            <div class="room-manager-number">${room.number}</div>
            <div class="room-manager-icon">${room.icon}</div>
            <div class="room-manager-info-col">
              <span class="room-manager-name">${room.name}</span>
              <span class="room-manager-desc">${room.description}</span>
            </div>
            <div class="room-manager-actions">
              <button class="btn-icon edit-room-btn" data-room-id="${room.id}" title="Edit">✏️</button>
              <button class="btn-icon delete-room-btn" data-room-id="${room.id}" title="Delete">🗑️</button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderRoomEditForm(): string {
  const isNew = editingRoom?.id === 'new';
  const room = editingRoom!;

  return `
    <div class="room-edit-form">
      <h3>${isNew ? '➕ Add New Room' : '✏️ Edit Room'}</h3>
      
      <div class="form-grid-2col">
        <div class="form-section">
          <label class="form-label">Room Number *</label>
          <input type="text" id="room-number-input" class="form-input" placeholder="e.g., 101" value="${UI.escape(room.number)}" maxlength="5">
        </div>
        
        <div class="form-section">
          <label class="form-label">Room Icon</label>
          <input type="text" id="room-icon-input" class="form-input" placeholder="e.g., 📚" value="${room.icon}" maxlength="4">
        </div>
      </div>
      
      <div class="form-section">
        <label class="form-label">Room Name *</label>
        <input type="text" id="room-name-input" class="form-input" placeholder="e.g., Classroom 4" value="${UI.escape(room.name)}">
      </div>
      
      <div class="form-section">
        <label class="form-label">Description</label>
        <input type="text" id="room-desc-input" class="form-input" placeholder="Brief description of the room" value="${UI.escape(room.description)}">
      </div>
      
      <div class="form-actions">
        <button class="btn-secondary" id="cancel-room-edit-btn">
          <span>✕</span> Cancel
        </button>
        <button class="btn-primary" id="save-room-btn">
          <span>💾</span> ${isNew ? 'Add Room' : 'Save Changes'}
        </button>
      </div>
    </div>
  `;
}

// Bookings Manager Modal
function renderBookingsManagerModal(): string {
  if (!showBookingsManager) return '';

  const filteredAssignments = bookingFilter === 'all'
    ? cleaningAssignments
    : cleaningAssignments.filter(a => a.status === bookingFilter);

  return `
    <div class="modal" id="bookings-manager-modal">
      <div class="modal-backdrop" id="bookings-manager-backdrop"></div>
      <div class="modal-content glass-container modal-large">
        <div class="modal-header">
          <h2>📋 Manage Bookings</h2>
          <button class="btn-icon" id="close-bookings-manager">✕</button>
        </div>
        <div class="modal-body">
          <div class="bookings-filter-bar">
            <button class="filter-chip ${bookingFilter === 'all' ? 'active' : ''}" data-filter="all">All (${cleaningAssignments.length})</button>
            <button class="filter-chip ${bookingFilter === 'draft' ? 'active' : ''}" data-filter="draft">📝 Draft (${cleaningAssignments.filter(a => a.status === 'draft').length})</button>
            <button class="filter-chip ${bookingFilter === 'scheduled' ? 'active' : ''}" data-filter="scheduled">📅 Scheduled (${cleaningAssignments.filter(a => a.status === 'scheduled').length})</button>
            <button class="filter-chip ${bookingFilter === 'completed' ? 'active' : ''}" data-filter="completed">✅ Completed (${cleaningAssignments.filter(a => a.status === 'completed').length})</button>
            <button class="filter-chip ${bookingFilter === 'cancelled' ? 'active' : ''}" data-filter="cancelled">❌ Cancelled (${cleaningAssignments.filter(a => a.status === 'cancelled').length})</button>
            <button class="filter-chip ${bookingFilter === 'archived' ? 'active' : ''}" data-filter="archived">📦 Archived (${cleaningAssignments.filter(a => a.status === 'archived').length})</button>
          </div>
          
          <div class="bookings-list">
            ${filteredAssignments.length === 0 ? `
              <div class="no-bookings">
                <span class="empty-icon">📋</span>
                <p>No bookings found with this filter.</p>
              </div>
            ` : filteredAssignments.map(booking => {
    const rooms = booking.rooms.map((r: string) => churchRooms.find(cr => cr.id === r)).filter(Boolean);
    return `
                <div class="booking-manager-item" data-booking-id="${booking.id}">
                  <div class="booking-status-indicator status-${booking.status}"></div>
                  <div class="booking-main-info">
                    <div class="booking-row-header">
                      <span class="booking-assignee-name">${UI.escape(booking.assignedTo)}</span>
                      <span class="booking-status-badge status-${booking.status}">${booking.status}</span>
                    </div>
                    <div class="booking-details-row">
                      <span class="booking-date">📅 ${formatDate(booking.date)}</span>
                      <span class="booking-time-range">🕐 ${formatTime(booking.startTime)} - ${formatTime(booking.endTime)}</span>
                    </div>
                    <div class="booking-rooms-row">
                      ${rooms.map((r: Room | undefined) => `<span class="room-tag-mini">${r!.number} ${r!.icon} ${r!.name}</span>`).join('')}
                    </div>
                  </div>
                  <div class="booking-actions-col">
                    ${booking.status === 'draft' ? `<button class="btn-action schedule-btn" data-id="${booking.id}" title="Schedule">📅</button>` : ''}
                    ${booking.status === 'scheduled' ? `<button class="btn-action complete-btn" data-id="${booking.id}" title="Mark Complete">✅</button>` : ''}
                    ${booking.status !== 'cancelled' && booking.status !== 'archived' ? `<button class="btn-action cancel-btn" data-id="${booking.id}" title="Cancel">❌</button>` : ''}
                    ${booking.status !== 'archived' ? `<button class="btn-action archive-btn" data-id="${booking.id}" title="Archive">📦</button>` : ''}
                    <button class="btn-action edit-booking-btn" data-id="${booking.id}" title="Edit">✏️</button>
                    <button class="btn-action delete-booking-btn" data-id="${booking.id}" title="Delete">🗑️</button>
                  </div>
                </div>
              `;
  }).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

// Available Dates Manager Modal
function renderAvailableDatesManagerModal(): string {
  if (!showAvailableDatesManager) return '';

  const calendarYear = currentYear;
  const calendarMonth = currentMonth;
  const firstDay = new Date(calendarYear, calendarMonth - 1, 1);
  const lastDay = new Date(calendarYear, calendarMonth, 0);
  const daysInMonth = lastDay.getDate();
  const startingDay = firstDay.getDay();
  const monthName = firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  let calendarDays = '';
  for (let i = 0; i < startingDay; i++) {
    calendarDays += '<div class="admin-calendar-day empty"></div>';
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${calendarYear}-${String(calendarMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isAvailable = availableDates.has(dateStr);
    const date = new Date(calendarYear, calendarMonth - 1, day);
    const isSaturday = date.getDay() === 6;

    calendarDays += `
      <div class="admin-calendar-day ${isAvailable ? 'available' : ''} ${isSaturday ? 'saturday' : ''}" data-date="${dateStr}">
        <span class="day-num">${day}</span>
        ${isAvailable ? '<span class="check-mark">✓</span>' : ''}
      </div>
    `;
  }

  return `
    <div class="modal" id="dates-manager-modal">
      <div class="modal-backdrop" id="dates-manager-backdrop"></div>
      <div class="modal-content glass-container modal-large">
        <div class="modal-header">
          <h2>📅 Manage Available Dates</h2>
          <button class="btn-icon" id="close-dates-manager">✕</button>
        </div>
        <div class="modal-body">
          <p class="admin-info">Click on dates to toggle availability for cleaning signups. Only available dates can be booked by members.</p>
          
          <div class="admin-calendar-nav">
            <button class="cleaning-nav-btn" id="admin-prev-month">◀</button>
            <h4 class="cleaning-month-title">${monthName}</h4>
            <button class="cleaning-nav-btn" id="admin-next-month">▶</button>
          </div>
          
          <div class="admin-quick-actions">
            <button class="btn-secondary" id="select-all-saturdays">Select All Saturdays</button>
            <button class="btn-secondary" id="clear-all-dates">Clear All</button>
          </div>
          
          <div class="admin-calendar-weekdays">
            <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span class="sat">Sat</span>
          </div>
          <div class="admin-calendar-grid">
            ${calendarDays}
          </div>
          
          <div class="admin-stats">
            <span>📊 ${availableDates.size} dates available for cleaning</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function renderCleaningPage(): string {
  const headerActions = `
    <button class="btn-secondary" id="manage-bookings-btn">
      <span>📋</span> Manage Bookings
    </button>
    <button class="btn-secondary" id="manage-dates-btn">
      <span>📅</span> Available Dates
    </button>
    <button class="btn-secondary" id="manage-rooms-btn">
      <span>🏠</span> Manage Rooms
    </button>
    <button class="btn-secondary" id="print-schedule-btn">
      <span>🖨️</span> Print Schedule
    </button>
  `;

  return `
    <div class="page cleaning-page">
      ${UI.header('Church Cleaning', 'Sign up for weekly cleaning assignments.', headerActions)}
      
      <div class="cleaning-layout">
        <!-- Left: Calendar -->
        <div class="cleaning-calendar-section">
          <div class="section-card">
            <div class="section-title">
              <span class="section-icon">📅</span>
              <h3>Select a Cleaning Date</h3>
            </div>
            ${renderCleaningCalendar()}
          </div>
          
          <div class="section-card upcoming-section">
            <div class="section-title">
              <span class="section-icon">📋</span>
              <h3>Upcoming Schedule</h3>
            </div>
            ${renderUpcomingCleanings()}
          </div>
        </div>
        
        <!-- Right: Booking Form -->
        <div class="cleaning-booking-section">
          <div class="section-card booking-card">
            ${renderBlockingForm()}
          </div>
        </div>
      </div>
      
      ${renderRoomManagerModal()}
      ${renderBookingsManagerModal()}
      ${renderAvailableDatesManagerModal()}
    </div>
  `;
}

export function attachCleaningListeners(): void {
  // Calendar navigation
  document.getElementById('cleaning-prev-month')?.addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 1) { currentMonth = 12; currentYear--; }
    refreshCleaningPage();
  });

  document.getElementById('cleaning-next-month')?.addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 12) { currentMonth = 1; currentYear++; }
    refreshCleaningPage();
  });

  // Date selection
  document.querySelectorAll('.cleaning-calendar-day:not(.empty)').forEach(day => {
    day.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLElement;
      const dateStr = target.dataset.date;
      const isPast = target.dataset.past === 'true';

      if (isPast) {
        alert('You cannot schedule cleaning for past dates.');
        return;
      }

      const isUnavailable = target.dataset.unavailable === 'true';
      if (isUnavailable) {
        alert('This date is not available for cleaning signups. Contact an administrator to open this date.');
        return;
      }

      selectedDate = dateStr || null;
      selectedRooms.clear();
      assigneeName = '';
      refreshCleaningPage();
    });
  });

  // Room selection
  document.querySelectorAll('.room-card').forEach(card => {
    card.addEventListener('click', (e) => {
      const roomId = (e.currentTarget as HTMLElement).dataset.room;
      if (roomId) {
        if (selectedRooms.has(roomId)) {
          selectedRooms.delete(roomId);
        } else {
          selectedRooms.add(roomId);
        }
        refreshCleaningPage();
      }
    });
  });

  // Assignee input
  document.getElementById('assignee-input')?.addEventListener('input', (e) => {
    assigneeName = (e.target as HTMLInputElement).value;
  });

  // Cancel button
  document.getElementById('cancel-booking-btn')?.addEventListener('click', () => {
    selectedDate = null;
    selectedRooms.clear();
    assigneeName = '';
    refreshCleaningPage();
  });

  // Clear selection button
  document.getElementById('clear-selection-btn')?.addEventListener('click', () => {
    selectedDate = null;
    selectedRooms.clear();
    refreshCleaningPage();
  });

  // Confirm booking
  document.getElementById('confirm-booking-btn')?.addEventListener('click', () => {
    const nameInput = document.getElementById('assignee-input') as HTMLInputElement;
    const notesInput = document.getElementById('cleaning-notes') as HTMLTextAreaElement;
    const startTimeInput = document.getElementById('start-time-input') as HTMLSelectElement;
    const endTimeInput = document.getElementById('end-time-input') as HTMLSelectElement;

    if (!selectedDate) return;
    if (!nameInput?.value.trim()) {
      alert('Please enter your name or family name.');
      return;
    }
    if (selectedRooms.size === 0) {
      alert('Please select at least one room to clean.');
      return;
    }

    const startTime = startTimeInput?.value || '09:00';
    const endTime = endTimeInput?.value || '11:00';

    // Create new assignment
    const newAssignment: CleaningAssignment = {
      id: String(Date.now()),
      date: selectedDate,
      startTime: startTime,
      endTime: endTime,
      assignedTo: nameInput.value.trim(),
      rooms: Array.from(selectedRooms),
      status: 'scheduled',
      notes: notesInput?.value.trim() || undefined,
      createdAt: Date.now()
    };

    cleaningAssignments.push(newAssignment);

    // Show success message
    showCleaningToast(`Successfully booked cleaning for ${formatDate(selectedDate)}!`);

    // Reset form
    selectedDate = null;
    selectedRooms.clear();
    assigneeName = '';

    refreshCleaningPage();
  });

  // Print schedule
  document.getElementById('print-schedule-btn')?.addEventListener('click', () => {
    window.print();
  });

  // =====================
  // Room Manager Listeners
  // =====================

  // Open Room Manager
  document.getElementById('manage-rooms-btn')?.addEventListener('click', () => {
    showRoomManager = true;
    editingRoom = null;
    refreshCleaningPage();
  });

  // Close Room Manager
  document.getElementById('close-room-manager')?.addEventListener('click', () => {
    showRoomManager = false;
    editingRoom = null;
    refreshCleaningPage();
  });

  document.getElementById('room-manager-backdrop')?.addEventListener('click', () => {
    showRoomManager = false;
    editingRoom = null;
    refreshCleaningPage();
  });

  // Add New Room
  document.getElementById('add-room-btn')?.addEventListener('click', () => {
    editingRoom = { id: 'new', number: '', name: '', icon: '📦', description: '' };
    refreshCleaningPage();
  });

  // Edit Room buttons
  document.querySelectorAll('.edit-room-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const roomId = (e.currentTarget as HTMLElement).dataset.roomId;
      const room = churchRooms.find(r => r.id === roomId);
      if (room) {
        editingRoom = { ...room };
        refreshCleaningPage();
      }
    });
  });

  // Delete Room buttons
  document.querySelectorAll('.delete-room-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const roomId = (e.currentTarget as HTMLElement).dataset.roomId;
      const room = churchRooms.find(r => r.id === roomId);
      if (room && confirm(`Are you sure you want to delete "${room.name}" (Room ${room.number})?`)) {
        churchRooms = churchRooms.filter(r => r.id !== roomId);
        showCleaningToast(`Room "${room.name}" deleted.`);
        refreshCleaningPage();
      }
    });
  });

  // Cancel room edit
  document.getElementById('cancel-room-edit-btn')?.addEventListener('click', () => {
    editingRoom = null;
    refreshCleaningPage();
  });

  // Save room
  document.getElementById('save-room-btn')?.addEventListener('click', () => {
    const numberInput = document.getElementById('room-number-input') as HTMLInputElement;
    const nameInput = document.getElementById('room-name-input') as HTMLInputElement;
    const iconInput = document.getElementById('room-icon-input') as HTMLInputElement;
    const descInput = document.getElementById('room-desc-input') as HTMLInputElement;

    const roomNumber = numberInput?.value.trim();
    const roomName = nameInput?.value.trim();
    const roomIcon = iconInput?.value.trim() || '📦';
    const roomDesc = descInput?.value.trim() || '';

    if (!roomNumber) {
      alert('Please enter a room number.');
      return;
    }
    if (!roomName) {
      alert('Please enter a room name.');
      return;
    }

    if (editingRoom?.id === 'new') {
      // Add new room
      const newRoom: Room = {
        id: `room-${Date.now()}`,
        number: roomNumber,
        name: roomName,
        icon: roomIcon,
        description: roomDesc
      };
      churchRooms.push(newRoom);
      showCleaningToast(`Room "${roomName}" added successfully!`);
    } else if (editingRoom) {
      // Update existing room
      const index = churchRooms.findIndex(r => r.id === editingRoom!.id);
      if (index !== -1) {
        churchRooms[index] = {
          ...churchRooms[index],
          number: roomNumber,
          name: roomName,
          icon: roomIcon,
          description: roomDesc
        };
        showCleaningToast(`Room "${roomName}" updated!`);
      }
    }

    editingRoom = null;
    refreshCleaningPage();
  });

  // =====================
  // Bookings Manager Listeners
  // =====================

  // Open Bookings Manager
  document.getElementById('manage-bookings-btn')?.addEventListener('click', () => {
    showBookingsManager = true;
    bookingFilter = 'all';
    refreshCleaningPage();
  });

  // Close Bookings Manager
  document.getElementById('close-bookings-manager')?.addEventListener('click', () => {
    showBookingsManager = false;
    refreshCleaningPage();
  });

  document.getElementById('bookings-manager-backdrop')?.addEventListener('click', () => {
    showBookingsManager = false;
    refreshCleaningPage();
  });

  // Booking filter chips
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      const filter = (e.currentTarget as HTMLElement).dataset.filter as typeof bookingFilter;
      if (filter) {
        bookingFilter = filter;
        refreshCleaningPage();
      }
    });
  });

  // Booking actions
  document.querySelectorAll('.schedule-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = (e.currentTarget as HTMLElement).dataset.id;
      const assignment = cleaningAssignments.find(a => a.id === id);
      if (assignment) {
        assignment.status = 'scheduled';
        showCleaningToast(`Booking scheduled successfully!`);
        refreshCleaningPage();
      }
    });
  });

  document.querySelectorAll('.complete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = (e.currentTarget as HTMLElement).dataset.id;
      const assignment = cleaningAssignments.find(a => a.id === id);
      if (assignment) {
        assignment.status = 'completed';
        showCleaningToast(`Booking marked as complete!`);
        refreshCleaningPage();
      }
    });
  });

  document.querySelectorAll('.cancel-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = (e.currentTarget as HTMLElement).dataset.id;
      const assignment = cleaningAssignments.find(a => a.id === id);
      if (assignment && confirm(`Cancel booking for ${assignment.assignedTo}?`)) {
        assignment.status = 'cancelled';
        showCleaningToast(`Booking cancelled.`);
        refreshCleaningPage();
      }
    });
  });

  document.querySelectorAll('.archive-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = (e.currentTarget as HTMLElement).dataset.id;
      const assignment = cleaningAssignments.find(a => a.id === id);
      if (assignment) {
        assignment.status = 'archived';
        showCleaningToast(`Booking archived.`);
        refreshCleaningPage();
      }
    });
  });

  document.querySelectorAll('.delete-booking-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = (e.currentTarget as HTMLElement).dataset.id;
      const assignment = cleaningAssignments.find(a => a.id === id);
      if (assignment && confirm(`Delete booking for ${assignment.assignedTo}? This cannot be undone.`)) {
        cleaningAssignments = cleaningAssignments.filter(a => a.id !== id);
        showCleaningToast(`Booking deleted.`);
        refreshCleaningPage();
      }
    });
  });

  document.querySelectorAll('.edit-booking-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = (e.currentTarget as HTMLElement).dataset.id;
      const assignment = cleaningAssignments.find(a => a.id === id);
      if (assignment) {
        // For now, just show a simple prompt-based edit
        const newName = prompt('Edit assignee name:', assignment.assignedTo);
        if (newName && newName.trim()) {
          assignment.assignedTo = newName.trim();
          showCleaningToast(`Booking updated.`);
          refreshCleaningPage();
        }
      }
    });
  });

  // =====================
  // Available Dates Manager Listeners
  // =====================

  // Open Dates Manager
  document.getElementById('manage-dates-btn')?.addEventListener('click', () => {
    showAvailableDatesManager = true;
    refreshCleaningPage();
  });

  // Close Dates Manager
  document.getElementById('close-dates-manager')?.addEventListener('click', () => {
    showAvailableDatesManager = false;
    refreshCleaningPage();
  });

  document.getElementById('dates-manager-backdrop')?.addEventListener('click', () => {
    showAvailableDatesManager = false;
    refreshCleaningPage();
  });

  // Admin calendar navigation
  document.getElementById('admin-prev-month')?.addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 1) { currentMonth = 12; currentYear--; }
    refreshCleaningPage();
  });

  document.getElementById('admin-next-month')?.addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 12) { currentMonth = 1; currentYear++; }
    refreshCleaningPage();
  });

  // Toggle date availability
  document.querySelectorAll('.admin-calendar-day:not(.empty)').forEach(day => {
    day.addEventListener('click', (e) => {
      const dateStr = (e.currentTarget as HTMLElement).dataset.date;
      if (dateStr) {
        if (availableDates.has(dateStr)) {
          availableDates.delete(dateStr);
        } else {
          availableDates.add(dateStr);
        }
        refreshCleaningPage();
      }
    });
  });

  // Select all Saturdays
  document.getElementById('select-all-saturdays')?.addEventListener('click', () => {
    const lastDay = new Date(currentYear, currentMonth, 0);

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(currentYear, currentMonth - 1, day);
      if (date.getDay() === 6) { // Saturday
        const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        availableDates.add(dateStr);
      }
    }
    showCleaningToast('All Saturdays selected!');
    refreshCleaningPage();
  });

  // Clear all dates
  document.getElementById('clear-all-dates')?.addEventListener('click', () => {
    if (confirm('Clear all available dates for this month?')) {
      const lastDay = new Date(currentYear, currentMonth, 0);

      for (let day = 1; day <= lastDay.getDate(); day++) {
        const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        availableDates.delete(dateStr);
      }
      showCleaningToast('All dates cleared for this month.');
      refreshCleaningPage();
    }
  });
}

function showCleaningToast(message: string): void {
  const container = document.getElementById('toast-container') || createToastContainer();
  const toast = document.createElement('div');
  toast.className = 'toast toast-success';
  toast.innerHTML = `
    <span class="toast-icon">✅</span>
    <span class="toast-message">${message}</span>
  `;
  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('show'));

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function createToastContainer(): HTMLElement {
  const container = document.createElement('div');
  container.id = 'toast-container';
  document.body.appendChild(container);
  return container;
}

function refreshCleaningPage(): void {
  const content = document.querySelector('.cleaning-page');
  if (content) {
    const parent = content.parentElement;
    if (parent) {
      parent.innerHTML = renderCleaningPage();
      attachCleaningListeners();
    }
  }
}
