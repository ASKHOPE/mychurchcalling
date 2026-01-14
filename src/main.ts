import { auth } from './auth/workos';
import { OTPAuth } from './auth/otp';
import { renderMenu, attachMenuListeners } from './components/Menu';
import { renderLoginPage, attachLoginListeners } from './pages/Login';
import { renderHomePage } from './pages/Home';
import { renderUsersPage, attachUsersListeners } from './pages/Users';
import { renderAlertsPage } from './pages/Alerts';
import { renderMessagesPage } from './pages/Messages';
import { renderSettingsPage } from './pages/Settings';
import { renderLogsPage, loadLogs } from './pages/Logs';
import { renderBinPage, attachBinListeners, loadBin } from './pages/Bin';
import { PageRoute, AuthState } from './types';

class App {
  private currentPage: PageRoute = 'home';
  private authState: AuthState;
  private showOtpForm: boolean = false;
  private otpStep: 'phone' | 'verify' = 'phone';
  private currentPhone: string = '';

  constructor() {
    this.authState = auth.getState();
    auth.subscribe((state) => {
      this.authState = state;
      this.render();
    });
  }

  async init(): Promise<void> {
    await auth.restoreSession();
    this.render();
  }

  private render(): void {
    const app = document.querySelector<HTMLDivElement>('#app')!;
    const role = this.authState.user?.role || 'guest';
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
      () => { this.showOtpForm = true; this.otpStep = 'phone'; this.render(); },
      async (phone) => {
        this.currentPhone = phone;
        if (await OTPAuth.sendOtp(phone)) { this.otpStep = 'verify'; this.render(); }
      },
      async (code) => {
        if (await OTPAuth.verifyOtp(code, this.currentPhone)) {
          this.showOtpForm = false; this.otpStep = 'phone';
        }
      },
      () => { this.showOtpForm = false; this.render(); },
      () => { this.otpStep = 'phone'; this.render(); }
    );
  }

  private showDashboard(): void {
    this.currentPage = 'home';
    this.render();
  }

  private renderApp(container: HTMLDivElement): void {
    container.className = 'app-container app-view';
    const menuHtml = renderMenu(this.authState.user, this.currentPage, (p) => this.navigateTo(p), () => auth.logout());
    const pageHtml = this.renderCurrentPage();

    container.innerHTML = `
      ${menuHtml}
      <main class="main-content">${pageHtml}</main>
    `;

    attachMenuListeners((p) => this.navigateTo(p), () => auth.logout());

    // Initialize listeners/loaders for specific pages
    if (this.currentPage === 'users') attachUsersListeners();
    if (this.currentPage === 'bin') { loadBin(); attachBinListeners(); }
    if (this.currentPage === 'logs') loadLogs();
  }

  private renderCurrentPage(): string {
    switch (this.currentPage) {
      case 'home': return renderHomePage(this.authState.user);
      case 'users': return renderUsersPage([]);
      case 'bin': return renderBinPage([]);
      case 'logs': return renderLogsPage([]);
      case 'alerts': return renderAlertsPage();
      case 'messages': return renderMessagesPage();
      case 'settings': return renderSettingsPage(this.authState.user);
      default: return renderHomePage(this.authState.user);
    }
  }

  private navigateTo(page: PageRoute): void {
    this.currentPage = page;
    this.render();
  }
}

const app = new App();
app.init();
