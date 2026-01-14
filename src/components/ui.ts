export function AuthHeader(name: string = "Guest") {
    return `
    <div class="auth-header">
      <p>Welcome, <strong>${name}</strong></p>
    </div>
  `;
}

export function MessageItem(body: string, author: string) {
    return `
    <div class="message-item" style="margin-top: 10px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 5px;">
      <span style="color: var(--text-muted); font-size: 0.8rem;">${author}:</span>
      <p style="margin: 0; font-size: 1rem;">${body}</p>
    </div>
  `;
}
