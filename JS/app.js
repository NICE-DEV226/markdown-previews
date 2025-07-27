/**
 * Application principale Markdown Previewer
 * Gère l'interface utilisateur et la conversion en temps réel
 */
class MarkdownPreviewerApp {
    constructor() {
        this.parser = new MarkdownParser();
        this.syncScroll = true;
        this.currentLayout = 'split'; // split, vertical, editor-only, preview-only
        this.previewMode = 'visual'; // visual, raw
        
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
        this.htmlRawPreview = document.getElementById('htmlRawPreview');
        this.wordCount = document.getElementById('wordCount');
        this.toggleLayoutBtn = document.getElementById('toggleLayout');
        this.exportHtmlBtn = document.getElementById('exportHtml');
        this.clearAllBtn = document.getElementById('clearAll');
        this.syncScrollBtn = document.getElementById('syncScroll');
        this.importFileBtn = document.getElementById('importFile');
        this.fileInput = document.getElementById('fileInput');
        this.togglePreviewModeBtn = document.getElementById('togglePreviewMode');
        this.toggleModeText = document.getElementById('toggleModeText');
        this.previewTitle = document.getElementById('previewTitle');
        this.editorContainer = document.querySelector('.editor-container');
        this.app = document.querySelector('.app');
        this.previewPanel = document.querySelector('.preview-panel');
        this.themeToggle = document.getElementById('themeToggle');
        this.themeIcon = document.querySelector('.theme-icon');
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

        // Bouton d'importation de fichier
        this.importFileBtn.addEventListener('click', () => {
            this.fileInput.click();
        });

        // Quand vous sélectionnez un fichier
        this.fileInput.addEventListener('change', (e) => {
            this.handleFileImport(e);
        });

        // Bouton de bascule du mode de prévisualisation
        this.togglePreviewModeBtn.addEventListener('click', () => {
            this.togglePreviewMode();
        });

        // Bouton de bascule de thème
        this.themeToggle.addEventListener('click', () => {
            this.toggleTheme();
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

        const savedPreviewMode = localStorage.getItem('markdown-previewer-preview-mode');
        if (savedPreviewMode) {
            this.previewMode = savedPreviewMode;
            this.updatePreviewModeButton();
            this.applyPreviewMode();
        }

        // Charger le thème sauvegardé
        const savedTheme = localStorage.getItem('markdown-previewer-theme') || 'light';
        this.currentTheme = savedTheme;
        this.applyTheme(savedTheme);
    }

    /**
     * Met à jour la prévisualisation
     */
    updatePreview() {
        const markdownText = this.markdownInput.value;
        const htmlContent = this.parser.parse(markdownText);
        
        // Mise à jour de la prévisualisation visuelle
        this.markdownPreview.innerHTML = htmlContent;
        
        // Mise à jour de l'affichage HTML brut
        this.htmlRawPreview.textContent = this.formatHtmlForDisplay(htmlContent);
        
        // Ajouter des classes pour le style
        this.markdownPreview.querySelectorAll('pre code').forEach(block => {
            this.highlightCode(block);
        });
    }

    /**
     * Formate le HTML pour un affichage lisible
     */
    formatHtmlForDisplay(html) {
        if (!html) return '';
        
        // Indentation simple du HTML
        let formatted = html;
        let indent = 0;
        const indentSize = 2;
        
        // Remplacer les balises pour ajouter des retours à la ligne
        formatted = formatted.replace(/></g, '>\n<');
        
        // Diviser en lignes et indenter
        const lines = formatted.split('\n');
        const formattedLines = lines.map(line => {
            const trimmed = line.trim();
            if (!trimmed) return '';
            
            // Diminuer l'indentation pour les balises fermantes
            if (trimmed.startsWith('</')) {
                indent = Math.max(0, indent - indentSize);
            }
            
            const indentedLine = ' '.repeat(indent) + trimmed;
            
            // Augmenter l'indentation pour les balises ouvrantes (sauf auto-fermantes)
            if (trimmed.startsWith('<') && !trimmed.startsWith('</') && !trimmed.endsWith('/>') && !this.isSelfClosingTag(trimmed)) {
                indent += indentSize;
            }
            
            return indentedLine;
        });
        
        return formattedLines.filter(line => line.trim()).join('\n');
    }

    /**
     * Vérifie si une balise est auto-fermante
     */
    isSelfClosingTag(tag) {
        const selfClosingTags = ['br', 'hr', 'img', 'input', 'meta', 'link'];
        const tagName = tag.match(/<(\w+)/);
        return tagName && selfClosingTags.includes(tagName[1].toLowerCase());
    }

    /**
     * Bascule entre l'affichage visuel et HTML brut
     */
    togglePreviewMode() {
        this.previewMode = this.previewMode === 'visual' ? 'raw' : 'visual';
        this.applyPreviewMode();
        this.updatePreviewModeButton();
        this.savePreferences();
        
        const message = this.previewMode === 'raw' ? 'Mode HTML brut activé' : 'Mode visuel activé';
        this.showNotification(message, 'info');
    }

    /**
     * Applique le mode de prévisualisation actuel
     */
    applyPreviewMode() {
        if (this.previewMode === 'raw') {
            this.previewPanel.classList.add('preview-mode-raw');
        } else {
            this.previewPanel.classList.remove('preview-mode-raw');
        }
    }

    /**
     * Met à jour l'apparence du bouton de bascule de mode
     */
    updatePreviewModeButton() {
        if (this.previewMode === 'raw') {
            this.togglePreviewModeBtn.classList.add('active');
            this.toggleModeText.textContent = 'Visuel';
            this.previewTitle.textContent = 'Code HTML';
        } else {
            this.togglePreviewModeBtn.classList.remove('active');
            this.toggleModeText.textContent = 'HTML Brut';
            this.previewTitle.textContent = 'Prévisualisation';
        }
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
        const preview = this.previewMode === 'visual' ? this.markdownPreview : this.htmlRawPreview;
        
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

        // Ctrl/Cmd + M : Basculer mode de prévisualisation
        if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
            e.preventDefault();
            this.togglePreviewMode();
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
        localStorage.setItem('markdown-previewer-preview-mode', this.previewMode);
    }

    /**
     * Gère l'importation de fichiers Markdown
     */
    handleFileImport(event) {
        const file = event.target.files[0];
        
        if (!file) {
            return;
        }

        const fileName = file.name.toLowerCase();
        if (!fileName.endsWith('.md') && !fileName.endsWith('.txt')) {
            this.showNotification('Veuillez sélectionner un fichier .md ou .txt', 'error');
            return;
        }

        const reader = new FileReader();
        
        reader.onload = (e) => {
            const content = e.target.result;
            this.markdownInput.value = content;
            this.updatePreview();
            this.updateWordCount();
            this.saveToLocalStorage();
            this.showNotification(`Fichier "${file.name}" importé avec succès !`, 'success');
        };
        
        reader.onerror = () => {
            this.showNotification('Erreur lors de la lecture du fichier', 'error');
        };
        
        reader.readAsText(file, 'UTF-8');
        event.target.value = '';
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
            this.themeIcon.textContent = '🌞';
        } else {
            document.documentElement.removeAttribute('data-theme');
            this.themeIcon.textContent = '🌙';
        }
    }

    /**
     * Affiche une notification
     */
    showNotification(message, type = 'info') {
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

// Initialisation de l'application quand le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    new MarkdownPreviewerApp();
});

