import { auth } from './auth/workos';
import { renderMenu, attachMenuListeners } from './components/Menu';
import { renderLoginPage, attachLoginListeners } from './pages/Login';
import { renderHomePage } from './pages/Home';
import { renderUsersPage, attachUsersListeners } from './pages/Users';
import { PageRoute, AuthState } from './types';

class App {
  private currentPage: PageRoute = 'home';
  private authState: AuthState;
  private showOtpForm: boolean = false;
  private otpStep: 'phone' | 'verify' = 'phone';
  private currentPhone: string = '';

  constructor() {
    this.authState = auth.getState();

    // Subscribe to auth changes
    auth.subscribe((state) => {
      this.authState = state;
      this.render();
    });
  }

  async init(): Promise<void> {
    // Try to restore existing session
    await auth.restoreSession();
    this.render();
  }

  private render(): void {
    const app = document.querySelector<HTMLDivElement>('#app')!;

    if (!this.authState.isAuthenticated) {
      this.renderLogin(app);
    } else {
      this.renderApp(app);
    }
  }

  private renderLogin(container: HTMLDivElement): void {
    container.innerHTML = renderLoginPage(
      this.authState.isLoading,
      this.authState.isAuthenticated,
      this.showOtpForm,
      this.otpStep
    );
    container.className = 'app-container login-view';

    attachLoginListeners(
      () => auth.login(),
      () => this.showDashboard(),
      () => auth.logout(),
      () => this.handleOtpLogin(),
      (phone) => this.handleSendOtp(phone),
      (code) => this.handleVerifyOtp(code),
      () => this.handleBackToLogin(),
      () => this.handleBackToPhone()
    );
  }

  private handleOtpLogin(): void {
    this.showOtpForm = true;
    this.otpStep = 'phone';
    this.render();
  }

  private handleSendOtp(phone: string): void {
    this.currentPhone = phone;
    // In a real app, you'd call an API to send OTP here
    console.log('📱 Sending OTP to:', phone);
    alert(`Demo Mode: OTP sent to ${phone}\n\nEnter any 6-digit code to continue.`);
    this.otpStep = 'verify';
    this.render();
  }

  private handleVerifyOtp(code: string): void {
    console.log('🔐 Verifying OTP:', code);

    // Demo mode: accept any 6-digit code
    if (code.length === 6) {
      // Create a guest user session
      const guestUser = {
        _id: `guest_${Date.now()}`,
        _creationTime: Date.now(),
        name: 'Guest User',
        email: this.currentPhone,
        picture: null,
        tokenIdentifier: `otp|${this.currentPhone}`,
        role: 'guest' as const,
        lastLoginAt: Date.now(),
      };

      // Store session
      const sessionData = {
        isAuthenticated: true,
        isLoading: false,
        user: guestUser,
        accessToken: `guest_token_${Date.now()}`,
      };

      localStorage.setItem('auth_session', JSON.stringify(sessionData));

      // Reset OTP form state
      this.showOtpForm = false;
      this.otpStep = 'phone';

      // Restore session to update auth state
      auth.restoreSession();
    } else {
      alert('Please enter a valid 6-digit code.');
    }
  }

  private handleBackToLogin(): void {
    this.showOtpForm = false;
    this.otpStep = 'phone';
    this.render();
  }

  private handleBackToPhone(): void {
    this.otpStep = 'phone';
    this.render();
  }

  private showDashboard(): void {
    this.currentPage = 'home';
    const app = document.querySelector<HTMLDivElement>('#app')!;
    this.renderApp(app);
  }

  private renderApp(container: HTMLDivElement): void {
    container.className = 'app-container app-view';

    const menuHtml = renderMenu(
      this.authState.user,
      this.currentPage,
      (page) => this.navigateTo(page),
      () => auth.logout()
    );

    const pageHtml = this.renderCurrentPage();

    container.innerHTML = `
      ${menuHtml}
      <main class="main-content">
        ${pageHtml}
      </main>
    `;

    attachMenuListeners(
      (page) => this.navigateTo(page),
      () => auth.logout()
    );

    // Attach page-specific listeners
    if (this.currentPage === 'users') {
      attachUsersListeners();
    }
  }

  private renderCurrentPage(): string {
    switch (this.currentPage) {
      case 'home':
        return renderHomePage(this.authState.user);
      case 'users':
        return renderUsersPage([]);
      case 'messages':
        return this.renderMessagesPage();
      case 'settings':
        return this.renderSettingsPage();
      default:
        return renderHomePage(this.authState.user);
    }
  }

  private renderMessagesPage(): string {
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

  private renderSettingsPage(): string {
    const user = this.authState.user;
    return `
      <div class="page settings-page">
        <header class="page-header">
          <div>
            <h1>Settings</h1>
            <p class="subtitle">Manage your account and preferences.</p>
          </div>
        </header>
        <div class="settings-grid">
          <div class="card">
            <h3>Profile</h3>
            <div class="profile-section">
              <img src="${user?.picture || ''}" alt="${user?.name}" class="profile-avatar" />
              <div class="profile-info">
                <span class="profile-name">${user?.name}</span>
                <span class="profile-email">${user?.email}</span>
                <span class="profile-role">${user?.role}</span>
              </div>
            </div>
          </div>
          <div class="card">
            <h3>Security</h3>
            <div class="setting-row">
              <div class="setting-info">
                <span class="setting-label">Two-Factor Authentication</span>
                <span class="setting-desc">Add an extra layer of security</span>
              </div>
              <button class="btn-secondary">Enable</button>
            </div>
            <div class="setting-row">
              <div class="setting-info">
                <span class="setting-label">Active Sessions</span>
                <span class="setting-desc">Manage devices where you're logged in</span>
              </div>
              <button class="btn-secondary">View</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private navigateTo(page: PageRoute): void {
    this.currentPage = page;
    this.render();
  }
}

// Initialize the app
const app = new App();
app.init();
