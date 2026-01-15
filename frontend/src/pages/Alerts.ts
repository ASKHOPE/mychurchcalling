export function renderAlertsPage(): string {
    return `
    <div class="page alerts-page">
      <header class="page-header">
        <div>
          <h1>System Alerts</h1>
          <p class="subtitle">Real-time notifications and system status.</p>
        </div>
      </header>
      <div class="card premium-card">
         <div class="activity-list">
           <li class="activity-item">
              <span class="activity-icon">⚠️</span>
              <div class="activity-content">
                <span class="activity-text"><strong>High Priority:</strong> 3 callings are overdue for renewal</span>
                <span class="activity-time">Now</span>
              </div>
           </li>
           <li class="activity-item">
              <span class="activity-icon">ℹ️</span>
              <div class="activity-content">
                <span class="activity-text">Weekly backup completed successfully</span>
                <span class="activity-time">2 hours ago</span>
              </div>
           </li>
         </div>
      </div>
    </div>
  `;
}
