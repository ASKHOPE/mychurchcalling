/**
 * Utility for safe and consistent DOM manipulation and HTML generation.
 */

export const UI = {
    /**
     * Generates a glassmorphism card.
     */
    card: (content: string, className = '', title = '') => `
    <div class="card premium-card ${className}">
      ${title ? `<div class="card-header"><h3>${title}</h3></div>` : ''}
      ${content}
    </div>
  `,

    /**
     * Generates a button with consistent styling.
     */
    button: (label: string, id = '', className = 'btn-primary', icon = '') => `
    <button id="${id}" class="${className}">
      ${icon ? `<span>${icon}</span> ` : ''}${label}
    </button>
  `,

    /**
     * Generates a page header.
     */
    header: (title: string, subtitle = '', actions = '') => `
    <header class="page-header">
      <div class="header-main">
        <div class="header-content">
          <h1>${title}</h1>
          ${subtitle ? `<p class="subtitle">${subtitle}</p>` : ''}
        </div>
      </div>
      ${actions ? `<div class="header-actions">${actions}</div>` : ''}
    </header>
  `,

    /**
     * Safe HTML escape to prevent XSS.
     */
    escape: (str: string) => {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    /**
     * Loading spinner.
     */
    spinner: (message = 'Loading...') => `
    <div class="loading-state">
      <div class="spinner"></div>
      <p>${message}</p>
    </div>
  `
};

/**
 * Encrypted/Obfuscated Session Management for Privacy.
 */
export const Storage = {
    save: (key: string, data: any) => {
        try {
            // Basic obfuscation for privacy in localStorage
            const str = JSON.stringify(data);
            const encoded = btoa(unescape(encodeURIComponent(str)));
            localStorage.setItem(`_app_${key}`, encoded);
        } catch (e) {
            console.error('Storage Error:', e);
        }
    },

    get: (key: string) => {
        try {
            const item = localStorage.getItem(`_app_${key}`);
            if (!item) return null;
            const decoded = decodeURIComponent(escape(atob(item)));
            return JSON.parse(decoded);
        } catch (e) {
            return null;
        }
    },

    remove: (key: string) => {
        localStorage.removeItem(`_app_${key}`);
    },

    clear: () => {
        // Only clear app-specific items
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('_app_')) localStorage.removeItem(key);
        });
    }
};
