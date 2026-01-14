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
    const role = this.authState.user?.role || 'guest';

    // Set role attribute for CSS targeting
    app.setAttribute('data-user-role', role);

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
    console.log('📱 Sending OTP to:', phone);
    alert(`Demo Mode: OTP sent to ${phone}\n\nEnter any 6-digit code to continue.`);
    this.otpStep = 'verify';
    this.render();
  }

  private handleVerifyOtp(code: string): void {
    if (code.length === 6) {
      const guestUser = {
        _id: `guest_${Date.now()}`,
        _creationTime: Date.now(),
        name: 'Guest User',
        email: this.currentPhone,
        picture: null,
        tokenIdentifier: `otp|${this.currentPhone}`,
        role: 'member' as const, // Default role for guest OTP
        lastLoginAt: Date.now(),
      };

      const sessionData = {
        isAuthenticated: true,
        isLoading: false,
        user: guestUser,
        accessToken: `guest_token_${Date.now()}`,
      };

      localStorage.setItem('auth_session', JSON.stringify(sessionData));
      this.showOtpForm = false;
      this.otpStep = 'phone';
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
      case 'alerts':
        return this.renderAlertsPage();
      case 'messages':
        return this.renderMessagesPage();
      case 'settings':
        return this.renderSettingsPage();
      default:
        return renderHomePage(this.authState.user);
    }
  }

  private renderAlertsPage(): string {
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
          <div class="card premium-card">
            <h3>Profile</h3>
            <div class="profile-section">
              <img src="${user?.picture || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user?.name}" alt="${user?.name}" class="profile-avatar" />
              <div class="profile-info">
                <span class="profile-name">${user?.name}</span>
                <span class="profile-email">${user?.email}</span>
                <span class="profile-role">${user?.role}</span>
              </div>
            </div>
          </div>
          <div class="card premium-card admin-only">
            <h3>Unit Configuration</h3>
            <p class="subtitle">Exclusive admin tools for unit management.</p>
            <div class="setting-row">
              <div class="setting-info">
                <span class="setting-label">Organization Name</span>
                <span class="setting-desc">Change the display name for this unit</span>
              </div>
              <button class="btn-secondary">Edit</button>
            </div>
          </div>
          <div class="card premium-card">
            <h3>Security</h3>
            <div class="setting-row">
              <div class="setting-info">
                <span class="setting-label">Two-Factor Authentication</span>
                <span class="setting-desc">Add an extra layer of security</span>
              </div>
              <button class="btn-secondary">Enable</button>
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

const app = new App();
app.init();
