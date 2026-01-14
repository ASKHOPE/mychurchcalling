export function renderLoginPage(isLoading: boolean): string {
    return `
    <div class="login-page">
      <div class="login-container glass-container">
        <div class="login-header">
          <div class="logo-large">
            <span class="logo-icon-lg">⚡</span>
          </div>
          <h1>Welcome to Antigravity</h1>
          <p>Sign in to access your workspace</p>
        </div>

        <div class="login-content">
          ${isLoading ? renderLoadingState() : renderLoginButton()}
        </div>

        <div class="login-footer">
          <p>Secured by <strong>WorkOS</strong></p>
          <div class="security-badges">
            <span class="badge">🔒 SSO</span>
            <span class="badge">🛡️ MFA</span>
            <span class="badge">📋 SAML</span>
          </div>
        </div>
      </div>

      <div class="login-background">
        <div class="bg-gradient"></div>
        <div class="bg-grid"></div>
      </div>
    </div>
  `;
}

function renderLoginButton(): string {
    return `
    <button id="workos-login-btn" class="btn-primary btn-large">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Continue with WorkOS
    </button>
    <div class="divider">
      <span>or</span>
    </div>
    <button id="demo-login-btn" class="btn-secondary btn-large">
      <span>🚀</span> Try Demo Mode
    </button>
  `;
}

function renderLoadingState(): string {
    return `
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Authenticating with WorkOS...</p>
    </div>
  `;
}

export function attachLoginListeners(onLogin: () => void): void {
    document.getElementById('workos-login-btn')?.addEventListener('click', onLogin);
    document.getElementById('demo-login-btn')?.addEventListener('click', onLogin);
}
