/**
 * Gestionnaire de thème pour toutes les pages
 * Gère le changement de thème sur les pages d'accueil et à propos
 */
class ThemeHandler {
    constructor() {
        this.currentTheme = localStorage.getItem('markdown-previewer-theme') || 'light';
        this.initializeTheme();
        this.bindEvents();
    }

    /**
     * Initialise le thème au chargement de la page
     */
    initializeTheme() {
        this.applyTheme(this.currentTheme);
    }

    /**
     * Lie les événements aux boutons de thème
     */
    bindEvents() {
        // Bouton de thème desktop
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        // Bouton de thème mobile
        const themeToggleMobile = document.getElementById('themeToggleMobile');
        if (themeToggleMobile) {
            themeToggleMobile.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
    }

    /**
     * Bascule entre les thèmes clair et sombre
     */
    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(this.currentTheme);
        localStorage.setItem('markdown-previewer-theme', this.currentTheme);
        
        const themeName = this.currentTheme === 'dark' ? 'Thème sombre' : 'Thème clair';
        this.showNotification(`${themeName} appliqué`, 'success');
    }

    /**
     * Applique le thème spécifié
     */
    applyTheme(theme) {
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            this.updateThemeIcons('🌞');
        } else {
            document.documentElement.removeAttribute('data-theme');
            this.updateThemeIcons('🌙');
        }
    }

    /**
     * Met à jour les icônes de thème
     */
    updateThemeIcons(icon) {
        const themeIcons = document.querySelectorAll('.theme-icon, .theme-icon-mobile');
        themeIcons.forEach(iconElement => {
            iconElement.textContent = icon;
        });
    }

    /**
     * Affiche une notification
     */
    showNotification(message, type = 'info') {
        // Vérifier si une notification existe déjà
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Animation d'entrée
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Suppression automatique
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Initialisation du gestionnaire de thème quand le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    new ThemeHandler();
});

