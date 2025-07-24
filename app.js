/**
 BIENVENUE DANS LE PARSEUR MARKDOWN
 Ah vous de comprendre ce qui est là 😀 souffrance et maux de tete
 */
class MarkdownPreviewerApp {
    constructor() {
        this.parser = new MarkdownParser();
        this.syncScroll = true;
        this.currentLayout = 'split'; // split, vertical, editor-only, preview-only
        
        this.initializeElements();
        this.bindEvents();
        this.loadInitialContent();
        this.updatePreview();
    }

    /**
     * Initialise les références aux éléments DOM
     */
    initializeElements() {
        this.markdownInput = document.getElementById('markdownInput');
        this.markdownPreview = document.getElementById('markdownPreview');
        this.wordCount = document.getElementById('wordCount');
        this.toggleLayoutBtn = document.getElementById('toggleLayout');
        this.exportHtmlBtn = document.getElementById('exportHtml');
        this.clearAllBtn = document.getElementById('clearAll');
        this.syncScrollBtn = document.getElementById('syncScroll');
        this.editorContainer = document.querySelector('.editor-container');
        this.app = document.querySelector('.app');
    }

    /**
     * Lie les événements aux éléments
     */
    bindEvents() {
        // Événement de saisie en temps réel
        this.markdownInput.addEventListener('input', () => {
            this.updatePreview();
            this.updateWordCount();
        });

        // Synchronisation du scroll
        this.markdownInput.addEventListener('scroll', () => {
            if (this.syncScroll) {
                this.synchronizeScroll();
            }
        });

        // Boutons de l'interface
        this.toggleLayoutBtn.addEventListener('click', () => {
            this.toggleLayout();
        });

        this.exportHtmlBtn.addEventListener('click', () => {
            this.exportHtml();
        });

        this.clearAllBtn.addEventListener('click', () => {
            this.clearAll();
        });

        this.syncScrollBtn.addEventListener('click', () => {
            this.toggleSyncScroll();
        });

        // Raccourcis clavier
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Gestion du redimensionnement
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Sauvegarde automatique dans localStorage
        this.markdownInput.addEventListener('input', () => {
            this.saveToLocalStorage();
        });
    }

    /**
     * Charge le contenu initial
     */
    loadInitialContent() {
        // Charger depuis localStorage si disponible
        const savedContent = localStorage.getItem('markdown-previewer-content');
        if (savedContent) {
            this.markdownInput.value = savedContent;
        }
        
        // Charger les préférences
        const savedLayout = localStorage.getItem('markdown-previewer-layout');
        if (savedLayout) {
            this.currentLayout = savedLayout;
            this.applyLayout();
        }
        
        const savedSyncScroll = localStorage.getItem('markdown-previewer-sync-scroll');
        if (savedSyncScroll !== null) {
            this.syncScroll = JSON.parse(savedSyncScroll);
            this.updateSyncScrollButton();
        }
    }

    /**
     * Met à jour la prévisualisation
     */
    updatePreview() {
        const markdownText = this.markdownInput.value;
        const htmlContent = this.parser.parse(markdownText);
        this.markdownPreview.innerHTML = htmlContent;
        
        // Ajouter des classes pour le style
        this.markdownPreview.querySelectorAll('pre code').forEach(block => {
            this.highlightCode(block);
        });
    }

    /**
     * Met à jour le compteur de mots
     */
    updateWordCount() {
        const wordCount = this.parser.countWords(this.markdownInput.value);
        this.wordCount.textContent = `${wordCount} mot${wordCount !== 1 ? 's' : ''}`;
    }

    /**
     * Synchronise le scroll entre l'éditeur et la prévisualisation
     */
    synchronizeScroll() {
        const editor = this.markdownInput;
        const preview = this.markdownPreview;
        
        const editorScrollPercent = editor.scrollTop / (editor.scrollHeight - editor.clientHeight);
        const previewScrollTop = editorScrollPercent * (preview.scrollHeight - preview.clientHeight);
        
        preview.scrollTop = previewScrollTop;
    }

    /**
     * Bascule entre les différents layouts
     */
    toggleLayout() {
        const layouts = ['split', 'vertical', 'editor-only', 'preview-only'];
        const currentIndex = layouts.indexOf(this.currentLayout);
        const nextIndex = (currentIndex + 1) % layouts.length;
        
        this.currentLayout = layouts[nextIndex];
        this.applyLayout();
        this.savePreferences();
    }

    /**
     * Applique le layout actuel
     */
    applyLayout() {
        // Supprimer toutes les classes de layout
        this.app.classList.remove('layout-vertical', 'layout-editor-only', 'layout-preview-only');
        
        // Appliquer la nouvelle classe
        switch (this.currentLayout) {
            case 'vertical':
                this.app.classList.add('layout-vertical');
                this.toggleLayoutBtn.innerHTML = '<span class="btn-icon">⚏</span>Vertical';
                break;
            case 'editor-only':
                this.app.classList.add('layout-editor-only');
                this.toggleLayoutBtn.innerHTML = '<span class="btn-icon">✎</span>Éditeur';
                break;
            case 'preview-only':
                this.app.classList.add('layout-preview-only');
                this.toggleLayoutBtn.innerHTML = '<span class="btn-icon">👁</span>Aperçu';
                break;
            default:
                this.toggleLayoutBtn.innerHTML = '<span class="btn-icon">⚏</span>Divisé';
        }
    }

    /**
     * Exporte le HTML généré
     */
    exportHtml() {
        const htmlContent = this.parser.parse(this.markdownInput.value);
        const fullHtml = this.generateFullHtmlDocument(htmlContent);
        
        const blob = new Blob([fullHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'markdown-export.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('HTML exporté avec succès !', 'success');
    }

    /**
     * Génère un document HTML complet
     */
    generateFullHtmlDocument(content) {
        return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document Markdown Exporté</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            background-color: #fff;
        }
        
        h1, h2, h3, h4, h5, h6 {
            margin: 2rem 0 1rem 0;
            font-weight: 700;
            line-height: 1.3;
        }
        
        h1 { font-size: 2.5rem; border-bottom: 2px solid #eee; padding-bottom: 0.5rem; }
        h2 { font-size: 2rem; border-bottom: 1px solid #eee; padding-bottom: 0.25rem; }
        h3 { font-size: 1.5rem; }
        h4 { font-size: 1.25rem; }
        
        p { margin: 1rem 0; }
        
        strong { font-weight: 600; }
        em { font-style: italic; }
        
        a { color: #2563eb; text-decoration: none; }
        a:hover { text-decoration: underline; }
        
        ul, ol { margin: 1rem 0; padding-left: 2rem; }
        li { margin: 0.25rem 0; }
        
        code {
            background-color: #f1f5f9;
            color: #2563eb;
            padding: 0.25rem 0.5rem;
            border-radius: 0.25rem;
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 0.9em;
        }
        
        pre {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 0.5rem;
            padding: 1rem;
            overflow-x: auto;
            margin: 1rem 0;
        }
        
        pre code {
            background: none;
            padding: 0;
            color: inherit;
        }
        
        blockquote {
            margin: 1rem 0;
            padding: 1rem;
            border-left: 4px solid #2563eb;
            background-color: #dbeafe;
            font-style: italic;
        }
        
        hr {
            margin: 2rem 0;
            border: none;
            height: 1px;
            background-color: #e2e8f0;
        }
        
        table {
            width: 100%;
            margin: 1rem 0;
            border-collapse: collapse;
            border: 1px solid #e2e8f0;
        }
        
        th, td {
            padding: 0.75rem;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
        }
        
        th {
            background-color: #f8fafc;
            font-weight: 600;
        }
        
        img {
            max-width: 100%;
            height: auto;
            border-radius: 0.5rem;
        }
    </style>
</head>
<body>
${content}
</body>
</html>`;
    }

    /**
     * Efface tout le contenu
     */
    clearAll() {
        if (confirm('Êtes-vous sûr de vouloir effacer tout le contenu ?')) {
            this.markdownInput.value = '';
            this.updatePreview();
            this.updateWordCount();
            this.saveToLocalStorage();
            this.showNotification('Contenu effacé', 'info');
        }
    }

    /**
     * Bascule la synchronisation du scroll
     */
    toggleSyncScroll() {
        this.syncScroll = !this.syncScroll;
        this.updateSyncScrollButton();
        this.savePreferences();
        
        const message = this.syncScroll ? 'Synchronisation activée' : 'Synchronisation désactivée';
        this.showNotification(message, 'info');
    }

    /**
     * Met à jour l'apparence du bouton de synchronisation
     */
    updateSyncScrollButton() {
        if (this.syncScroll) {
            this.syncScrollBtn.classList.add('active');
            this.syncScrollBtn.innerHTML = '<span class="btn-icon">⇅</span>Sync ON';
        } else {
            this.syncScrollBtn.classList.remove('active');
            this.syncScrollBtn.innerHTML = '<span class="btn-icon">⇅</span>Sync OFF';
        }
    }

    /**
     * Gère les raccourcis clavier
     */
    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + S : Exporter
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            this.exportHtml();
        }
        
        // Ctrl/Cmd + L : Changer layout
        if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
            e.preventDefault();
            this.toggleLayout();
        }
        
        // Ctrl/Cmd + K : Effacer
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            this.clearAll();
        }
        
        // Tab dans l'éditeur
        if (e.target === this.markdownInput && e.key === 'Tab') {
            e.preventDefault();
            this.insertTab();
        }
    }

    /**
     * Insère une tabulation dans l'éditeur
     */
    insertTab() {
        const start = this.markdownInput.selectionStart;
        const end = this.markdownInput.selectionEnd;
        const value = this.markdownInput.value;
        
        this.markdownInput.value = value.substring(0, start) + '    ' + value.substring(end);
        this.markdownInput.selectionStart = this.markdownInput.selectionEnd = start + 4;
        
        this.updatePreview();
    }

    /**
     * Gère le redimensionnement de la fenêtre
     */
    handleResize() {
        // Réajuster la synchronisation du scroll si nécessaire
        if (this.syncScroll) {
            setTimeout(() => {
                this.synchronizeScroll();
            }, 100);
        }
    }

    /**
     * Sauvegarde le contenu dans localStorage
     */
    saveToLocalStorage() {
        localStorage.setItem('markdown-previewer-content', this.markdownInput.value);
    }

    /**
     * Sauvegarde les préférences
     */
    savePreferences() {
        localStorage.setItem('markdown-previewer-layout', this.currentLayout);
        localStorage.setItem('markdown-previewer-sync-scroll', JSON.stringify(this.syncScroll));
    }

    /**
     * Coloration syntaxique basique pour les blocs de code
     */
    highlightCode(block) {
        // Coloration basique pour JavaScript
        if (block.className.includes('language-javascript') || block.className.includes('language-js')) {
            let code = block.innerHTML;
            
            // Mots-clés
            code = code.replace(/\b(function|const|let|var|if|else|for|while|return|class|import|export)\b/g, '<span style="color: #d73a49;">$1</span>');
            
            // Chaînes de caractères
            code = code.replace(/(["'`])((?:\\.|(?!\1)[^\\])*?)\1/g, '<span style="color: #032f62;">$1$2$1</span>');
            
            // Commentaires
            code = code.replace(/(\/\/.*$)/gm, '<span style="color: #6a737d;">$1</span>');
            
            block.innerHTML = code;
        }
    }

    /**
     * Affiche une notification
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            ${type === 'success' ? 'background-color: #10b981;' : ''}
            ${type === 'error' ? 'background-color: #ef4444;' : ''}
            ${type === 'info' ? 'background-color: #2563eb;' : ''}
        `;
        
        document.body.appendChild(notification);
        
        // Animation d'entrée
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // Suppression automatique
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Initialisation de l'application quand le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    new MarkdownPreviewerApp();
});

