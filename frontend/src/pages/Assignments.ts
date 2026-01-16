import {
  getAssignmentsByMonth,
  getMonthName,
  getOrdinal,
  SundayAssignment,
  seedAllData,
  getHymns,
  getCfmLessons,
  getGospelPrinciples,
  getConferenceTalks,
  updateAssignment,
  Hymn,
  CfmLesson,
  GospelPrinciple,
  ConferenceTalk,
  AnnouncementIndex,
  getAnnouncements,
  createAnnouncement,
  getMeetingTypes,
  updateMeetingType,
  MeetingTypeIndex
} from '../api/assignments';
import { UI } from '../utils/core';

let currentYear = 2026;
let currentMonth = 1;
let assignments: SundayAssignment[] = [];
let viewMode: 'agenda' | 'table' | 'indexes' | 'agenda-maker' = 'agenda';
let weekFilter: 'all' | 'past' | 'current' | 'upcoming' = 'all';

// Reference data caches
let hymnsCache: Hymn[] = [];
let cfmCache: CfmLesson[] = [];
let principlesCache: GospelPrinciple[] = [];
let talksCache: ConferenceTalk[] = [];
let announcementsCache: AnnouncementIndex[] = [];
let meetingTypesCache: MeetingTypeIndex[] = [];

// Get current week's Sunday
function getCurrentSunday(): string {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day;
  const sunday = new Date(today.setDate(diff));
  return sunday.toISOString().split('T')[0];
}

// Filter assignments by week
function filterByWeek(assignments: SundayAssignment[]): SundayAssignment[] {
  if (weekFilter === 'all') return assignments;

  const currentSunday = getCurrentSunday();
  const current = new Date(currentSunday);

  return assignments.filter(a => {
    const aDate = new Date(a.date);
    const diff = Math.floor((aDate.getTime() - current.getTime()) / (7 * 24 * 60 * 60 * 1000));

    switch (weekFilter) {
      case 'past': return diff < 0;
      case 'current': return diff === 0;
      case 'upcoming': return diff > 0;
      default: return true;
    }
  });
}

export function renderAssignmentsPage(): string {
  return `
      <div class="page assignments-page">
        ${UI.header('Sunday Assignments', 'Dowleswaram Ward 2026 Teaching Schedule', renderHeaderActions())}
        
        <div class="assignments-controls">
          <div class="month-nav-interactive">
            <button class="btn-icon" id="prev-month">←</button>
            <select id="month-select" class="month-select">
              ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => `
                <option value="${m}" ${currentMonth === m ? 'selected' : ''}>${getMonthName(m)}</option>
              `).join('')}
            </select>
            <select id="year-select" class="year-select">
              ${[2026, 2027, 2028, 2029, 2030].map(y => `
                <option value="${y}" ${currentYear === y ? 'selected' : ''}>${y}</option>
              `).join('')}
            </select>
            <button class="btn-icon" id="next-month">→</button>
          </div>
          
          <div class="week-filter" id="week-filter">
            <button class="filter-btn ${weekFilter === 'all' ? 'active' : ''}" data-filter="all">All</button>
            <button class="filter-btn ${weekFilter === 'past' ? 'active' : ''}" data-filter="past">📅 Past</button>
            <button class="filter-btn ${weekFilter === 'current' ? 'active' : ''}" data-filter="current">📍 This Week</button>
            <button class="filter-btn ${weekFilter === 'upcoming' ? 'active' : ''}" data-filter="upcoming">🔜 Upcoming</button>
          </div>
          
          <div class="view-toggle">
            <button class="view-btn ${viewMode === 'agenda' ? 'active' : ''}" data-view="agenda">📋 Agenda</button>
            <button class="view-btn ${viewMode === 'table' ? 'active' : ''}" data-view="table">📊 Table</button>
            <button class="view-btn ${viewMode === 'agenda-maker' ? 'active' : ''}" data-view="agenda-maker">✍️ Create Agenda</button>
            <button class="view-btn ${viewMode === 'indexes' ? 'active' : ''}" data-view="indexes">📚 Indexes</button>
          </div>
        </div>
        
        <div class="assignments-content" id="assignments-content">
          ${UI.spinner('Loading assignments...')}
        </div>

        <!-- Import Modal -->
        <div class="modal" id="import-modal" style="display: none;">
          <div class="modal-backdrop"></div>
          <div class="modal-content glass-container modal-large">
            <div class="modal-header">
              <h2 id="import-modal-title">Import Data</h2>
              <button class="btn-icon close-modal" id="close-import-modal">✕</button>
            </div>
            <div class="modal-body" id="import-modal-body">
              <!-- Import form loaded dynamically -->
            </div>
          </div>
        </div>

        <!-- Add Item Modal -->
        <div class="modal" id="add-modal" style="display: none;">
          <div class="modal-backdrop"></div>
          <div class="modal-content glass-container">
            <div class="modal-header">
              <h2 id="add-modal-title">Add Item</h2>
              <button class="btn-icon close-modal" id="close-add-modal">✕</button>
            </div>
            <div class="modal-body" id="add-modal-body">
              <!-- Add form loaded dynamically -->
            </div>
          </div>
        </div>

        <!-- Edit Assignment Modal -->
        <div class="modal" id="edit-modal" style="display: none;">
          <div class="modal-backdrop"></div>
          <div class="modal-content glass-container modal-large">
            <div class="modal-header">
              <h2>✏️ Edit Sunday Assignment</h2>
              <button class="btn-icon close-modal" id="close-edit-modal">✕</button>
            </div>
            <div class="modal-body" id="edit-modal-body">
              <!-- Edit form loaded dynamically -->
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
      </div>
    `;
}

// ============================================
// AGENDA VIEW - Single Column Cards
// ============================================
function renderAgendaView(assignments: SundayAssignment[]): string {
  const filtered = filterByWeek(assignments);

  if (filtered.length === 0) {
    return `
          <div class="empty-state">
            <span class="empty-icon">📅</span>
            <p>No assignments ${weekFilter !== 'all' ? `for ${weekFilter} week` : `for ${getMonthName(currentMonth)} ${currentYear}`}</p>
            <button class="btn-primary" id="seed-btn-inner">🌱 Seed Sample Data</button>
          </div>
        `;
  }

  return `
      <div class="agenda-column">
        ${filtered.map(a => renderAgendaCard(a)).join('')}
      </div>
    `;
}

function renderAgendaCard(a: SundayAssignment): string {
  const isCurrentWeek = a.date === getCurrentSunday();
  const isPast = new Date(a.date) < new Date(getCurrentSunday());
  const sundayNum = a.sundayNumber;
  const speakerCount = a.talks?.length || 0;
  const hasInterlude = !!a.hymns?.interlude;

  let meetingType = a.meetingType || (a.isFastSunday ? 'fast' : 'standard');
  if ((meetingType as string) === 'ward-conference') meetingType = 'conference';
  const meetingSubtype = a.meetingSubtype;
  const isFast = meetingType === 'fast';

  // Determine class schedule based on Sunday
  const isCombinedSunday = sundayNum === 1 || sundayNum === 3; // 1st & 3rd = Combined SS
  const isBishopricSunday = sundayNum === 5; // 5th = Bishopric teaches all

  const typeLabels: Record<string, string> = {
    standard: 'Standard Meeting',
    fast: '🥖 Fast & Testimony',
    conference: `🏛️ ${meetingSubtype ? meetingSubtype.charAt(0).toUpperCase() + meetingSubtype.slice(1) : 'Ward'} Conference`,
    devotional: `🕯️ Devotional${meetingSubtype ? ` (${meetingSubtype.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')})` : ''}`
  };

  return `
      <div class="agenda-card ${a.status} ${isCurrentWeek ? 'current-week' : ''} ${isPast ? 'past' : ''} ${isFast ? 'fast-sunday' : ''} meeting-type-${meetingType}" data-id="${a._id}">
        <div class="agenda-card-header">
          <div class="date-section">
            <span class="date-badge">${new Date(a.date + 'T00:00:00').getDate()}</span>
            <div class="date-info">
              <span class="month-year">${getMonthName(a.month)} ${a.year}</span>
              <span class="sunday-label">${getOrdinal(a.sundayNumber)} Sunday</span>
              ${a.weekRange ? `<span class="week-range">${a.weekRange}</span>` : ''}
              <span class="meeting-type-label">${typeLabels[meetingType] || 'Standard Meeting'}</span>
            </div>
          </div>
          <div class="status-section">
            <span class="status-badge status-${a.status}">${a.status}</span>
            ${isCurrentWeek ? '<span class="current-indicator">📍 This Week</span>' : ''}
            <div class="speaker-config">
              ${isFast ? '<span class="config-label">Open Testimony</span>' : `
                <span class="config-label">${speakerCount} Speakers</span>
                ${hasInterlude ? '<span class="config-tag">+ Music</span>' : ''}
              `}
            </div>
          </div>
        </div>

        <div class="agenda-card-body two-column">
          <!-- LEFT COLUMN: Program Flow -->
          <div class="program-column">
            <h3>🕊️ Sacrament Meeting Program</h3>
            
            <div class="program-flow">
              <!-- 1. Conducting -->
              <div class="program-row">
                <span class="program-num">1</span>
                <span class="program-label">Conducting</span>
                <span class="program-value">${a.sacramentMeeting?.conductingLeader || 'TBD'}</span>
              </div>
              
              <!-- 2. Presiding -->
              <div class="program-row">
                <span class="program-num">2</span>
                <span class="program-label">Presiding</span>
                <span class="program-value">${a.sacramentMeeting?.presiding || 'Bishopric'}</span>
              </div>
              
              <!-- 3. Opening Hymn -->
              <div class="program-row hymn-row-item">
                <span class="program-num">3</span>
                <span class="program-label">Opening Hymn</span>
                ${renderHymnValue(a.hymns?.opening)}
              </div>
              
              <!-- 4. Opening Prayer -->
              <div class="program-row">
                <span class="program-num">4</span>
                <span class="program-label">Opening Prayer</span>
                <span class="program-value">${a.sacramentMeeting?.openingPrayer || 'TBD'}</span>
              </div>
              
              <!-- 5. Announcements -->
              <div class="program-row">
                <span class="program-num">5</span>
                <span class="program-label">Announcements</span>
                <span class="program-value">${a.sacramentMeeting?.announcements || 'Ward Business'}</span>
              </div>
              
              <!-- 6. Sacrament Hymn -->
              <div class="program-row hymn-row-item sacrament">
                <span class="program-num">6</span>
                <span class="program-label">Sacrament Hymn</span>
                ${renderHymnValue(a.hymns?.sacrament)}
              </div>
              
              <!-- 7. Administration of Sacrament -->
              <div class="program-row sacrament-admin">
                <span class="program-num">🍞</span>
                <span class="program-label">Administration of the Sacrament</span>
                <span class="program-value subtle">Priesthood</span>
              </div>
              
              <!-- Speakers with correct order -->
              ${isFast ? `
                <div class="program-row fast-testimony">
                  <span class="program-num">7</span>
                  <span class="program-label">Bearing of Testimony</span>
                  <span class="program-value italic">Congregation</span>
                </div>
              ` : renderSpeakersInOrder(a.talks || [], a.hymns?.interlude)}
              
              <!-- Closing Hymn -->
              <div class="program-row hymn-row-item">
                <span class="program-num">${isFast ? 8 : (7 + (a.talks?.length || 0) + (a.hymns?.interlude ? 1 : 0) + 1)}</span>
                <span class="program-label">Closing Hymn</span>
                ${renderHymnValue(a.hymns?.closing)}
              </div>
              
              <!-- Closing Prayer -->
              <div class="program-row">
                <span class="program-num">${isFast ? 9 : (7 + (a.talks?.length || 0) + (a.hymns?.interlude ? 1 : 0) + 2)}</span>
                <span class="program-label">Closing Prayer</span>
                <span class="program-value">${a.sacramentMeeting?.closingPrayer || 'TBD'}</span>
              </div>
            </div>
          </div>
          
          <!-- RIGHT COLUMN: Speaker Details & Announcements -->
          <div class="details-column">
            <div class="details-section speakers-details">
              <h4>🎤 ${isFast ? 'Bearing of Testimony' : `Speakers (${speakerCount})`}</h4>
              <div class="speaker-cards">
                ${isFast ? `
                  <div class="fast-testimony-empty">
                    <p>Open for members of the congregation to share their testimonies of Jesus Christ and His Gospel.</p>
                  </div>
                ` : renderSpeakerDetailCards(a.talks || [], speakerCount)}
              </div>
            </div>
            
            <div class="details-section announcements-section">
              <h4>📢 Announcements</h4>
              <div class="announcement-content">
                ${a.sacramentMeeting?.announcements
      ? `<ul class="announcement-list-view">${a.sacramentMeeting.announcements.split('\n').filter(l => l.trim()).map(l => `<li>${l}</li>`).join('')}</ul>`
      : '<span class="muted">Ward business</span>'
    }
              </div>
            </div>
            
            ${a.notes ? `
              <div class="details-section notes-section">
                <h4>📝 Notes</h4>
                <p>${a.notes}</p>
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Second Hour Classes - Separate Section -->
        <div class="second-hour-section">
            <h3>📚 Second Hour</h3>
            
            ${isBishopricSunday ? `
              <!-- 5th Sunday: Bishopric Combined Meeting -->
              <div class="sunday-type-badge bishopric">🏛️ 5th Sunday - Bishopric Combined Meeting</div>
              <div class="classes-grid single">
                <div class="class-item bishopric-sunday">
                  <h5>🏛️ Combined Ward Meeting</h5>
                  <p class="class-note">All quorums meet together (except Primary)</p>
                  <p class="class-topic">${a.sundaySchool?.scriptureBlock || a.sundaySchool?.lessonTitle || 'Bishopric Lesson'}</p>
                  <p class="class-instructor">Taught by: <strong>Bishopric</strong></p>
                </div>
              </div>
            ` : isCombinedSunday ? `
              <!-- 1st & 3rd Sunday: Combined Sunday School -->
              <div class="sunday-type-badge combined">📖 ${getOrdinal(sundayNum)} Sunday - Combined Sunday School</div>
              <div class="classes-grid">
                <div class="class-item ss combined">
                  <h5>📖 Sunday School (Adults)</h5>
                  <p class="class-note">Elders Quorum & Relief Society meet together</p>
                  ${renderClassContent(a.sundaySchool)}
                </div>
                <div class="class-item yw">
                  <h5>🌟 Youth Mutual</h5>
                  <p class="class-note">Young Men & Young Women</p>
                  ${a.youngWomen ? renderClassContent(a.youngWomen) : '<p class="class-topic">Youth Activity</p>'}
                </div>
                <div class="class-item ysa">
                  <h5>📖 YSA Sunday School</h5>
                  <p class="class-note">Young Single Adults</p>
                  ${renderClassContent(a.ysaSundaySchool)}
                </div>
              </div>
            ` : `
              <!-- 2nd & 4th Sunday: Separate Quorum Classes -->
              <div class="sunday-type-badge quorums">👔 ${getOrdinal(sundayNum)} Sunday - Quorum & Relief Society</div>
              <div class="classes-grid">
                <div class="class-item eq">
                  <h5>👔 Elders Quorum</h5>
                  ${renderClassContent(a.eldersQuorum || (a as any).elderQuorum)}
                </div>
                <div class="class-item rs">
                  <h5>🌸 Relief Society</h5>
                  ${renderClassContent(a.reliefSociety)}
                </div>
                <div class="class-item yw">
                  <h5>🌟 Young Women</h5>
                  ${a.youngWomen ? renderClassContent(a.youngWomen) : '<p class="class-topic">Young Women Lesson</p><p class="class-instructor">Teacher: TBD</p>'}
                </div>
                <div class="class-item ym">
                  <h5>🔥 Young Men</h5>
                  ${a.youngMen ? renderClassContent(a.youngMen) : '<p class="class-topic">Young Men Lesson</p><p class="class-instructor">Teacher: TBD</p>'}
                </div>
              </div>
            `}
            
            <!-- Primary always meets -->
            <div class="primary-note">
              <span>👶 Primary meets during Second Hour for ages 3-11</span>
            </div>
          </div>
        </div>

        <div class="agenda-card-footer">
          <span class="updated-time">Updated: ${new Date(a.updatedAt).toLocaleDateString()}</span>
          <div class="card-actions">
            <button class="btn-sm btn-secondary edit-assignment-btn" data-id="${a._id}">✏️ Edit</button>
            <button class="btn-sm btn-secondary print-assignment-btn" data-id="${a._id}">🖨️ Print</button>
          </div>
        </div>
      </div>
    `;
}

function renderHymnValue(hymn?: { hymnNumber: number; title: string; url?: string }): string {
  if (!hymn) {
    return '<span class="program-value">TBD</span>';
  }
  if (hymn.url) {
    return `<a href="${hymn.url}" target="_blank" class="program-value hymn-link">#${hymn.hymnNumber} ${hymn.title}</a>`;
  }
  return `<span class="program-value">#${hymn.hymnNumber} ${hymn.title}</span>`;
}

function renderSpeakersInOrder(talks: any[], interludeHymn?: { hymnNumber: number; title: string; url?: string }): string {
  if (!talks || talks.length === 0) {
    return `
      <div class="program-row speaker-row">
        <span class="program-num">7</span>
        <span class="program-label">Speaker 1</span>
        <span class="program-value">TBD</span>
      </div>
      <div class="program-row speaker-row">
        <span class="program-num">8</span>
        <span class="program-label">Speaker 2</span>
        <span class="program-value">TBD</span>
      </div>
    `;
  }

  let html = '';
  let programNum = 7;

  talks.forEach((t, i) => {
    // Insert interlude hymn after 2nd speaker (before 3rd)
    if (i === 2 && interludeHymn) {
      html += `
        <div class="program-row hymn-row-item interlude">
          <span class="program-num">${programNum}</span>
          <span class="program-label">Interlude Hymn</span>
          ${renderHymnValue(interludeHymn)}
        </div>
      `;
      programNum++;
    }

    html += `
      <div class="program-row speaker-row">
        <span class="program-num">${programNum}</span>
        <span class="program-label">Speaker ${i + 1}</span>
        <div class="program-speaker">
          <span class="speaker-name">${t.speakerName}</span>
          ${t.topic ? `<span class="speaker-topic">${t.topic}</span>` : ''}
          ${t.organization ? `<span class="speaker-org">(${t.organization})</span>` : ''}
          ${t.duration ? `<span class="speaker-duration">${t.duration} min</span>` : ''}
          ${t.sourceUrl ? `<a href="${t.sourceUrl}" target="_blank" class="speaker-source">📖</a>` : ''}
        </div>
      </div>
    `;
    programNum++;
  });

  return html;
}

// Helper: Speaker detail cards for right column
function renderSpeakerDetailCards(talks: any[], count: number): string {
  let html = '';

  for (let i = 0; i < count; i++) {
    const talk = talks[i] || {};
    html += `
      <div class="speaker-detail-card">
        <div class="speaker-header">
          <span class="speaker-num">${i + 1}</span>
          <span class="speaker-name">${talk.speakerName || 'TBD'}</span>
        </div>
        <div class="speaker-body">
          <div class="speaker-field">
            <label>Topic:</label>
            <span>${talk.topic || 'Not assigned'}</span>
          </div>
          ${talk.organization ? `
            <div class="speaker-field">
              <label>From:</label>
              <span>${talk.organization}</span>
            </div>
          ` : ''}
          ${talk.duration ? `
            <div class="speaker-field">
              <label>Time:</label>
              <span>${talk.duration} min</span>
            </div>
          ` : ''}
          ${talk.sourceUrl ? `
            <a href="${talk.sourceUrl}" target="_blank" class="speaker-source-link">📖 ${talk.sourceTitle || 'View Source'}</a>
          ` : ''}
        </div>
      </div>
    `;
  }

  return html;
}

function renderClassContent(classData: any): string {
  if (!classData) {
    return '<p class="class-topic">TBD</p><p class="class-instructor">Teacher: TBD</p>';
  }
  const topic = classData.scriptureBlock || classData.principleSelected || classData.lessonTitle || classData.topic || 'TBD';
  const url = classData.lessonUrl || classData.principleUrl || classData.conferenceTalkUrl;

  return `
    <p class="class-topic">${topic}</p>
    <p class="class-instructor">Teacher: <strong>${classData.instructor || 'TBD'}</strong></p>
    ${url ? `<a href="${url}" target="_blank" class="class-link">📖 View Lesson</a>` : ''}
  `;
}

// ============================================
// REFERENCE INDEXES VIEW WITH ADD/IMPORT
// ============================================
async function renderIndexesView(): Promise<string> {
  if (hymnsCache.length === 0) {
    hymnsCache = await getHymns();
    cfmCache = await getCfmLessons(currentYear);
    principlesCache = await getGospelPrinciples();
    talksCache = await getConferenceTalks();
    announcementsCache = await getAnnouncements();
    meetingTypesCache = await getMeetingTypes();
  }

  return `
      <div class="indexes-view">
        <div class="indexes-header">
          <div class="index-tabs">
            <button class="index-tab active" data-index="hymns">🎵 Hymns (${hymnsCache.length})</button>
            <button class="index-tab" data-index="cfm">📖 CFM (${cfmCache.length})</button>
            <button class="index-tab" data-index="principles">📚 Principles (${principlesCache.length})</button>
            <button class="index-tab" data-index="talks">🎤 Talks (${talksCache.length})</button>
            <button class="index-tab" data-index="announcements">📢 Announc. (${announcementsCache.length})</button>
            <button class="index-tab" data-index="meeting-types">⚙️ Types (${meetingTypesCache.length})</button>
          </div>
          <div class="index-actions">
            <button class="btn-secondary" id="import-btn">📥 Import</button>
            <button class="btn-primary" id="add-index-btn">➕ Add</button>
          </div>
        </div>
        
        <div class="index-content" id="index-content">
          ${renderHymnsIndex()}
        </div>
      </div>
    `;
}

function renderHymnsIndex(): string {
  const categories = ['Opening', 'Sacrament', 'Closing', 'Special'];

  return `
      <div class="hymns-index">
        ${categories.map(cat => {
    const catHymns = hymnsCache.filter(h => h.category === cat);
    if (catHymns.length === 0) return '';
    return `
              <div class="index-section">
                <h4>${cat} Hymns (${catHymns.length})</h4>
                <div class="index-grid">
                  ${catHymns.map(h => `
                    <div class="index-card">
                      <span class="index-number">#${h.number}</span>
                      <span class="index-title">${h.title}</span>
                      ${h.url ? `<a href="${h.url}" target="_blank" class="index-link">🔗</a>` : ''}
                    </div>
                  `).join('')}
                </div>
              </div>
            `;
  }).join('')}
      </div>
    `;
}

function renderCfmIndex(): string {
  return `
      <div class="cfm-index">
        <div class="index-table">
          ${cfmCache.map(l => `
            <div class="index-row">
              <span class="col-week">Week ${l.weekNumber}</span>
              <span class="col-range">${l.weekRange}</span>
              <span class="col-scripture">${l.scriptureBlock}</span>
              <span class="col-title">${l.lessonTitle}</span>
              <a href="${l.url}" target="_blank" class="index-link">📖 Study</a>
            </div>
          `).join('')}
        </div>
      </div>
    `;
}

function renderPrinciplesIndex(): string {
  return `
      <div class="principles-index">
        <div class="index-grid">
          ${principlesCache.map(p => `
            <div class="index-card">
              <span class="index-number">Ch. ${p.number}</span>
              <span class="index-title">${p.title}</span>
              <a href="${p.url}" target="_blank" class="index-link">📖 Read</a>
            </div>
          `).join('')}
        </div>
      </div>
    `;
}

function renderTalksIndex(): string {
  return `
      <div class="talks-index">
        <div class="index-table">
          <div class="index-th">
            <span class="col-speaker">Speaker</span>
            <span class="col-title">Title</span>
            <span class="col-session">Session</span>
            <span class="col-actions"></span>
          </div>
          ${talksCache.map(t => `
            <div class="index-row talk-row">
              <span class="col-speaker">${t.speaker}</span>
              <span class="col-title">${t.title}</span>
              <span class="col-session">${t.conferenceSession}</span>
              <a href="${t.url}" target="_blank" class="index-link">🎤 View</a>
            </div>
          `).join('')}
        </div>
      </div>
    `;
}

function renderAnnouncementsIndex(): string {
  return `
    <div class="announcements-index">
      <div class="index-table">
        <div class="index-th">
          <span class="col-content">Announcement Content</span>
          <span class="col-type">Type</span>
          <span class="col-date">Sunday/Recur</span>
          <span class="col-status">Status</span>
        </div>
        ${announcementsCache.length === 0 ? '<div class="empty-index">No announcements indexed yet.</div>' : announcementsCache.map(a => `
          <div class="index-row">
            <span class="col-content">${a.content}</span>
            <span class="col-type"><span class="type-badge ${a.type}">${a.type}</span></span>
            <span class="col-date">${a.type === 'specific' ? a.targetDate : 'Weekly'}</span>
            <span class="col-status">${a.active ? '🟢 Active' : '🔴 Muted'}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderMeetingTypesIndex(): string {
  return `
    <div class="meeting-types-index">
      <div class="index-table">
        <div class="index-th">
          <span class="col-name">Name</span>
          <span class="col-label">Label</span>
          <span class="col-icon">Icon</span>
          <span class="col-subtypes">Subtypes</span>
          <span class="col-actions">Actions</span>
        </div>
        ${meetingTypesCache.length === 0 ? '<div class="empty-index">No meeting types indexed.</div>' : meetingTypesCache.map(t => `
          <div class="index-row">
            <span class="col-name"><code>${t.name}</code></span>
            <span class="col-label">${t.label}</span>
            <span class="col-icon">${t.icon || '—'}</span>
            <span class="col-subtypes">${t.subtypes ? t.subtypes.map(s => `<span class="badge-tag">${s}</span>`).join('') : '—'}</span>
            <span class="col-actions">
              <button class="btn-icon add-subtype-btn" data-id="${t._id}" title="Add Subtype">➕</button>
            </span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// Add late-attached listeners for meeting types
function attachMeetingTypeListeners() {
  document.querySelectorAll('.add-subtype-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = (e.currentTarget as HTMLElement).dataset.id!;
      const newSubtype = prompt('Enter new subtype name:');
      if (newSubtype) {
        const type = meetingTypesCache.find(t => t._id === id);
        if (type) {
          const subtypes = [...(type.subtypes || []), newSubtype];
          const res = await updateMeetingType(id, { subtypes });
          if (res.success) {
            meetingTypesCache = []; // Clear cache to force reload
            const indexContent = document.getElementById('index-content');
            if (indexContent) {
              meetingTypesCache = await getMeetingTypes();
              indexContent.innerHTML = renderMeetingTypesIndex();
              attachMeetingTypeListeners();
            }
          }
        }
      }
    });
  });
}

// ============================================
// IMPORT MODAL
// ============================================
function renderImportModal(indexType: string): string {
  const formats = {
    hymns: {
      json: `[\n  { "number": 2, "title": "The Spirit of God", "category": "Opening", "url": "https://..." },\n  { "number": 175, "title": "O God, the Eternal Father", "category": "Sacrament", "url": "https://..." }\n]`,
      csv: `number,title,category,url\n2,"The Spirit of God",Opening,https://...\n175,"O God, the Eternal Father",Sacrament,https://...`,
    },
    cfm: {
      json: `[\n  { "year": 2026, "weekNumber": 1, "weekRange": "Jan 6-12", "scriptureBlock": "1 Nephi 1-5", "lessonTitle": "Title", "url": "https://..." }\n]`,
      csv: `year,weekNumber,weekRange,scriptureBlock,lessonTitle,url\n2026,1,"Jan 6-12","1 Nephi 1-5","Title",https://...`,
    },
    principles: {
      json: `[\n  { "number": 1, "title": "Our Heavenly Father", "url": "https://..." }\n]`,
      csv: `number,title,url\n1,"Our Heavenly Father",https://...`,
    },
    talks: {
      json: `[\n  { "title": "Talk Title", "speaker": "Speaker Name", "conferenceSession": "October 2024", "year": 2024, "month": "October", "url": "https://..." }\n]`,
      csv: `title,speaker,conferenceSession,year,month,url\n"Talk Title","Speaker Name","October 2024",2024,October,https://...`,
    }
  };

  const format = formats[indexType as keyof typeof formats] || formats.hymns;

  return `
      <div class="import-form">
        <div class="import-type-select">
          <label>Import to:</label>
          <select id="import-type">
            <option value="hymns" ${indexType === 'hymns' ? 'selected' : ''}>🎵 Hymns</option>
            <option value="cfm" ${indexType === 'cfm' ? 'selected' : ''}>📖 Come Follow Me</option>
            <option value="principles" ${indexType === 'principles' ? 'selected' : ''}>📚 Gospel Principles</option>
            <option value="talks" ${indexType === 'talks' ? 'selected' : ''}>🎤 Conference Talks</option>
          </select>
        </div>

        <div class="import-format-help">
          <div class="help-header">
            <span>📋 Format Guide</span>
            <button class="help-toggle" id="toggle-help">❓ Show Examples</button>
          </div>
          <div class="help-content" id="help-content" style="display: none;">
            <div class="format-tabs">
              <button class="format-tab active" data-format="json">JSON</button>
              <button class="format-tab" data-format="csv">CSV</button>
            </div>
            <pre class="format-example" id="format-example">${format.json}</pre>
          </div>
        </div>

        <div class="import-methods">
          <div class="import-method">
            <h4>📄 Paste Data</h4>
            <textarea id="import-data" placeholder="Paste JSON or CSV data here..." rows="8"></textarea>
          </div>
          
          <div class="import-divider">OR</div>
          
          <div class="import-method">
            <h4>📁 Upload File</h4>
            <div class="file-upload">
              <input type="file" id="import-file" accept=".json,.csv,.xlsx,.xls" />
              <label for="import-file" class="file-label">
                <span>📥 Choose JSON, CSV, or Excel file</span>
              </label>
              <span class="file-name" id="file-name"></span>
            </div>
          </div>
        </div>

        <div class="import-preview" id="import-preview" style="display: none;">
          <h4>Preview (first 5 items)</h4>
          <div id="preview-content"></div>
        </div>

        <div class="import-actions">
          <button class="btn-secondary" id="cancel-import">Cancel</button>
          <button class="btn-secondary" id="preview-import">👁️ Preview</button>
          <button class="btn-primary" id="confirm-import">📥 Import</button>
        </div>
      </div>
    `;
}

// ============================================
// ADD ITEM MODAL
// ============================================
function renderAddModal(indexType: string): string {
  const forms: Record<string, string> = {
    hymns: `
          <div class="add-form">
            <div class="form-group">
              <label>Hymn Number *</label>
              <input type="number" id="add-number" required placeholder="e.g., 2" />
            </div>
            <div class="form-group">
              <label>Title *</label>
              <input type="text" id="add-title" required placeholder="e.g., The Spirit of God" />
            </div>
            <div class="form-group">
              <label>Category *</label>
              <select id="add-category">
                <option value="Opening">Opening</option>
                <option value="Sacrament">Sacrament</option>
                <option value="Closing">Closing</option>
                <option value="Special">Special</option>
              </select>
            </div>
            <div class="form-group">
              <label>URL</label>
              <input type="url" id="add-url" placeholder="https://www.churchofjesuschrist.org/..." />
            </div>
          </div>
        `,
    cfm: `
          <div class="add-form">
            <div class="form-row">
              <div class="form-group">
                <label>Year *</label>
                <input type="number" id="add-year" value="2026" required />
              </div>
              <div class="form-group">
                <label>Week Number *</label>
                <input type="number" id="add-weekNumber" required placeholder="1-52" />
              </div>
            </div>
            <div class="form-group">
              <label>Week Range *</label>
              <input type="text" id="add-weekRange" required placeholder="e.g., Jan 6-12" />
            </div>
            <div class="form-group">
              <label>Scripture Block *</label>
              <input type="text" id="add-scriptureBlock" required placeholder="e.g., 1 Nephi 1-5" />
            </div>
            <div class="form-group">
              <label>Lesson Title *</label>
              <input type="text" id="add-lessonTitle" required placeholder="Full lesson title" />
            </div>
            <div class="form-group">
              <label>URL *</label>
              <input type="url" id="add-url" required placeholder="https://www.churchofjesuschrist.org/..." />
            </div>
          </div>
        `,
    principles: `
          <div class="add-form">
            <div class="form-group">
              <label>Chapter Number *</label>
              <input type="number" id="add-number" required placeholder="1-47" />
            </div>
            <div class="form-group">
              <label>Title *</label>
              <input type="text" id="add-title" required placeholder="e.g., Our Heavenly Father" />
            </div>
            <div class="form-group">
              <label>URL *</label>
              <input type="url" id="add-url" required placeholder="https://www.churchofjesuschrist.org/..." />
            </div>
          </div>
        `,
    talks: `
          <div class="add-form">
            <div class="form-group">
              <label>Title *</label>
              <input type="text" id="add-title" required placeholder="Talk title" />
            </div>
            <div class="form-group">
              <label>Speaker *</label>
              <input type="text" id="add-speaker" required placeholder="e.g., President Russell M. Nelson" />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Year *</label>
                <input type="number" id="add-year" value="2024" required />
              </div>
              <div class="form-group">
                <label>Month *</label>
                <select id="add-month">
                  <option value="April">April</option>
                  <option value="October">October</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label>URL *</label>
              <input type="url" id="add-url" required placeholder="https://www.churchofjesuschrist.org/..." />
            </div>
          </div>
        `,
    announcements: `
          <div class="add-form">
            <div class="form-group">
              <label>Announcement Content *</label>
              <textarea id="add-content" required placeholder="Enter announcement text..." rows="3"></textarea>
            </div>
            <div class="form-group">
              <label>Type *</label>
              <select id="add-type">
                <option value="recurring">Recurring (Weekly)</option>
                <option value="specific">Specific Sunday (Date-linked)</option>
              </select>
            </div>
            <div class="form-group" id="target-date-group" style="display: none;">
              <label>Target Sunday Date</label>
              <input type="date" id="add-targetDate" />
            </div>
            <div class="form-group">
              <label>Category</label>
              <input type="text" id="add-category" placeholder="e.g., Youth, Temple, Missionary" />
            </div>
          </div>
        `
  };

  return `
      ${forms[indexType] || forms.hymns}
      <div class="modal-actions">
        <button class="btn-secondary" id="cancel-add">Cancel</button>
        <button class="btn-primary" id="confirm-add">➕ Add</button>
      </div>
    `;
}

// ============================================
// DATA PARSER
// ============================================
function parseImportData(data: string, format: 'json' | 'csv'): any[] {
  try {
    if (format === 'json') {
      return JSON.parse(data);
    } else {
      // CSV Parser
      const lines = data.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      return lines.slice(1).map(line => {
        const values = line.match(/(".*?"|[^,]+)/g) || [];
        const obj: any = {};
        headers.forEach((h, i) => {
          let val = values[i]?.trim().replace(/^"|"$/g, '') || '';
          // Try to parse numbers
          if (!isNaN(Number(val)) && val !== '') obj[h] = Number(val);
          else obj[h] = val;
        });
        return obj;
      });
    }
  } catch (e) {
    console.error('Parse error:', e);
    return [];
  }
}

// ============================================
// TABLE VIEW (Overview)
// ============================================
function renderTableView(assignments: SundayAssignment[]): string {
  const filtered = filterByWeek(assignments);

  if (filtered.length === 0) {
    return `
      <div class="empty-state">
        <p>No assignments found for this period.</p>
      </div>
    `;
  }

  const getLessonText = (assignedLessonId?: string) => {
    if (!assignedLessonId) return '';
    if (assignedLessonId.startsWith('cfm:')) {
      const id = assignedLessonId.replace('cfm:', '');
      const l = cfmCache.find(x => x._id === id);
      return l ? `<div class="cell-lesson-text">${l.scriptureBlock || l.lessonTitle}</div>` : '';
    }
    if (assignedLessonId.startsWith('talk:')) {
      const id = assignedLessonId.replace('talk:', '');
      const t = talksCache.find(x => x._id === id);
      return t ? `<div class="cell-lesson-text">${t.title}</div>` : '';
    }
    if (assignedLessonId.startsWith('principle:')) {
      const id = assignedLessonId.replace('principle:', '');
      const p = principlesCache.find(x => x._id === id);
      return p ? `<div class="cell-lesson-text">${p.title}</div>` : '';
    }
    return '';
  };

  const renderHymn = (h: any, label: string) => {
    if (!h || (!h.hymnNumber && !h.title)) return '';
    const url = h.url || `https://www.churchofjesuschrist.org/music/library/hymns/${h.hymnNumber}?lang=eng`;
    return `
      <div class="hymn-stack-item">
        <span class="h-num-mini" title="${label}">#${h.hymnNumber || '—'}</span>
        <a href="${url}" target="_blank" class="h-title-mini">${h.title || 'Untitled'}</a>
      </div>
    `;
  };

  return `
    <div class="table-container">
      <table class="assignments-table overview-table">
        <thead>
          <tr>
            <th>DATE (Week / Sunday)</th>
            <th>CONDUCTING / PRESIDING</th>
            <th>HYMNS (1 2 4)</th>
            <th>SPEAKER 1</th>
            <th>SPEAKER 2</th>
            <th>SPEAKER 3</th>
            <th>SECOND HOUR (Classes)</th>
            <th>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          ${filtered.map(a => {
    const meetingType = a.meetingType || (a.isFastSunday ? 'fast' : 'standard');
    const meetingSubtype = a.meetingSubtype || '';
    const isFast = meetingType === 'fast';
    const sundayNum = a.sundayNumber;
    const is5th = sundayNum === 5;
    const isSSWeek = sundayNum === 1 || sundayNum === 3;

    return `
              <tr class="${isFast ? 'fast-sunday-row' : ''} ${is5th ? 'bishopric-sunday-row' : ''} mtype-row-${meetingType}">
                <td class="col-date">
                  <div class="cell-stack">
                    <strong>Week ${sundayNum}</strong>
                    <span class="muted-date">${new Date(a.date + 'T00:00:00').getDate()} ${getMonthName(a.month)}</span>
                    ${is5th ? '<span class="status-badge status-bishopric">🏛️ Bishopric</span>' : ''}
                    ${meetingType === 'fast' ? '<span class="fast-badge">🥖 Fast</span>' : ''}
                    ${meetingType === 'conference' ? `<span class="status-badge status-confirmed">🏛️ ${meetingSubtype || 'Conf'}</span>` : ''}
                    ${meetingType === 'devotional' ? `<span class="status-badge status-completed">🕯️ ${meetingSubtype || 'Dev.'}</span>` : ''}
                  </div>
                </td>
                <td class="col-conducting">
                  <div class="cell-stack">
                    <div class="leader-row">
                      <strong>C:</strong> ${a.sacramentMeeting?.conductingLeader || 'TBD'}
                    </div>
                    <div class="leader-row">
                      <strong>P:</strong> ${a.sacramentMeeting?.presiding || 'Bishopric'}
                    </div>
                  </div>
                </td>
                <td class="col-hymns">
                  <div class="cell-stack">
                    <div class="hymn-numbers-row">
                      <span class="h-num" title="Opening">#${a.hymns?.opening?.hymnNumber || '—'}</span>
                      <span class="h-num" title="Sacrament">#${a.hymns?.sacrament?.hymnNumber || '—'}</span>
                      <span class="h-num" title="Closing">#${a.hymns?.closing?.hymnNumber || '—'}</span>
                    </div>
                    <div class="hymn-titles-stack">
                       ${renderHymn(a.hymns?.opening, 'Opening')}
                       ${renderHymn(a.hymns?.sacrament, 'Sacrament')}
                       ${a.hymns?.interlude ? renderHymn(a.hymns.interlude, 'Interlude') : ''}
                       ${a.hymns?.special ? renderHymn(a.hymns.special, 'Special') : ''}
                       ${renderHymn(a.hymns?.closing, 'Closing')}
                    </div>
                  </div>
                </td>
                ${[0, 1, 2].map(i => {
      const talk = a.talks?.[i];
      return `
                    <td class="col-speaker">
                      ${isFast ? '<span class="muted-text">—</span>' : `
                        <div class="cell-stack">
                          <span class="speaker-name">${talk?.speakerName || 'TBD'}</span>
                          ${getLessonText(talk?.assignedLesson)}
                        </div>
                      `}
                    </td>
                  `;
    }).join('')}
                <td class="col-classes">
                  <div class="class-summary">
                    ${is5th ? `
                      <div class="class-tag bishopric">🏛️ Bishopric Combined</div>
                    ` : isSSWeek ? `
                      <div class="cell-stack">
                        <div class="class-tag ss">SS: ${a.sundaySchool?.instructor || 'TBD'}</div>
                        ${getLessonText(a.sundaySchool?.assignedLesson)}
                        <div class="class-tag ysa">YSA: ${a.ysaSundaySchool?.instructor || 'TBD'}</div>
                        ${getLessonText(a.ysaSundaySchool?.assignedLesson)}
                      </div>
                    ` : `
                      <div class="cell-stack">
                        <div class="class-tag eqrs">EQ: ${a.eldersQuorum?.instructor || 'TBD'}</div>
                        ${getLessonText(a.eldersQuorum?.assignedLesson)}
                        <div class="class-tag eqrs">RS: ${a.reliefSociety?.instructor || 'TBD'}</div>
                        ${getLessonText(a.reliefSociety?.assignedLesson)}
                      </div>
                    `}
                  </div>
                </td>
                <td class="col-actions">
                  <button class="btn-icon edit-assignment-btn" data-id="${a._id}" title="Edit Assignment">✏️</button>
                </td>
              </tr>
            `;
  }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ============================================
// AGENDA MAKER VIEW - Custom Agenda Builder
// ============================================
let selectedAgendaDate: string | null = null;
let agendaMakerTemplate: string = 'sacrament';

interface AgendaItem {
  id: string;
  type: 'text' | 'hymn' | 'prayer' | 'speaker' | 'ordinance' | 'custom';
  label: string;
  value: string;
  editable: boolean;
}

const agendaTemplates: Record<string, { name: string; icon: string; items: AgendaItem[] }> = {
  sacrament: {
    name: 'Sacrament Meeting',
    icon: '⛪',
    items: [
      { id: '1', type: 'text', label: 'Conducting', value: '', editable: true },
      { id: '2', type: 'text', label: 'Presiding', value: '', editable: true },
      { id: '3', type: 'hymn', label: 'Opening Hymn', value: '', editable: true },
      { id: '4', type: 'prayer', label: 'Invocation', value: '', editable: true },
      { id: '5', type: 'text', label: 'Ward Business / Announcements', value: '', editable: true },
      { id: '6', type: 'hymn', label: 'Sacrament Hymn', value: '', editable: true },
      { id: '7', type: 'ordinance', label: 'Administration of the Sacrament', value: 'Priesthood', editable: false },
      { id: '8', type: 'speaker', label: 'First Speaker', value: '', editable: true },
      { id: '9', type: 'speaker', label: 'Second Speaker', value: '', editable: true },
      { id: '10', type: 'hymn', label: 'Intermediate Hymn (Optional)', value: '', editable: true },
      { id: '11', type: 'speaker', label: 'Third Speaker', value: '', editable: true },
      { id: '12', type: 'hymn', label: 'Closing Hymn', value: '', editable: true },
      { id: '13', type: 'prayer', label: 'Benediction', value: '', editable: true },
    ]
  },
  fastSunday: {
    name: 'Fast & Testimony Meeting',
    icon: '🥖',
    items: [
      { id: '1', type: 'text', label: 'Conducting', value: '', editable: true },
      { id: '2', type: 'text', label: 'Presiding', value: '', editable: true },
      { id: '3', type: 'hymn', label: 'Opening Hymn', value: '', editable: true },
      { id: '4', type: 'prayer', label: 'Invocation', value: '', editable: true },
      { id: '5', type: 'text', label: 'Ward Business / Announcements', value: '', editable: true },
      { id: '6', type: 'hymn', label: 'Sacrament Hymn', value: '', editable: true },
      { id: '7', type: 'ordinance', label: 'Administration of the Sacrament', value: 'Priesthood', editable: false },
      { id: '8', type: 'custom', label: 'Bearing of Testimonies', value: 'Open Mic', editable: false },
      { id: '9', type: 'hymn', label: 'Closing Hymn', value: '', editable: true },
      { id: '10', type: 'prayer', label: 'Benediction', value: '', editable: true },
    ]
  },
  wardConference: {
    name: 'Ward Conference',
    icon: '🏛️',
    items: [
      { id: '1', type: 'text', label: 'Presiding', value: 'Stake Presidency', editable: true },
      { id: '2', type: 'text', label: 'Conducting', value: '', editable: true },
      { id: '3', type: 'hymn', label: 'Opening Hymn', value: '', editable: true },
      { id: '4', type: 'prayer', label: 'Invocation', value: '', editable: true },
      { id: '5', type: 'text', label: 'Ward Business', value: '', editable: true },
      { id: '6', type: 'hymn', label: 'Sacrament Hymn', value: '', editable: true },
      { id: '7', type: 'ordinance', label: 'Administration of the Sacrament', value: 'Priesthood', editable: false },
      { id: '8', type: 'speaker', label: 'Ward Speaker', value: '', editable: true },
      { id: '9', type: 'speaker', label: 'Stake Speaker', value: '', editable: true },
      { id: '10', type: 'hymn', label: 'Intermediate Hymn', value: '', editable: true },
      { id: '11', type: 'speaker', label: 'Stake President', value: '', editable: true },
      { id: '12', type: 'hymn', label: 'Closing Hymn', value: '', editable: true },
      { id: '13', type: 'prayer', label: 'Benediction', value: '', editable: true },
    ]
  },
  devotional: {
    name: 'Devotional',
    icon: '🕯️',
    items: [
      { id: '1', type: 'text', label: 'Welcome', value: '', editable: true },
      { id: '2', type: 'hymn', label: 'Opening Hymn', value: '', editable: true },
      { id: '3', type: 'prayer', label: 'Opening Prayer', value: '', editable: true },
      { id: '4', type: 'speaker', label: 'Speaker', value: '', editable: true },
      { id: '5', type: 'hymn', label: 'Closing Hymn', value: '', editable: true },
      { id: '6', type: 'prayer', label: 'Closing Prayer', value: '', editable: true },
    ]
  }
};

function renderAgendaMakerView(existingAssignments: SundayAssignment[]): string {
  const template = agendaTemplates[agendaMakerTemplate];

  return `
    <div class="agenda-maker-view">
      <div class="agenda-maker-layout">
        <!-- Left: Calendar Date Picker -->
        <div class="agenda-maker-calendar-section">
          <div class="section-header">
            <h3>📅 Select Date</h3>
          </div>
          ${renderAgendaMakerCalendar(currentYear, currentMonth, existingAssignments)}
          
          ${selectedAgendaDate ? `
            <div class="selected-date-display">
              <span class="selected-label">Selected:</span>
              <span class="selected-value">${formatSelectedDate(selectedAgendaDate)}</span>
            </div>
          ` : `
            <div class="no-date-selected">
              <p>Click a date on the calendar to create an agenda</p>
            </div>
          `}
        </div>
        
        <!-- Right: Agenda Builder -->
        <div class="agenda-maker-builder-section">
          <div class="section-header">
            <h3>✍️ Build Your Agenda</h3>
            <div class="template-selector">
              <label>Template:</label>
              <select id="template-select">
                ${Object.entries(agendaTemplates).map(([key, t]) => `
                  <option value="${key}" ${agendaMakerTemplate === key ? 'selected' : ''}>${t.icon} ${t.name}</option>
                `).join('')}
              </select>
            </div>
          </div>
          
          ${selectedAgendaDate ? `
            <div class="agenda-builder-form">
              <div class="agenda-form-header">
                <h4>${template.icon} ${template.name}</h4>
                <span class="form-date">${formatSelectedDate(selectedAgendaDate)}</span>
              </div>
              
              <div class="agenda-items-list" id="agenda-items-list">
                ${template.items.map((item, index) => renderAgendaMakerItem(item, index)).join('')}
              </div>
              
              <div class="agenda-form-actions">
                <button class="btn-secondary" id="add-custom-item-btn">
                  <span>➕</span> Add Custom Item
                </button>
                <button class="btn-secondary" id="preview-agenda-btn">
                  <span>👁️</span> Preview
                </button>
                <button class="btn-primary" id="save-agenda-btn">
                  <span>💾</span> Save Agenda
                </button>
              </div>
            </div>
          ` : `
            <div class="empty-builder-state">
              <div class="empty-icon">📝</div>
              <h4>Select a Date First</h4>
              <p>Choose a date from the calendar to start building your agenda.</p>
              <div class="template-preview">
                <h5>Available Templates:</h5>
                <div class="template-cards">
                  ${Object.entries(agendaTemplates).map(([key, t]) => `
                    <div class="template-card ${agendaMakerTemplate === key ? 'active' : ''}" data-template="${key}">
                      <span class="template-icon">${t.icon}</span>
                      <span class="template-name">${t.name}</span>
                      <span class="template-items">${t.items.length} items</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          `}
        </div>
      </div>
    </div>
  `;
}

function renderAgendaMakerCalendar(year: number, month: number, existingAssignments: SundayAssignment[]): string {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const daysInMonth = lastDay.getDate();
  const startingDay = firstDay.getDay();

  const monthName = firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Get existing agenda dates
  const existingDates = new Set(existingAssignments.map(a => a.date));

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month - 1;
  const currentDay = today.getDate();

  let calendarDays = '';

  for (let i = 0; i < startingDay; i++) {
    calendarDays += '<div class="maker-calendar-day empty"></div>';
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const date = new Date(year, month - 1, day);
    const isSunday = date.getDay() === 0;
    const isToday = isCurrentMonth && day === currentDay;
    const hasExisting = existingDates.has(dateStr);
    const isSelected = selectedAgendaDate === dateStr;

    calendarDays += `
      <div class="maker-calendar-day ${isSunday ? 'sunday' : ''} ${isToday ? 'today' : ''} ${hasExisting ? 'has-agenda' : ''} ${isSelected ? 'selected' : ''}" 
           data-date="${dateStr}" ${!isSunday ? 'data-non-sunday="true"' : ''}>
        <span class="day-num">${day}</span>
        ${isSunday ? '<span class="sunday-dot"></span>' : ''}
        ${hasExisting ? '<span class="existing-indicator">✓</span>' : ''}
      </div>
    `;
  }

  return `
    <div class="maker-calendar-container">
      <div class="maker-calendar-header">
        <button class="maker-nav-btn" id="maker-prev-month">◀</button>
        <h4 class="maker-month-title">${monthName}</h4>
        <button class="maker-nav-btn" id="maker-next-month">▶</button>
      </div>
      <div class="maker-calendar-weekdays">
        <span class="sun">Sun</span>
        <span>Mon</span>
        <span>Tue</span>
        <span>Wed</span>
        <span>Thu</span>
        <span>Fri</span>
        <span>Sat</span>
      </div>
      <div class="maker-calendar-grid">
        ${calendarDays}
      </div>
      <div class="calendar-legend">
        <span class="legend-item"><span class="legend-dot sunday"></span> Sundays</span>
        <span class="legend-item"><span class="legend-dot existing"></span> Has Agenda</span>
      </div>
    </div>
  `;
}

function renderAgendaMakerItem(item: AgendaItem, index: number): string {
  const typeIcons: Record<string, string> = {
    text: '📝',
    hymn: '🎵',
    prayer: '🙏',
    speaker: '🎤',
    ordinance: '🍞',
    custom: '⚡'
  };

  return `
    <div class="agenda-item-row ${item.editable ? '' : 'readonly'}" data-id="${item.id}" data-type="${item.type}">
      <span class="item-number">${index + 1}</span>
      <span class="item-type-icon">${typeIcons[item.type]}</span>
      <div class="item-content">
        <label class="item-label">${item.label}</label>
        ${item.editable ? `
          ${item.type === 'hymn' ? `
            <div class="hymn-input-group">
              <input type="text" class="item-input hymn-search" placeholder="Search hymn or enter number..." data-id="${item.id}" value="${item.value}">
              <button class="btn-icon hymn-picker-btn" data-id="${item.id}" title="Browse Hymns">🎵</button>
            </div>
          ` : `
            <input type="text" class="item-input" placeholder="Enter ${item.label.toLowerCase()}..." data-id="${item.id}" value="${item.value}">
          `}
        ` : `
          <span class="item-value readonly">${item.value}</span>
        `}
      </div>
      ${item.editable ? `
        <div class="item-actions">
          <button class="btn-icon move-up-btn" data-id="${item.id}" title="Move Up">↑</button>
          <button class="btn-icon move-down-btn" data-id="${item.id}" title="Move Down">↓</button>
          <button class="btn-icon delete-item-btn" data-id="${item.id}" title="Remove">🗑️</button>
        </div>
      ` : ''}
    </div>
  `;
}

function formatSelectedDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

function attachAgendaMakerListeners(): void {
  // Calendar navigation
  document.getElementById('maker-prev-month')?.addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 1) { currentMonth = 12; currentYear--; }
    loadAssignments();
  });

  document.getElementById('maker-next-month')?.addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 12) { currentMonth = 1; currentYear++; }
    loadAssignments();
  });

  // Date selection
  document.querySelectorAll('.maker-calendar-day:not(.empty)').forEach(day => {
    day.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLElement;
      const dateStr = target.dataset.date;
      const isNonSunday = target.dataset.nonSunday === 'true';

      if (isNonSunday) {
        if (!confirm('This is not a Sunday. Are you sure you want to create an agenda for this date?')) {
          return;
        }
      }

      selectedAgendaDate = dateStr || null;
      loadAssignments();
    });
  });

  // Template selection
  document.getElementById('template-select')?.addEventListener('change', (e) => {
    agendaMakerTemplate = (e.target as HTMLSelectElement).value;
    loadAssignments();
  });

  // Template card clicks
  document.querySelectorAll('.template-card').forEach(card => {
    card.addEventListener('click', (e) => {
      agendaMakerTemplate = (e.currentTarget as HTMLElement).dataset.template || 'sacrament';
      loadAssignments();
    });
  });

  // Save agenda button
  document.getElementById('save-agenda-btn')?.addEventListener('click', async () => {
    if (!selectedAgendaDate) return;

    // Collect all form data
    const items: Record<string, string> = {};
    document.querySelectorAll('.agenda-item-row .item-input').forEach(input => {
      const id = (input as HTMLInputElement).dataset.id;
      const value = (input as HTMLInputElement).value;
      if (id) items[id] = value;
    });

    // For now, log the data (in real app, would save to database)
    console.log('Saving agenda for', selectedAgendaDate, items);
    showToast('Agenda saved successfully!', 'success');
  });

  // Preview button
  document.getElementById('preview-agenda-btn')?.addEventListener('click', () => {
    if (!selectedAgendaDate) return;

    // Open preview modal or new window
    const previewContent = generateAgendaPreview();
    const previewWindow = window.open('', '_blank', 'width=600,height=800');
    if (previewWindow) {
      previewWindow.document.write(previewContent);
    }
  });

  // Add custom item
  document.getElementById('add-custom-item-btn')?.addEventListener('click', () => {
    const label = prompt('Enter label for the new item:');
    if (label) {
      const template = agendaTemplates[agendaMakerTemplate];
      const newId = String(template.items.length + 1);
      template.items.push({
        id: newId,
        type: 'custom',
        label: label,
        value: '',
        editable: true
      });
      loadAssignments();
    }
  });
}

function generateAgendaPreview(): string {
  const template = agendaTemplates[agendaMakerTemplate];
  const items: { label: string; value: string }[] = [];

  document.querySelectorAll('.agenda-item-row').forEach(row => {
    const label = row.querySelector('.item-label')?.textContent || '';
    const input = row.querySelector('.item-input') as HTMLInputElement;
    const readonlyValue = row.querySelector('.item-value.readonly')?.textContent || '';
    const value = input ? input.value : readonlyValue;
    items.push({ label, value: value || 'TBD' });
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Agenda Preview - ${formatSelectedDate(selectedAgendaDate || '')}</title>
      <style>
        body { font-family: 'Georgia', serif; padding: 40px; max-width: 600px; margin: auto; }
        h1 { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
        h2 { text-align: center; color: #666; font-weight: normal; margin-bottom: 30px; }
        .item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dotted #ccc; }
        .label { font-weight: bold; }
        .value { color: #333; }
        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #999; }
        @media print { body { padding: 20px; } }
      </style>
    </head>
    <body>
      <h1>${template.icon} ${template.name}</h1>
      <h2>${formatSelectedDate(selectedAgendaDate || '')}</h2>
      ${items.map(item => `
        <div class="item">
          <span class="label">${item.label}</span>
          <span class="value">${item.value}</span>
        </div>
      `).join('')}
      <div class="footer">Generated with MyChurchCalling</div>
    </body>
    </html>
  `;
}

// ============================================
// LOADERS & LISTENERS
// ============================================
let currentIndexType = 'hymns';

// Toast Notification System
function showToast(message: string, type: 'success' | 'error' = 'success'): void {
  const container = document.getElementById('toast-container') || createToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${type === 'success' ? '✅' : '❌'}</span>
    <span class="toast-message">${message}</span>
  `;
  container.appendChild(toast);

  // Animate in
  setTimeout(() => toast.classList.add('show'), 10);

  // Auto remove
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

// Helper to match CFM lesson based on date
function matchCfmLesson(dateStr: string, lesson: CfmLesson): boolean {
  // dateStr is YYYY-MM-DD
  const date = new Date(dateStr + 'T00:00:00');
  const d = date.getDate();
  const m = date.getMonth(); // 0-indexed

  // lesson.weekRange is format "Jan 13-19" or "Dec 30 - Jan 5"
  const range = lesson.weekRange;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Try to parse the range
  // Split by '-' and clean up
  const parts = range.split('-').map(p => p.trim());
  if (parts.length < 2) return false;

  // Extract month and day for start and end
  const parsePart = (part: string) => {
    const match = part.match(/([A-Za-z]+)\s+(\d+)/);
    if (match) return { month: months.indexOf(match[1]), day: parseInt(match[2]) };
    const dayMatch = part.match(/(\d+)/);
    if (dayMatch) return { month: -1, day: parseInt(dayMatch[1]) };
    return null;
  };

  const start = parsePart(parts[0]);
  const end = parsePart(parts[1]);

  if (!start || !end) return false;

  const startMonth = start.month;
  let endMonth = end.month === -1 ? startMonth : end.month;

  // Check if current date falls within the range
  // This is a simple check assuming ranges don't wrap around years except Dec-Jan
  const checkDateInRange = (currM: number, currD: number, sM: number, sD: number, eM: number, eD: number) => {
    if (sM === eM) {
      return currM === sM && currD >= sD && currD <= eD;
    } else {
      // Cross month
      if (currM === sM) return currD >= sD;
      if (currM === eM) return currD <= eD;
      return false;
    }
  };

  return checkDateInRange(m, d, startMonth, start.day, endMonth, end.day);
}

export async function loadAssignments(): Promise<void> {
  const content = document.getElementById('assignments-content');
  if (!content) return;

  content.innerHTML = UI.spinner('Loading...');

  if (viewMode === 'indexes') {
    content.innerHTML = await renderIndexesView();
    attachIndexListeners();
  } else if (viewMode === 'agenda-maker') {
    assignments = await getAssignmentsByMonth(currentYear, currentMonth);
    content.innerHTML = renderAgendaMakerView(assignments);
    attachAgendaMakerListeners();
  } else {
    assignments = await getAssignmentsByMonth(currentYear, currentMonth);
    content.innerHTML = viewMode === 'agenda'
      ? renderAgendaView(assignments)
      : renderTableView(assignments);

    // Attach listeners for dynamic elements (edit buttons etc)
    attachDynamicListeners();
  }
}

function attachDynamicListeners(): void {
  // Edit Assignment Buttons
  document.querySelectorAll('.edit-assignment-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLElement;
      const id = target.dataset.id;
      const assignment = assignments.find(a => a._id === id);
      if (assignment) {
        handleEditAssignment(assignment, target);
      }
    });
  });

  // Print buttons
  document.querySelectorAll('.print-assignment-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      // In a real app, we might open a print-optimized view or print a specific element
      window.print();
    });
  });
}

function handleEditAssignment(a: SundayAssignment, btnElement: HTMLElement): void {
  if (viewMode === 'agenda') {
    const modal = document.getElementById('edit-modal');
    const body = document.getElementById('edit-modal-body');

    if (modal && body) {
      body.innerHTML = renderEditForm(a);
      modal.style.display = 'flex';
      attachEditAssignmentListeners(a);
    }
  } else {
    // Table View - Inline editing beneath the row
    const row = btnElement.closest('tr');
    if (!row) return;

    // Check if editing row already exists
    const existingEditRow = document.querySelector(`.inline - edit - row[data -for= "${a._id}"]`);
    if (existingEditRow) {
      existingEditRow.remove();
      return;
    }

    // Remove any other open inline edit rows
    document.querySelectorAll('.inline-edit-row').forEach(el => el.remove());

    const editRow = document.createElement('tr');
    editRow.className = 'inline-edit-row';
    editRow.dataset.for = a._id;
    editRow.innerHTML = `
  < td colspan = "9" >
    <div class="inline-edit-container" >
      ${renderEditForm(a)}
</div>
  </td>
    `;
    row.after(editRow);
    attachEditAssignmentListeners(a);
  }
}

function renderEditForm(a: SundayAssignment): string {
  const speakerCount = a.talks?.length || 0;
  const hasInterlude = !!a.hymns?.interlude;
  const isFast = !!a.isFastSunday || a.meetingType === 'fast';
  let meetingType = a.meetingType || (isFast ? 'fast' : 'standard');
  if ((meetingType as string) === 'ward-conference') meetingType = 'conference';
  const meetingSubtype = a.meetingSubtype || '';

  // Generate datalist for hymns
  const hymnDatalist = `
  < datalist id = "hymns-list" >
    ${hymnsCache.map(h => `<option value="${h.number}: ${h.title}">`).join('')}
</datalist>
  `;

  return `
  < div class="edit-assignment-form" data - id="${a._id}" >
    ${hymnDatalist}
<div class="form-header" >
  <div class="header-info" >
    <h3>Edit Assignment </h3>
      < p class="subtle-text" > ${new Date(a.date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} </p>
        </div>
        < button class="btn-icon" id = "close-edit-modal" >✕</button>
          </div>
          < !--General Configuration-- >
            <div class="form-section" >
              <h4>⚙️ General Configuration </h4>
                < div class="toggle-row" >
                  <label>Meeting Type </label>
                    < div class="toggle-group flex-row-mobile" >
                      <button class="toggle-btn ${meetingType === 'standard' ? 'active' : ''}" data - mtype="standard" > Standard </button>
                        < button class="toggle-btn ${meetingType === 'fast' ? 'active' : ''}" data - mtype="fast" >🥖 Fast </button>
                          < button class="toggle-btn ${meetingType === 'conference' ? 'active' : ''}" data - mtype="conference" >🏛️ Conference </button>
                            < button class="toggle-btn ${meetingType === 'devotional' ? 'active' : ''}" data - mtype="devotional" >🕯️ Devotional </button>
                              </div>
                              </div>

                              < div class="toggle-row ${meetingType !== 'conference' ? 'hidden' : ''}" id = "conference-subtype-row" >
                                <label>Conference Type </label>
                                  < div class="vertical-stack mt-05" >
                                    <select id="edit-conference-subtype" class="input-glass-sm" >
                                      <option value="ward" ${meetingSubtype === 'ward' ? 'selected' : ''}> Ward </option>
                                        < option value = "stake" ${meetingSubtype === 'stake' ? 'selected' : ''}> Stake </option>
                                          < option value = "special" ${meetingSubtype === 'special' ? 'selected' : ''}> Special </option>
                                            < option value = "apostle" ${meetingSubtype === 'apostle' ? 'selected' : ''}> Apostle </option>
                                              < option value = "custom" ${!['ward', 'stake', 'special', 'apostle'].includes(meetingSubtype) && meetingSubtype ? 'selected' : ''}> Custom...</option>
                                                </select>
                                                < input type = "text" id = "edit-conference-custom" class= "input-glass-sm ${!['ward', 'stake', 'special', 'apostle'].includes(meetingSubtype) && meetingSubtype ? '' : 'hidden'}" value = "${meetingSubtype}" placeholder = "Enter custom conference name" />
                                                  </div>
                                                  </div>

                                                  < div class= "toggle-row ${meetingType !== 'devotional' ? 'hidden' : ''}" id = "devotional-subtype-row" >
                                                    <label>Devotional Type </label>
                                                      < div class= "vertical-stack mt-05" >
                                                        <select id="edit-devotional-subtype" class= "input-glass-sm" >
                                                          <option value="christmas" ${meetingSubtype === 'christmas' ? 'selected' : ''}> Christmas </option>
                                                            < option value = "easter" ${meetingSubtype === 'easter' ? 'selected' : ''}> Easter </option>
                                                              < option value = "special" ${meetingSubtype === 'special' ? 'selected' : ''}> Special </option>
                                                                < option value = "asia-area" ${meetingSubtype === 'asia-area' ? 'selected' : ''}> Asia Area </option>
                                                                  < option value = "other" ${meetingSubtype === 'other' ? 'selected' : ''}> Other </option>
                                                                    < option value = "custom" ${!['christmas', 'easter', 'special', 'asia-area', 'other'].includes(meetingSubtype) && meetingSubtype ? 'selected' : ''}> Custom...</option>
                                                                      </select>
                                                                      < input type = "text" id = "edit-devotional-custom" class="input-glass-sm ${!['christmas', 'easter', 'special', 'asia-area', 'other'].includes(meetingSubtype) && meetingSubtype ? '' : 'hidden'}" value = "${meetingSubtype}" placeholder = "Enter custom devotional name" />
                                                                        </div>
                                                                        </div>

                                                                        < div class="speaker-config-container ${meetingType === 'fast' ? 'hidden' : ''}" id = "speaker-config-section" >
                                                                          <div class="toggle-row" >
                                                                            <label>Number of Speakers </label>
                                                                              < div class="toggle-group" >
                                                                                <button class="toggle-btn ${speakerCount === 2 ? 'active' : ''}" data - speakers="2" > 2 Speakers </button>
                                                                                  < button class="toggle-btn ${speakerCount === 3 ? 'active' : ''}" data - speakers="3" > 3 Speakers </button>
                                                                                    </div>
                                                                                    </div>
                                                                                    < div class="toggle-row" id = "interlude-toggle-row" >
                                                                                      <label>Interlude Hymn </label>
                                                                                        < div class="toggle-group" >
                                                                                          <button class="toggle-btn ${!hasInterlude ? 'active' : ''}" data - interlude="no" > No </button>
                                                                                            < button class="toggle-btn ${hasInterlude ? 'active' : ''}" data - interlude="yes" > Yes </button>
                                                                                              </div>
                                                                                              < span class="toggle-note" > Musical selection </span>
                                                                                                </div>
                                                                                                < div class="toggle-row" id = "special-hymn-toggle-row" >
                                                                                                  <label>Special Hymn </label>
                                                                                                    < div class="toggle-group" >
                                                                                                      <button class="toggle-btn ${!a.hymns?.special ? 'active' : ''}" data - special="no" > No </button>
                                                                                                        < button class="toggle-btn ${!!a.hymns?.special ? 'active' : ''}" data - special="yes" > Yes </button>
                                                                                                          </div>
                                                                                                          < span class="toggle-note" > Additional musical number </span>
                                                                                                            </div>
                                                                                                            </div>
                                                                                                            </div>

                                                                                                            < !--Speaker Assignments-- >
                                                                                                              <div class="form-section ${meetingType === 'fast' ? 'hidden' : ''}" id = "speakers-form-section" >
                                                                                                                <h4>Speaker Assignments </h4>
                                                                                                                  < div id = "speakers-form" >
                                                                                                                    ${renderSpeakerForms(a.talks || [], speakerCount)}
</div>
  </div>

  < !--Sacrament Meeting Program Details-- >
    <div class="form-section" >
      <h4>🕊️ Sacrament Meeting Details </h4>
        < div class="vertical-stack" >
          <div class="form-group" >
            <label>Conducting </label>
            < input type = "text" id = "edit-conducting" value = "${a.sacramentMeeting?.conductingLeader || ''}" />
              </div>
              < div class="form-group" >
                <label>Presiding </label>
                < input type = "text" id = "edit-presiding" value = "${a.sacramentMeeting?.presiding || ''}" />
                  </div>
                  < div class="form-group" >
                    <label>Opening Prayer </label>
                      < input type = "text" id = "edit-opening-prayer" value = "${a.sacramentMeeting?.openingPrayer || ''}" />
                        </div>
                        < div class="form-group" >
                          <label>Closing Prayer </label>
                            < input type = "text" id = "edit-closing-prayer" value = "${a.sacramentMeeting?.closingPrayer || ''}" />
                              </div>
                              </div>

                              < div class="announcement-edit-group mt-2" >
                                <div class="section-label-row" >
                                  <label>📢 Announcements </label>
                                    < button class="btn-text-sm" id = "btn-suggest-announcements" >📋 Suggestions from Index </button>
                                      </div>
                                      < div id = "announcement-suggestions" class="suggestions-panel hidden" >
                                        <!--Dynamically filled-- >
                                          </div>

                                          < div class="announcement-todo-container" >
                                            <div id="announcement-list" class="todo-list" >
                                              ${(a.sacramentMeeting?.announcements || '').split('\n').filter(line => line.trim()).map((line, idx) => `
                <div class="todo-item" data-index="${idx}">
                  <span class="todo-text">${line.replace(/^•\s*/, '')}</span>
                  <button class="btn-icon remove-todo-btn" data-index="${idx}">✕</button>
                </div>
              `).join('')
    }
</div>
  < div class="todo-input-row" >
    <input type="text" id = "new-announcement-input" placeholder = "Type an announcement and press Enter..." class="input-glass-sm" />
      <button class="btn-primary btn-sm" id = "add-announcement-btn" > Add </button>
        </div>
        </div>
        < input type = "hidden" id = "edit-announcements" value = "${a.sacramentMeeting?.announcements || ''}" />
          </div>
          </div>

          < !--Hymns Configuration-- >
            <div class="form-section" >
              <h4>🎵 Hymns </h4>
                < div class="vertical-stack" >
                  <div class="hymn-edit-group" >
                    <label>Opening Hymn </label>
                      < div class="form-row" >
                        <input type="number" id = "edit-h1-num" value = "${a.hymns?.opening?.hymnNumber || ''}" placeholder = "#" style = "width: 70px; flex: none;" />
                          <input type="text" id = "edit-h1-title" list = "hymns-list" value = "${a.hymns?.opening?.title || ''}" placeholder = "Title" />
                            </div>
                            </div>

                            < div class="hymn-edit-group" >
                              <label>Sacrament Hymn </label>
                                < div class="form-row" >
                                  <input type="number" id = "edit-h2-num" value = "${a.hymns?.sacrament?.hymnNumber || ''}" placeholder = "#" style = "width: 70px; flex: none;" />
                                    <input type="text" id = "edit-h2-title" list = "hymns-list" value = "${a.hymns?.sacrament?.title || ''}" placeholder = "Title" />
                                      </div>
                                      </div>

                                      < div class="hymn-edit-group ${!hasInterlude ? 'hidden' : ''}" id = "interlude-hymn-group" style = "border: 1px dashed rgba(139, 92, 246, 0.3); background: rgba(139, 92, 246, 0.05);" >
                                        <label>🎵 Interlude Hymn / Musical Selection </label>
                                          < div class="form-row" >
                                            <input type="number" id = "interlude-number" value = "${a.hymns?.interlude?.hymnNumber || ''}" placeholder = "#" style = "width: 70px; flex: none;" />
                                              <input type="text" id = "interlude-title" list = "hymns-list" value = "${a.hymns?.interlude?.title || ''}" placeholder = "Title or Description" />
                                                </div>
                                                </div>

                                                < div class="hymn-edit-group ${!a.hymns?.special ? 'hidden' : ''}" id = "special-hymn-group" style = "border: 1px dashed rgba(251, 191, 36, 0.3); background: rgba(251, 191, 36, 0.05);" >
                                                  <label>⭐ Special Hymn / Musical Number </label>
                                                    < div class="form-row" >
                                                      <input type="number" id = "special-number" value = "${a.hymns?.special?.hymnNumber || ''}" placeholder = "#" style = "width: 70px; flex: none;" />
                                                        <input type="text" id = "special-title" list = "hymns-list" value = "${a.hymns?.special?.title || ''}" placeholder = "Title or Description" />
                                                          </div>
                                                          </div>

                                                          < div class="hymn-edit-group" >
                                                            <label>Closing Hymn </label>
                                                              < div class="form-row" >
                                                                <input type="number" id = "edit-h4-num" value = "${a.hymns?.closing?.hymnNumber || ''}" placeholder = "#" style = "width: 70px; flex: none;" />
                                                                  <input type="text" id = "edit-h4-title" list = "hymns-list" value = "${a.hymns?.closing?.title || ''}" placeholder = "Title" />
                                                                    </div>
                                                                    </div>
                                                                    </div>
                                                                    </div>

                                                                    < !--Second Hour Configuration-- >
                                                                      <!--Second Hour Classes-- >
                                                                        <div class="form-section" >
                                                                          <h4 id="second-hour-label" > ${a.sundayNumber === 5 ? '🏛️ 5th Sunday: Bishopric Sunday' : '🏫 Second Hour Classes'} </h4>
                                                                            < div class="vertical-stack" >
                                                                              ${a.sundayNumber === 1 || a.sundayNumber === 3 ? `
            <div class="class-edit-section">
              <h5>Sunday School (Weeks 1 & 3)</h5>
              <div class="vertical-stack mt-1">
                <div class="form-group">
                  <label>Sunday School Teacher</label>
                  <input type="text" id="edit-ss-inst" value="${a.sundaySchool?.instructor || ''}" />
                </div>
                <div class="form-group">
                  <label>Sunday School Lesson (Auto-matched from CFM)</label>
                  <select id="edit-ss-lesson" class="input-glass-sm">
                    <option value="">-- Select Lesson --</option>
                    ${cfmCache.map(l => {
      // Attempt auto-match for display
      const isMatched = !a.sundaySchool?.assignedLesson && matchCfmLesson(a.date, l);
      return `<option value="cfm:${l._id}" ${a.sundaySchool?.assignedLesson === `cfm:${l._id}` || isMatched ? 'selected' : ''}>${l.scriptureBlock || l.lessonTitle} (${l.weekRange})</option>`;
    }).join('')}
                  </select>
                </div>
                <div class="form-group">
                  <label>Young Single Adult Teacher</label>
                  <input type="text" id="edit-ysa-inst" value="${a.ysaSundaySchool?.instructor || ''}" />
                </div>
                <div class="form-group">
                  <label>YSA Lesson (Auto-matched from CFM)</label>
                  <select id="edit-ysa-lesson" class="input-glass-sm">
                    <option value="">-- Select Lesson --</option>
                    ${cfmCache.map(l => {
      const isMatched = !a.ysaSundaySchool?.assignedLesson && matchCfmLesson(a.date, l);
      return `<option value="cfm:${l._id}" ${a.ysaSundaySchool?.assignedLesson === `cfm:${l._id}` || isMatched ? 'selected' : ''}>${l.scriptureBlock || l.lessonTitle}</option>`;
    }).join('')}
                  </select>
                </div>
              </div>
            </div>
          ` : a.sundayNumber === 2 || a.sundayNumber === 4 ? `
            <div class="class-edit-section">
              <h5>Quorum & Relief Society (Weeks 2 & 4)</h5>
              <div class="vertical-stack mt-1">
                <div class="form-group">
                  <label>Elders Quorum Teacher</label>
                  <input type="text" id="edit-eqrs-inst" value="${a.eldersQuorum?.instructor || ''}" />
                </div>
                <div class="form-group">
                  <label>Elders Quorum Lesson (from Talks Index)</label>
                  <select id="edit-eq-lesson" class="input-glass-sm">
                    <option value="">-- Select Conference Talk --</option>
                    ${talksCache.map(t => `<option value="talk:${t._id}" ${a.eldersQuorum?.assignedLesson === `talk:${t._id}` ? 'selected' : ''}>${t.speaker}: ${t.title}</option>`).join('')}
                  </select>
                </div>
                <div class="form-group">
                  <label>Relief Society Teacher</label>
                  <input type="text" id="edit-rs-inst" value="${a.reliefSociety?.instructor || ''}" />
                </div>
                <div class="form-group">
                  <label>Relief Society Lesson (from Talks Index)</label>
                  <select id="edit-rs-lesson" class="input-glass-sm">
                    <option value="">-- Select Conference Talk --</option>
                    ${talksCache.map(t => `<option value="talk:${t._id}" ${a.reliefSociety?.assignedLesson === `talk:${t._id}` ? 'selected' : ''}>${t.speaker}: ${t.title}</option>`).join('')}
                  </select>
                </div>
              </div>
            </div>
          ` : `
            <div class="empty-state">
              <p>5th Sunday: Usually a combined Bishopric meeting or special theme.</p>
            </div>
          `}
</div>
  </div>

  < div class="form-section" >
    <h4>📝 Extra Notes </h4>
      < textarea id = "edit-notes" rows = "2" > ${a.notes || ''} </textarea>
        </div>

        < div class="modal-actions" >
          <button class="btn-secondary" id = "cancel-edit" > Cancel </button>
            < button class="btn-primary" id = "save-edit" >💾 Save Changes </button>
              </div>
              </div>
                `;
}

function renderSpeakerForms(talks: any[], count: number): string {
  let html = '';
  for (let i = 0; i < count; i++) {
    const talk = talks[i] || {};

    // Build lesson options from all available indexes
    const lessonOptions = [
      '<option value="">-- Select Lesson --</option>',
      '<optgroup label="Come Follow Me">',
      ...cfmCache.map(l => `< option value = "cfm:${l._id}" ${talk.assignedLesson === `cfm:${l._id}` ? 'selected' : ''}> ${l.scriptureBlock || l.lessonTitle} </option>`),
      '</optgroup>',
      '<optgroup label="Gospel Principles">',
      ...principlesCache.map(p => `<option value="principle:${p._id}" ${talk.assignedLesson === `principle:${p._id}` ? 'selected' : ''}>${p.title}</option>`),
      '</optgroup>',
      '<optgroup label="Conference Talks">',
      ...talksCache.map(t => `<option value="talk:${t._id}" ${talk.assignedLesson === `talk:${t._id}` ? 'selected' : ''}>${t.speaker} - ${t.title}</option>`),
      '</optgroup>'
    ].join('');

    html += `
      <div class="speaker-form">
        <div class="speaker-form-header">
          <span class="speaker-badge">${i + 1}</span>
          <span>Speaker ${i + 1}</span>
        </div>
        <div class="vertical-stack">
          <div class="form-group">
            <label>Name</label>
            <input type="text" class="speaker-name-input" value="${talk.speakerName || ''}" />
          </div>
          <div class="form-group">
            <label>Assigned Lesson</label>
            <select class="speaker-lesson-select input-glass-sm">${lessonOptions}</select>
          </div>
          <div class="form-group">
            <label>Topic</label>
            <input type="text" class="speaker-topic-input" value="${talk.topic || ''}" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Org</label>
              <input type="text" class="speaker-org-input" value="${talk.organization || ''}" />
            </div>
            <div class="form-group" style="max-width: 100px;">
              <label>Min</label>
              <input type="number" class="speaker-duration-input" value="${talk.duration || ''}" />
            </div>
          </div>
        </div>
      </div>
    `;
  }
  return html;
}

function attachEditAssignmentListeners(a: SundayAssignment): void {
  document.getElementById('close-edit-modal')?.addEventListener('click', closeModals);
  document.getElementById('cancel-edit')?.addEventListener('click', closeModals);

  // Toggle buttons
  document.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLElement;
      const group = target.parentElement;
      if (group) {
        group.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
        target.classList.add('active');

        // Handle Meeting Type logic
        if (target.dataset.mtype) {
          const mtype = target.dataset.mtype;
          const isFast = mtype === 'fast';
          const isDevotional = mtype === 'devotional';
          const isConference = mtype === 'conference';

          document.getElementById('speaker-config-section')?.classList.toggle('hidden', isFast);
          document.getElementById('speakers-form-section')?.classList.toggle('hidden', isFast);
          document.getElementById('devotional-subtype-row')?.classList.toggle('hidden', !isDevotional);
          document.getElementById('conference-subtype-row')?.classList.toggle('hidden', !isConference);
        }

        // Handle speaker count logic
        if (target.dataset.speakers) {
          const count = parseInt(target.dataset.speakers);
          const speakersForm = document.getElementById('speakers-form');
          if (speakersForm) {
            speakersForm.innerHTML = renderSpeakerForms(a.talks || [], count);
          }
        }

        if (target.dataset.interlude) {
          const interludeGroup = document.getElementById('interlude-hymn-group');
          if (interludeGroup) {
            interludeGroup.classList.toggle('hidden', target.dataset.interlude === 'no');
          }
        }

        if (target.dataset.special) {
          const specialGroup = document.getElementById('special-hymn-group');
          if (specialGroup) {
            specialGroup.classList.toggle('hidden', target.dataset.special === 'no');
          }
        }
      }
    });
  });

  // Custom subtype logic
  ['conference', 'devotional'].forEach(type => {
    document.getElementById(`edit-${type}-subtype`)?.addEventListener('change', (e) => {
      const select = e.target as HTMLSelectElement;
      const customInput = document.getElementById(`edit-${type}-custom`);
      if (customInput) {
        customInput.classList.toggle('hidden', select.value !== 'custom');
        if (select.value === 'custom') customInput.focus();
      }
    });
  });

  // Hymn Sync Logic
  const hymnInputs = [
    { num: 'edit-h1-num', title: 'edit-h1-title' },
    { num: 'edit-h2-num', title: 'edit-h2-title' },
    { num: 'interlude-number', title: 'interlude-title' },
    { num: 'special-number', title: 'special-title' },
    { num: 'edit-h4-num', title: 'edit-h4-title' }
  ];

  hymnInputs.forEach(pair => {
    const numEl = document.getElementById(pair.num) as HTMLInputElement;
    const titleEl = document.getElementById(pair.title) as HTMLInputElement;

    numEl?.addEventListener('input', () => {
      const num = parseInt(numEl.value);
      if (num > 0) {
        const h = hymnsCache.find(x => x.number === num);
        if (h) titleEl.value = h.title;
      }
    });

    titleEl?.addEventListener('input', () => {
      const val = titleEl.value.toLowerCase();
      // If it looks like "Number: Title", extract title
      let searchTitle = val;
      if (val.includes(':')) searchTitle = val.split(':')[1].trim();

      const h = hymnsCache.find(x => x.title.toLowerCase().includes(searchTitle) || (x.number.toString() === searchTitle));
      if (h && searchTitle.length > 2) {
        numEl.value = h.number.toString();
        // If user selected from datalist, we might want to clean up the title
        if (titleEl.value.includes(':')) {
          titleEl.value = h.title;
        }
      }
    });
  });

  // Announcement suggestions logic
  document.getElementById('btn-suggest-announcements')?.addEventListener('click', () => {
    const panel = document.getElementById('announcement-suggestions');
    if (!panel) return;

    if (panel.classList.contains('hidden')) {
      panel.classList.remove('hidden');
      // Filter relevant announcements: recurring or specific to this date
      const relevant = announcementsCache.filter(ann =>
        ann.active && (ann.type === 'recurring' || ann.targetDate === a.date)
      );

      if (relevant.length === 0) {
        panel.innerHTML = '<p class="subtle-text">No indexed announcements found for this date.</p>';
      } else {
        panel.innerHTML = relevant.map(ann => `
          <div class="suggestion-item">
            <input type="checkbox" data-content="${ann.content}" id="ann-${ann._id}">
            <label for="ann-${ann._id}">${ann.content} <span class="badge-${ann.type}">${ann.type}</span></label>
          </div>
        `).join('') + '<button class="btn-sm btn-primary mt-1" id="add-selected-announcements">Add Selected</button>';

        document.getElementById('add-selected-announcements')?.addEventListener('click', () => {
          const selected = Array.from(panel.querySelectorAll('input:checked')) as HTMLInputElement[];
          selected.forEach(i => addItem(i.dataset.content || ''));
          panel.classList.add('hidden');
        });
      }
    } else {
      panel.classList.add('hidden');
    }
  });

  // Todo List Logic
  const todoList = document.getElementById('announcement-list');
  const todoInput = document.getElementById('new-announcement-input') as HTMLInputElement;
  const addTodoBtn = document.getElementById('add-announcement-btn');
  const hiddenInput = document.getElementById('edit-announcements') as HTMLInputElement;

  const updateHiddenAnnouncements = () => {
    const items = Array.from(document.querySelectorAll('.todo-text')).map(el => el.textContent);
    hiddenInput.value = items.join('\n');
  };

  const addItem = (text: string) => {
    if (!text.trim()) return;
    const div = document.createElement('div');
    div.className = 'todo-item';
    div.innerHTML = `
      <span class="todo-text">${text}</span>
      <button class="btn-icon remove-todo-btn">✕</button>
    `;
    todoList?.appendChild(div);
    todoInput.value = '';
    updateHiddenAnnouncements();

    div.querySelector('.remove-todo-btn')?.addEventListener('click', () => {
      div.remove();
      updateHiddenAnnouncements();
    });
  };

  addTodoBtn?.addEventListener('click', () => addItem(todoInput.value));
  todoInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addItem(todoInput.value);
    }
  });

  document.querySelectorAll('.remove-todo-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      (e.currentTarget as HTMLElement).closest('.todo-item')?.remove();
      updateHiddenAnnouncements();
    });
  });


  // Save changes
  document.getElementById('save-edit')?.addEventListener('click', async () => {
    const btn = document.getElementById('save-edit') as HTMLButtonElement;
    btn.disabled = true;
    btn.textContent = 'Saving...';

    const speakerCount = parseInt(document.querySelector('.toggle-btn[data-speakers].active')?.getAttribute('data-speakers') || '2');
    const interludeEnabled = document.querySelector('.toggle-btn[data-interlude].active')?.getAttribute('data-interlude') === 'yes';
    const specialHymnEnabled = document.querySelector('.toggle-btn[data-special].active')?.getAttribute('data-special') === 'yes';
    const meetingType = document.querySelector('.toggle-btn[data-mtype].active')?.getAttribute('data-mtype') as any || 'standard';
    const isFastSunday = meetingType === 'fast';

    let meetingSubtype: any = '';
    if (meetingType === 'conference') {
      const select = document.getElementById('edit-conference-subtype') as HTMLSelectElement;
      meetingSubtype = select.value === 'custom' ? (document.getElementById('edit-conference-custom') as HTMLInputElement).value : select.value;
    } else if (meetingType === 'devotional') {
      const select = document.getElementById('edit-devotional-subtype') as HTMLSelectElement;
      meetingSubtype = select.value === 'custom' ? (document.getElementById('edit-devotional-custom') as HTMLInputElement).value : select.value;
    }

    // Collect speaker data with lesson assignments
    const talks: any[] = [];
    if (!isFastSunday) {
      document.querySelectorAll('.speaker-form').forEach((form, i) => {
        if (i < speakerCount) {
          const speakerName = (form.querySelector('.speaker-name-input') as HTMLInputElement).value;
          const assignedLesson = (form.querySelector('.speaker-lesson-select') as HTMLSelectElement)?.value;

          talks.push({
            speakerName,
            topic: (form.querySelector('.speaker-topic-input') as HTMLInputElement).value,
            organization: (form.querySelector('.speaker-org-input') as HTMLInputElement).value,
            duration: parseInt((form.querySelector('.speaker-duration-input') as HTMLInputElement).value) || 0,
            order: i + 1,
            assignedLesson: assignedLesson || undefined
          });
        }
      });
    }

    // Collect hymn values
    const h1 = {
      hymnNumber: parseInt((document.getElementById('edit-h1-num') as HTMLInputElement).value) || 0,
      title: (document.getElementById('edit-h1-title') as HTMLInputElement).value
    };
    const h2 = {
      hymnNumber: parseInt((document.getElementById('edit-h2-num') as HTMLInputElement).value) || 0,
      title: (document.getElementById('edit-h2-title') as HTMLInputElement).value
    };
    const h4 = {
      hymnNumber: parseInt((document.getElementById('edit-h4-num') as HTMLInputElement).value) || 0,
      title: (document.getElementById('edit-h4-title') as HTMLInputElement).value
    };

    // Check for empty critical fields
    const conducting = (document.getElementById('edit-conducting') as HTMLInputElement).value;
    const presiding = (document.getElementById('edit-presiding') as HTMLInputElement).value;
    const openingPrayer = (document.getElementById('edit-opening-prayer') as HTMLInputElement).value;
    const closingPrayer = (document.getElementById('edit-closing-prayer') as HTMLInputElement).value;

    const emptyFields: string[] = [];
    if (!conducting) emptyFields.push('Conducting Leader');
    if (!presiding) emptyFields.push('Presiding');
    if (!openingPrayer) emptyFields.push('Opening Prayer');
    if (!closingPrayer) emptyFields.push('Closing Prayer');
    if (!h1.title && !h1.hymnNumber) emptyFields.push('Opening Hymn');
    if (!h2.title && !h2.hymnNumber) emptyFields.push('Sacrament Hymn');
    if (!h4.title && !h4.hymnNumber) emptyFields.push('Closing Hymn');

    if (!isFastSunday) {
      talks.forEach((talk, i) => {
        if (!talk.speakerName) emptyFields.push(`Speaker ${i + 1} Name`);
      });
    }

    // Show confirmation if there are empty fields
    if (emptyFields.length > 0) {
      const confirmMsg = `The following fields are empty:\n\n${emptyFields.join('\n')}\n\nDo you want to save anyway?`;
      if (!confirm(confirmMsg)) {
        btn.disabled = false;
        btn.textContent = '💾 Save Changes';
        return;
      }
    }

    const isSSWeek = a.sundayNumber === 1 || a.sundayNumber === 3;
    const isQuorumWeek = a.sundayNumber === 2 || a.sundayNumber === 4;

    const updatedData: Partial<SundayAssignment> = {
      isFastSunday,
      meetingType,
      meetingSubtype,
      sacramentMeeting: {
        ...a.sacramentMeeting,
        conductingLeader: conducting,
        presiding: presiding,
        openingPrayer: openingPrayer,
        closingPrayer: closingPrayer,
        announcements: (document.getElementById('edit-announcements') as HTMLInputElement).value,
      },
      hymns: {
        opening: h1.hymnNumber > 0 || h1.title ? h1 : undefined,
        sacrament: h2.hymnNumber > 0 || h2.title ? h2 : undefined,
        closing: h4.hymnNumber > 0 || h4.title ? h4 : undefined,
      },
      talks,
      sundaySchool: isSSWeek ? {
        ...a.sundaySchool,
        instructor: (document.getElementById('edit-ss-inst') as HTMLInputElement).value,
        lessonType: 'Come Follow Me',
        assignedLesson: (document.getElementById('edit-ss-lesson') as HTMLSelectElement)?.value || undefined
      } : (a.sundaySchool || { lessonType: '' }),
      ysaSundaySchool: isSSWeek ? {
        ...a.ysaSundaySchool,
        instructor: (document.getElementById('edit-ysa-inst') as HTMLInputElement).value,
        lessonType: 'Come Follow Me',
        assignedLesson: (document.getElementById('edit-ysa-lesson') as HTMLSelectElement)?.value || undefined
      } : (a.ysaSundaySchool || { lessonType: '' }),
      eldersQuorum: isQuorumWeek ? {
        ...a.eldersQuorum,
        instructor: (document.getElementById('edit-eqrs-inst') as HTMLInputElement).value,
        lessonType: 'Conference Talk',
        assignedLesson: (document.getElementById('edit-eq-lesson') as HTMLSelectElement)?.value || undefined
      } : (a.eldersQuorum || { lessonType: '' }),
      reliefSociety: isQuorumWeek ? {
        ...a.reliefSociety,
        instructor: (document.getElementById('edit-rs-inst') as HTMLInputElement).value,
        lessonType: 'Conference Talk',
        assignedLesson: (document.getElementById('edit-rs-lesson') as HTMLSelectElement)?.value || undefined
      } : (a.reliefSociety || { lessonType: '' }),
      notes: (document.getElementById('edit-notes') as HTMLTextAreaElement).value,
    };

    if (interludeEnabled && !isFastSunday) {
      updatedData.hymns!.interlude = {
        hymnNumber: parseInt((document.getElementById('interlude-number') as HTMLInputElement).value) || 0,
        title: (document.getElementById('interlude-title') as HTMLInputElement).value,
      };
    }

    if (specialHymnEnabled) {
      updatedData.hymns!.special = {
        hymnNumber: parseInt((document.getElementById('special-number') as HTMLInputElement).value) || 0,
        title: (document.getElementById('special-title') as HTMLInputElement).value,
      };
    }

    try {
      const result = await updateAssignment(a._id, updatedData);
      if (result.success) {
        showToast('Changes saved successfully!');
        closeModals();
        loadAssignments();
      } else {
        showToast('Failed to save changes', 'error');
        btn.disabled = false;
        btn.textContent = '💾 Save Changes';
      }
    } catch (e) {
      console.error(e);
      showToast('An error occurred during save', 'error');
      btn.disabled = false;
      btn.textContent = '💾 Save Changes';
    }
  });
}

function attachIndexListeners(): void {
  // Tab switching
  document.querySelectorAll('.index-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLElement;
      currentIndexType = target.dataset.index || 'hymns';

      document.querySelectorAll('.index-tab').forEach(t => t.classList.remove('active'));
      target.classList.add('active');

      const indexContent = document.getElementById('index-content');
      if (indexContent) {
        switch (currentIndexType) {
          case 'hymns': indexContent.innerHTML = renderHymnsIndex(); break;
          case 'cfm': indexContent.innerHTML = renderCfmIndex(); break;
          case 'principles': indexContent.innerHTML = renderPrinciplesIndex(); break;
          case 'talks': indexContent.innerHTML = renderTalksIndex(); break;
          case 'announcements': indexContent.innerHTML = renderAnnouncementsIndex(); break;
          case 'meeting-types':
            indexContent.innerHTML = renderMeetingTypesIndex();
            attachMeetingTypeListeners();
            break;
        }
      }
    });
  });

  // Add button
  document.getElementById('add-index-btn')?.addEventListener('click', () => {
    showAddModal(currentIndexType);
  });

  // Import button
  document.getElementById('import-btn')?.addEventListener('click', () => {
    showImportModal(currentIndexType);
  });
}

function showImportModal(indexType: string): void {
  const modal = document.getElementById('import-modal');
  const title = document.getElementById('import-modal-title');
  const body = document.getElementById('import-modal-body');

  if (modal && title && body) {
    title.textContent = `Import ${indexType.charAt(0).toUpperCase() + indexType.slice(1)}`;
    body.innerHTML = renderImportModal(indexType);
    modal.style.display = 'flex';
    attachImportListeners();
  }
}

function showAddModal(indexType: string): void {
  const modal = document.getElementById('add-modal');
  const title = document.getElementById('add-modal-title');
  const body = document.getElementById('add-modal-body');

  const titles: Record<string, string> = {
    hymns: 'Add Hymn',
    cfm: 'Add CFM Lesson',
    principles: 'Add Gospel Principle',
    talks: 'Add Conference Talk'
  };

  if (modal && title && body) {
    title.textContent = titles[indexType] || 'Add Item';
    body.innerHTML = renderAddModal(indexType);
    modal.style.display = 'flex';
    attachAddListeners(indexType);
  }
}

function attachImportListeners(): void {
  document.getElementById('toggle-help')?.addEventListener('click', () => {
    const helpContent = document.getElementById('help-content');
    if (helpContent) {
      helpContent.style.display = helpContent.style.display === 'none' ? 'block' : 'none';
    }
  });

  document.querySelectorAll('.format-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      const selectedFormat = (e.currentTarget as HTMLElement).dataset.format;
      document.querySelectorAll('.format-tab').forEach(t => t.classList.remove('active'));
      (e.currentTarget as HTMLElement).classList.add('active');
      console.log('Selected format:', selectedFormat);
    });
  });

  document.getElementById('import-file')?.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      document.getElementById('file-name')!.textContent = file.name;
    }
  });

  document.getElementById('cancel-import')?.addEventListener('click', closeModals);
  document.getElementById('close-import-modal')?.addEventListener('click', closeModals);

  document.getElementById('preview-import')?.addEventListener('click', () => {
    const data = (document.getElementById('import-data') as HTMLTextAreaElement)?.value;
    if (data) {
      const format = data.trim().startsWith('[') ? 'json' : 'csv';
      const parsed = parseImportData(data, format);
      const preview = document.getElementById('import-preview');
      const content = document.getElementById('preview-content');
      if (preview && content && parsed.length > 0) {
        preview.style.display = 'block';
        content.innerHTML = `<pre>${JSON.stringify(parsed.slice(0, 5), null, 2)}</pre>`;
      }
    }
  });
}

function attachAddListeners(indexType: string): void {
  document.getElementById('cancel-add')?.addEventListener('click', closeModals);
  document.getElementById('close-add-modal')?.addEventListener('click', closeModals);

  // Toggle target date for announcements
  document.getElementById('add-type')?.addEventListener('change', (e) => {
    const group = document.getElementById('target-date-group');
    if (group) group.style.display = (e.target as HTMLSelectElement).value === 'specific' ? 'block' : 'none';
  });

  document.getElementById('confirm-add')?.addEventListener('click', async () => {
    const btn = document.getElementById('confirm-add') as HTMLButtonElement;
    btn.disabled = true;
    btn.textContent = 'Adding...';

    const data: any = {};
    if (indexType === 'announcements') {
      data.content = (document.getElementById('add-content') as HTMLTextAreaElement).value;
      data.type = (document.getElementById('add-type') as HTMLSelectElement).value;
      data.targetDate = (document.getElementById('add-targetDate') as HTMLInputElement).value;
      data.category = (document.getElementById('add-category') as HTMLInputElement).value;
      data.active = true;

      const res = await createAnnouncement(data);
      if (res.success) {
        announcementsCache = []; // Clear cache
        closeModals();
        loadAssignments();
      } else {
        alert('Failed to add announcement');
      }
    } else {
      // Handle other types if needed (placeholders for now)
      console.log('Adding to', indexType);
      closeModals();
    }

    btn.disabled = false;
    btn.textContent = '➕ Confirm Add';
  });
}

function closeModals(): void {
  document.getElementById('import-modal')!.style.display = 'none';
  document.getElementById('add-modal')!.style.display = 'none';
  document.getElementById('edit-modal')!.style.display = 'none';
  // Also remove inline rows
  document.querySelectorAll('.inline-edit-row').forEach(el => el.remove());
}

export function attachAssignmentsListeners(): void {
  // Interactive navigation
  document.getElementById('month-select')?.addEventListener('change', (e) => {
    currentMonth = parseInt((e.target as HTMLSelectElement).value);
    loadAssignments();
  });

  document.getElementById('year-select')?.addEventListener('change', (e) => {
    currentYear = parseInt((e.target as HTMLSelectElement).value);
    loadAssignments();
  });

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

  // Week filter
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      weekFilter = (e.currentTarget as HTMLElement).dataset.filter as any;
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      (e.currentTarget as HTMLElement).classList.add('active');
      loadAssignments();
    });
  });

  // View toggle
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      viewMode = (e.currentTarget as HTMLElement).dataset.view as any;
      document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
      (e.currentTarget as HTMLElement).classList.add('active');
      loadAssignments();
    });
  });

  // Seed data
  document.getElementById('seed-data-btn')?.addEventListener('click', async () => {
    await seedAllData();
    hymnsCache = []; cfmCache = []; principlesCache = []; talksCache = [];
    loadAssignments();
  });

  document.getElementById('seed-btn-inner')?.addEventListener('click', async () => {
    await seedAllData();
    loadAssignments();
  });

  document.getElementById('print-btn')?.addEventListener('click', () => window.print());

  loadAssignments();
}

function updateMonthDisplay(): void {
  const monthSelect = document.getElementById('month-select') as HTMLSelectElement;
  const yearSelect = document.getElementById('year-select') as HTMLSelectElement;
  if (monthSelect) monthSelect.value = currentMonth.toString();
  if (yearSelect) yearSelect.value = currentYear.toString();
}
