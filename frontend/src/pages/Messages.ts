export function renderMessagesPage(): string {
    return `
    <div class="page messages-page">
      <header class="page-header">
        <div>
          <h1>Messages</h1>
          <p class="subtitle">Communicate with your team in real-time.</p>
        </div>
      </header>
      <div class="card">
        <div class="empty-state">
          <span class="empty-icon">💬</span>
          <h3>No messages yet</h3>
          <p>Start a conversation with your team.</p>
          <button class="btn-primary">New Message</button>
        </div>
      </div>
    </div>
  `;
}
