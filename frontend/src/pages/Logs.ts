import { fetchAuditLogs } from '../api/users';
import { UI } from '../utils/core';

export function renderLogsPage(logs: any[] = []): string {
    return `
      <div class="page logs-page">
        ${UI.header('System Change Log', 'Track all administrative changes and system events.')}
        
        <div class="card premium-card">
          <div class="timeline">
            ${logs.length > 0 ? logs.map(renderLogItem).join('') : '<p class="empty-state">No events logged yet.</p>'}
          </div>
        </div>
      </div>
    `;
}

function renderLogItem(log: any): string {
    const date = new Date(log.timestamp).toLocaleString();
    return `
      <div class="timeline-item">
        <div class="timeline-marker"></div>
        <div class="timeline-content">
          <div class="timeline-header">
            <span class="log-action">${UI.escape(log.action)}</span>
            <span class="log-time">${date}</span>
          </div>
          <p class="log-desc">${UI.escape(log.description)}</p>
          <div class="log-meta">
            <span class="actor">By: ${UI.escape(log.actor)}</span>
            <span class="target">Target: ${UI.escape(log.target)}</span>
          </div>
        </div>
      </div>
    `;
}

export async function loadLogs(): Promise<void> {
    const logs = await fetchAuditLogs();
    const container = document.querySelector('.timeline');
    if (container) {
        container.innerHTML = logs.length > 0 ? logs.map(renderLogItem).join('') : '<p class="empty-state">No events logged yet.</p>';
    }
}
