export function renderLoginPage(isLoading: boolean, isAuthenticated: boolean = false, showOtpForm: boolean = false, otpStep: 'phone' | 'verify' = 'phone'): string {
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
          ${isLoading ? renderLoadingState() :
      isAuthenticated ? renderDashboardButton() :
        showOtpForm ? renderOtpForm(otpStep) :
          renderLoginButton()}
        </div>

        <div class="login-footer">
          <p>Secured by <strong>WorkOS</strong></p>
          <div class="security-badges">
            <span class="badge">🔒 SSO</span>
            <span class="badge">🛡️ MFA</span>
            <span class="badge">� OTP</span>
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
      Sign In
    </button>
    <div class="divider">
      <span>or</span>
    </div>
    <button id="workos-signup-btn" class="btn-secondary btn-large">
      <span>✨</span>
      Create Account
    </button>
    <div class="divider">
      <span>guest access</span>
    </div>
    <button id="otp-login-btn" class="btn-outline btn-large">
      <span>📱</span>
      Login with Phone OTP
    </button>
  `;
}

function renderOtpForm(step: 'phone' | 'verify'): string {
  if (step === 'phone') {
    return `
      <div class="otp-form">
        <h3>📱 Phone Login</h3>
        <p class="otp-subtitle">Enter your phone number to receive a verification code</p>
        <div class="input-group">
          <input 
            type="tel" 
            id="phone-input" 
            class="input-field" 
            placeholder="+1 (555) 123-4567"
            autocomplete="tel"
          />
        </div>
        <button id="send-otp-btn" class="btn-primary btn-large">
          Send Verification Code
        </button>
        <button id="back-to-login-btn" class="btn-text">
          ← Back to login options
        </button>
      </div>
    `;
  } else {
    return `
      <div class="otp-form">
        <h3>🔐 Enter Verification Code</h3>
        <p class="otp-subtitle">We sent a 6-digit code to your phone</p>
        <div class="otp-inputs">
          <input type="text" maxlength="1" class="otp-digit" data-index="0" />
          <input type="text" maxlength="1" class="otp-digit" data-index="1" />
          <input type="text" maxlength="1" class="otp-digit" data-index="2" />
          <input type="text" maxlength="1" class="otp-digit" data-index="3" />
          <input type="text" maxlength="1" class="otp-digit" data-index="4" />
          <input type="text" maxlength="1" class="otp-digit" data-index="5" />
        </div>
        <button id="verify-otp-btn" class="btn-primary btn-large">
          Verify & Sign In
        </button>
        <button id="resend-otp-btn" class="btn-text">
          Didn't receive code? Resend
        </button>
        <button id="back-to-phone-btn" class="btn-text">
          ← Change phone number
        </button>
      </div>
    `;
  }
}

function renderDashboardButton(): string {
  return `
    <button id="continue-dashboard-btn" class="btn-primary btn-large">
      <span>🏠</span>
      Continue to Dashboard
    </button>
    <button id="logout-btn" class="btn-secondary btn-large" style="margin-top: 1rem;">
      <span>🚪</span>
      Sign Out
    </button>
  `;
}

function renderLoadingState(): string {
  return `
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Authenticating...</p>
    </div>
  `;
}

export function attachLoginListeners(
  onLogin: () => void,
  onContinue?: () => void,
  onLogout?: () => void,
  onOtpLogin?: () => void,
  onSendOtp?: (phone: string) => void,
  onVerifyOtp?: (code: string) => void,
  onBackToLogin?: () => void,
  onBackToPhone?: () => void
): void {
  // WorkOS login buttons
  document.getElementById('workos-login-btn')?.addEventListener('click', onLogin);
  document.getElementById('workos-signup-btn')?.addEventListener('click', onLogin);

  // Dashboard buttons
  document.getElementById('continue-dashboard-btn')?.addEventListener('click', () => {
    if (onContinue) onContinue();
  });

  document.getElementById('logout-btn')?.addEventListener('click', () => {
    if (onLogout) onLogout();
  });

  // OTP login buttons
  document.getElementById('otp-login-btn')?.addEventListener('click', () => {
    if (onOtpLogin) onOtpLogin();
  });

  document.getElementById('send-otp-btn')?.addEventListener('click', () => {
    const phone = (document.getElementById('phone-input') as HTMLInputElement)?.value;
    if (onSendOtp && phone) onSendOtp(phone);
  });

  document.getElementById('verify-otp-btn')?.addEventListener('click', () => {
    const digits = document.querySelectorAll('.otp-digit');
    const code = Array.from(digits).map((d) => (d as HTMLInputElement).value).join('');
    if (onVerifyOtp && code.length === 6) onVerifyOtp(code);
  });

  document.getElementById('back-to-login-btn')?.addEventListener('click', () => {
    if (onBackToLogin) onBackToLogin();
  });

  document.getElementById('back-to-phone-btn')?.addEventListener('click', () => {
    if (onBackToPhone) onBackToPhone();
  });

  document.getElementById('resend-otp-btn')?.addEventListener('click', () => {
    // Could trigger resend logic
    alert('OTP resent! (Demo mode)');
  });

  // Auto-focus next OTP digit
  setupOtpInputs();
}

function setupOtpInputs(): void {
  const digits = document.querySelectorAll('.otp-digit');
  digits.forEach((digit, index) => {
    digit.addEventListener('input', (e) => {
      const input = e.target as HTMLInputElement;
      if (input.value.length === 1 && index < digits.length - 1) {
        (digits[index + 1] as HTMLInputElement).focus();
      }
    });

    digit.addEventListener('keydown', (e) => {
      const key = (e as KeyboardEvent).key;
      if (key === 'Backspace' && (digit as HTMLInputElement).value === '' && index > 0) {
        (digits[index - 1] as HTMLInputElement).focus();
      }
    });
  });
}
