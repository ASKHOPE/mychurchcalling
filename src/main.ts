import { auth } from './auth/workos';
import { localLogin, localRegister, setLocalSession, getLocalSession, clearLocalSession } from './auth/local';
import { renderMenu, attachMenuListeners } from './components/Menu';
import { renderLoginPage, attachLoginListeners } from './pages/Login';
import { renderHomePage } from './pages/Home';
import { renderUsersPage, attachUsersListeners } from './pages/Users';
import { renderAlertsPage } from './pages/Alerts';
import { renderMessagesPage } from './pages/Messages';
import { renderConfigPage, attachConfigListeners } from './pages/Config';
import { renderLogsPage, loadLogs } from './pages/Logs';
import { renderBinPage, attachBinListeners, loadBin } from './pages/Bin';
import { PageRoute, AuthState } from './types';

class App {
  private currentPage: PageRoute = 'home';
  private authState: AuthState;
  private showLocalForm: boolean = false;
  private localStep: 'login' | 'register' = 'login';
  private loginError: string = '';

  constructor() {
    this.authState = auth.getState();
    auth.subscribe((state) => {
      this.authState = state;
      this.render();
    });
  }

  async init(): Promise<void> {
    // Check for local session first
    const localSession = getLocalSession();
    if (localSession) {
      this.authState = localSession;
      this.render();
      return;
    }

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
      this.showLocalForm,
      this.localStep,
      this.loginError
    );
    container.className = 'app-container login-view';

    attachLoginListeners(
      // WorkOS Login
      () => auth.login(),
      // Continue to Dashboard
      () => this.showDashboard(),
      // Logout
      () => this.handleLogout(),
      // Show local form
      () => { this.showLocalForm = true; this.localStep = 'login'; this.loginError = ''; this.render(); },
      // Local Login
      async (username, password) => {
        const result = await localLogin(username, password);
        if (result.success && result.user) {
          setLocalSession(result.user);
          this.authState = getLocalSession()!;
          this.showLocalForm = false;
          this.loginError = '';
          this.render();
        } else {
          this.loginError = result.error || 'Login failed';
          this.render();
        }
      },
      // Local Register
      async (name, username, password, email) => {
        const result = await localRegister(username, password, name, email);
        if (result.success) {
          // Auto-login after registration
          const loginResult = await localLogin(username, password);
          if (loginResult.success && loginResult.user) {
            setLocalSession(loginResult.user);
            this.authState = getLocalSession()!;
            this.showLocalForm = false;
            this.render();
          }
        } else {
          this.loginError = result.error || 'Registration failed';
          this.render();
        }
      },
      // Back to options
      () => { this.showLocalForm = false; this.loginError = ''; this.render(); },
      // Show register
      () => { this.localStep = 'register'; this.loginError = ''; this.render(); },
      // Show login
      () => { this.localStep = 'login'; this.loginError = ''; this.render(); }
    );
  }

  private handleLogout(): void {
    clearLocalSession();
    auth.logout();
  }

  private showDashboard(): void {
    this.currentPage = 'home';
    this.render();
  }

  private renderApp(container: HTMLDivElement): void {
    container.className = 'app-container app-view';
    const menuHtml = renderMenu(this.authState.user, this.currentPage, (p) => this.navigateTo(p), () => this.handleLogout());
    const pageHtml = this.renderCurrentPage();

    container.innerHTML = `
      ${menuHtml}
      <main class="main-content">${pageHtml}</main>
    `;

    attachMenuListeners((p) => this.navigateTo(p), () => this.handleLogout());

    // Page-specific initialization
    if (this.currentPage === 'users') attachUsersListeners(() => this.navigateTo('settings'));
    if (this.currentPage === 'settings') attachConfigListeners();
    if (this.currentPage === 'bin') { loadBin(); attachBinListeners(); }
    if (this.currentPage === 'logs') loadLogs();
  }

  private renderCurrentPage(): string {
    switch (this.currentPage) {
      case 'home': return renderHomePage(this.authState.user);
      case 'users': return renderUsersPage([]);
      case 'settings': return renderConfigPage();
      case 'bin': return renderBinPage([]);
      case 'logs': return renderLogsPage([]);
      case 'alerts': return renderAlertsPage();
      case 'messages': return renderMessagesPage();
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
