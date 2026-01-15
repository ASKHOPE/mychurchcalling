import { UI } from '../utils/core';

export function renderLoginPage(
  isLoading: boolean,
  isAuthenticated: boolean = false,
  showLocalForm: boolean = false,
  localStep: 'login' | 'register' = 'login',
  loginError: string = ''
): string {
  return `
    <div class="login-page">
      <div class="login-container glass-container">
        <div class="login-header">
          <div class="logo-large">
            <span class="logo-icon-lg">⛪</span>
          </div>
          <h1>MyChurchCalling</h1>
          <p>${isAuthenticated ? 'Welcome back!' : 'Sign in to manage your church callings'}</p>
        </div>

        <div class="login-content">
          ${isLoading ? UI.spinner('Authenticating...') :
      isAuthenticated ? renderDashboardButton() :
        showLocalForm ? renderLocalForm(localStep, loginError) :
          renderLoginOptions()}
        </div>

        <div class="login-footer">
          <p>Secured by <strong>WorkOS</strong> & <strong>Convex</strong></p>
          <div class="security-badges">
            <span class="badge">🔒 SSO</span>
            <span class="badge">🛡️ Encrypted</span>
            <span class="badge">👤 Local Auth</span>
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

function renderLoginOptions(): string {
  return `
    ${UI.button('Sign In with WorkOS', 'workos-login-btn', 'btn-primary btn-large', '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>')}
    
    <div class="divider"><span>or</span></div>
    
    ${UI.button('Login with Username', 'local-login-btn', 'btn-secondary btn-large', '👤')}
  `;
}

function renderLocalForm(step: 'login' | 'register', error: string): string {
  if (step === 'login') {
    return `
      <div class="local-form">
        <h3>👤 Username Login</h3>
        ${error ? `<div class="error-message">${UI.escape(error)}</div>` : ''}
        <div class="form-group">
          <label for="username-input">Username</label>
          <input type="text" id="username-input" class="input-glass" placeholder="Enter username" autocomplete="username" />
        </div>
        <div class="form-group">
          <label for="password-input">Password</label>
          <input type="password" id="password-input" class="input-glass" placeholder="Enter password" autocomplete="current-password" />
        </div>
        ${UI.button('Sign In', 'submit-login-btn', 'btn-primary btn-large')}
        <div class="form-links">
          <button id="show-register-btn" class="btn-text">Don't have an account? Register</button>
          <button id="back-to-options-btn" class="btn-text">← Back to login options</button>
        </div>
      </div>
    `;
  } else {
    return `
      <div class="local-form">
        <h3>✨ Create Account</h3>
        ${error ? `<div class="error-message">${UI.escape(error)}</div>` : ''}
        <div class="form-group">
          <label for="reg-name-input">Full Name</label>
          <input type="text" id="reg-name-input" class="input-glass" placeholder="John Doe" />
        </div>
        <div class="form-group">
          <label for="reg-username-input">Username</label>
          <input type="text" id="reg-username-input" class="input-glass" placeholder="johndoe" autocomplete="username" />
        </div>
        <div class="form-group">
          <label for="reg-email-input">Email (optional)</label>
          <input type="email" id="reg-email-input" class="input-glass" placeholder="john@example.com" />
        </div>
        <div class="form-group">
          <label for="reg-password-input">Password</label>
          <input type="password" id="reg-password-input" class="input-glass" placeholder="Choose a password" autocomplete="new-password" />
        </div>
        ${UI.button('Create Account', 'submit-register-btn', 'btn-primary btn-large')}
        <div class="form-links">
          <button id="show-login-btn" class="btn-text">Already have an account? Sign In</button>
          <button id="back-to-options-btn" class="btn-text">← Back to login options</button>
        </div>
      </div>
    `;
  }
}

function renderDashboardButton(): string {
  return `
    ${UI.button('Continue to Dashboard', 'continue-dashboard-btn', 'btn-primary btn-large', '🏠')}
    <div style="margin-top: 1rem;">
      ${UI.button('Sign Out', 'logout-btn', 'btn-secondary btn-large', '🚪')}
    </div>
  `;
}

export function attachLoginListeners(
  onWorkosLogin: () => void,
  onContinue?: () => void,
  onLogout?: () => void,
  onShowLocalForm?: () => void,
  onLocalLogin?: (username: string, password: string) => void,
  onLocalRegister?: (name: string, username: string, password: string, email?: string) => void,
  onBackToOptions?: () => void,
  onShowRegister?: () => void,
  onShowLogin?: () => void
): void {
  document.getElementById('workos-login-btn')?.addEventListener('click', onWorkosLogin);
  document.getElementById('continue-dashboard-btn')?.addEventListener('click', () => onContinue?.());
  document.getElementById('logout-btn')?.addEventListener('click', () => onLogout?.());
  document.getElementById('local-login-btn')?.addEventListener('click', () => onShowLocalForm?.());
  document.getElementById('back-to-options-btn')?.addEventListener('click', () => onBackToOptions?.());
  document.getElementById('show-register-btn')?.addEventListener('click', () => onShowRegister?.());
  document.getElementById('show-login-btn')?.addEventListener('click', () => onShowLogin?.());

  document.getElementById('submit-login-btn')?.addEventListener('click', () => {
    const username = (document.getElementById('username-input') as HTMLInputElement)?.value;
    const password = (document.getElementById('password-input') as HTMLInputElement)?.value;
    if (username && password) onLocalLogin?.(username, password);
  });

  document.getElementById('submit-register-btn')?.addEventListener('click', () => {
    const name = (document.getElementById('reg-name-input') as HTMLInputElement)?.value;
    const username = (document.getElementById('reg-username-input') as HTMLInputElement)?.value;
    const password = (document.getElementById('reg-password-input') as HTMLInputElement)?.value;
    const email = (document.getElementById('reg-email-input') as HTMLInputElement)?.value;
    if (name && username && password) onLocalRegister?.(name, username, password, email || undefined);
  });

  // Allow Enter key to submit
  document.getElementById('password-input')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('submit-login-btn')?.click();
    }
  });

  document.getElementById('reg-password-input')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('submit-register-btn')?.click();
    }
  });
}
