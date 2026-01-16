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
import { renderAssignmentsPage, attachAssignmentsListeners } from './pages/Assignments';
import { renderActivitiesPage, attachActivitiesListeners } from './pages/Activities';
import { renderCleaningPage, attachCleaningListeners } from './pages/Cleaning';
import type { PageRoute, AuthState } from '../../shared/types';

import './index.css';
import './styles.css';
import './styles/base.css';
import './styles/components.css';
import './styles/pages.css';
import './styles/animations.css';
import './styles/assignments.css';

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
      () => auth.login(),
      () => this.showDashboard(),
      () => this.handleLogout(),
      () => { this.showLocalForm = true; this.localStep = 'login'; this.loginError = ''; this.render(); },
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
      async (name, username, password, email) => {
        const result = await localRegister(username, password, name, email);
        if (result.success) {
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
      () => { this.showLocalForm = false; this.loginError = ''; this.render(); },
      () => { this.localStep = 'register'; this.loginError = ''; this.render(); },
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
    if (this.currentPage === 'assignments') attachAssignmentsListeners();
    if (this.currentPage === 'activities') attachActivitiesListeners();
    if (this.currentPage === 'cleaning') attachCleaningListeners();
  }

  private renderCurrentPage(): string {
    switch (this.currentPage) {
      case 'home': return renderHomePage(this.authState.user);
      case 'activities': return renderActivitiesPage();
      case 'assignments': return renderAssignmentsPage();
      case 'cleaning': return renderCleaningPage();
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
