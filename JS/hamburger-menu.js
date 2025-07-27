/**
 * Gestionnaire du menu hamburger responsive
 * Gère l'ouverture/fermeture du menu mobile et les interactions
 */
class HamburgerMenu {
    constructor() {
        this.hamburgerBtn = null;
        this.mobileNav = null;
        this.overlay = null;
        this.themeToggleMobile = null;
        this.themeIconMobile = null;
        this.isOpen = false;
        
        this.init();
    }

    /**
     * Initialise le menu hamburger
     */
    init() {
        // Attendre que le DOM soit chargé
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupElements());
        } else {
            this.setupElements();
        }
    }

    /**
     * Configure les éléments et événements
     */
    setupElements() {
        this.hamburgerBtn = document.getElementById('hamburgerMenu');
        this.mobileNav = document.getElementById('mobileNav');
        this.themeToggleMobile = document.getElementById('themeToggleMobile');
        this.themeIconMobile = document.querySelector('.theme-icon-mobile');

        if (!this.hamburgerBtn || !this.mobileNav) {
            return; // Éléments non trouvés, probablement pas sur une page avec menu hamburger
        }

        this.createOverlay();
        this.bindEvents();
        this.syncThemeWithMobile();
    }

    /**
     * Crée l'overlay pour fermer le menu
     */
    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'mobile-nav-overlay';
        this.overlay.id = 'mobileNavOverlay';
        document.body.appendChild(this.overlay);
    }

    /**
     * Lie les événements
     */
    bindEvents() {
        // Bouton hamburger
        this.hamburgerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });

        // Overlay pour fermer
        this.overlay.addEventListener('click', () => {
            this.close();
        });

        // Fermer avec Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });

        // Bouton de thème mobile
        if (this.themeToggleMobile) {
            this.themeToggleMobile.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        // Fermer le menu lors du redimensionnement vers desktop
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768 && this.isOpen) {
                this.close();
            }
        });

        // Synchroniser avec le bouton de thème principal
        const mainThemeToggle = document.getElementById('themeToggle');
        if (mainThemeToggle) {
            mainThemeToggle.addEventListener('click', () => {
                setTimeout(() => this.syncThemeWithMobile(), 100);
            });
        }

        // Fermer le menu quand on clique sur un lien de navigation
        const navLinks = this.mobileNav.querySelectorAll('a.mobile-nav-item');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                this.close();
            });
        });
    }

    /**
     * Bascule l'état du menu
     */
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    /**
     * Ouvre le menu
     */
    open() {
        this.isOpen = true;
        this.hamburgerBtn.classList.add('active');
        this.mobileNav.classList.add('active');
        this.overlay.classList.add('active');
        document.body.classList.add('mobile-nav-open');
        
        // Focus sur le premier élément du menu pour l'accessibilité
        const firstNavItem = this.mobileNav.querySelector('.mobile-nav-item');
        if (firstNavItem) {
            setTimeout(() => firstNavItem.focus(), 300);
        }
    }

    /**
     * Ferme le menu
     */
    close() {
        this.isOpen = false;
        this.hamburgerBtn.classList.remove('active');
        this.mobileNav.classList.remove('active');
        this.overlay.classList.remove('active');
        document.body.classList.remove('mobile-nav-open');
        
        // Remettre le focus sur le bouton hamburger
        this.hamburgerBtn.focus();
    }

    /**
     * Bascule le thème depuis le menu mobile
     */
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        // Appliquer le nouveau thème
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('markdown-previewer-theme', newTheme);
        
        // Mettre à jour les icônes
        this.updateThemeIcons(newTheme);
        
        // Fermer le menu après changement de thème
        setTimeout(() => this.close(), 300);
    }

    /**
     * Met à jour les icônes de thème
     */
    updateThemeIcons(theme) {
        const icon = theme === 'dark' ? '🌞' : '🌙';
        
        // Icône du menu mobile
        if (this.themeIconMobile) {
            this.themeIconMobile.textContent = icon;
        }
        
        // Icône du bouton principal
        const mainThemeIcon = document.querySelector('.theme-icon');
        if (mainThemeIcon) {
            mainThemeIcon.textContent = icon;
        }
    }

    /**
     * Synchronise le thème avec le menu mobile
     */
    syncThemeWithMobile() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        this.updateThemeIcons(currentTheme);
    }

    /**
     * Met à jour l'élément actif dans le menu mobile
     */
    updateActiveNavItem(currentPage) {
        const navItems = this.mobileNav.querySelectorAll('.mobile-nav-item');
        navItems.forEach(item => {
            item.classList.remove('active');
            const href = item.getAttribute('href');
            if (href && (href === currentPage || 
                (currentPage === '/' && href === 'index.html') ||
                (currentPage === '/index.html' && href === 'index.html'))) {
                item.classList.add('active');
            }
        });
    }
}

// Initialiser le menu hamburger
const hamburgerMenu = new HamburgerMenu();

// Fonction utilitaire pour mettre à jour la page active
function updateActiveNavigation() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    if (hamburgerMenu && hamburgerMenu.mobileNav) {
        hamburgerMenu.updateActiveNavItem(currentPage);
    }
}

// Mettre à jour la navigation active au chargement
document.addEventListener('DOMContentLoaded', updateActiveNavigation);

