/**
 * Parseur Markdown simple mais complet
 * Convertit la syntaxe Markdown en HTML
 */
class MarkdownParser {
    constructor() {
        this.rules = [
            // Titres (H1-H6)
            { pattern: /^### (.*$)/gm, replacement: '<h3>$1</h3>' },
            { pattern: /^## (.*$)/gm, replacement: '<h2>$1</h2>' },
            { pattern: /^# (.*$)/gm, replacement: '<h1>$1</h1>' },
            { pattern: /^#### (.*$)/gm, replacement: '<h4>$1</h4>' },
            { pattern: /^##### (.*$)/gm, replacement: '<h5>$1</h5>' },
            { pattern: /^###### (.*$)/gm, replacement: '<h6>$1</h6>' },
            
            // Séparateur horizontal
            { pattern: /^---$/gm, replacement: '<hr>' },
            { pattern: /^\*\*\*$/gm, replacement: '<hr>' },
            
            // Gras et italique
            { pattern: /\*\*\*(.*?)\*\*\*/g, replacement: '<strong><em>$1</em></strong>' },
            { pattern: /\*\*(.*?)\*\*/g, replacement: '<strong>$1</strong>' },
            { pattern: /\*(.*?)\*/g, replacement: '<em>$1</em>' },
            { pattern: /__(.*?)__/g, replacement: '<strong>$1</strong>' },
            { pattern: /_(.*?)_/g, replacement: '<em>$1</em>' },
            
            // Code inline
            { pattern: /`([^`]+)`/g, replacement: '<code>$1</code>' },
            
            // Liens
            { pattern: /\[([^\]]+)\]\(([^)]+)\)/g, replacement: '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>' },
            
            // Images
            { pattern: /!\[([^\]]*)\]\(([^)]+)\)/g, replacement: '<img src="$2" alt="$1" style="max-width: 100%; height: auto;">' },
        ];
    }

    /**
     * Parse le texte Markdown et retourne le HTML
     * @param {string} markdown - Le texte Markdown à parser
     * @returns {string} - Le HTML généré
     */
    parse(markdown) {
        if (!markdown || typeof markdown !== 'string') {
            return '';
        }

        let html = markdown;

        // Traitement des blocs de code
        html = this.parseCodeBlocks(html);
        
        // Traitement des citations
        html = this.parseBlockquotes(html);
        
        // Traitement des listes
        html = this.parseLists(html);
        
        // Traitement des tableaux
        html = this.parseTables(html);
        
        // Application des règles de base
        this.rules.forEach(rule => {
            html = html.replace(rule.pattern, rule.replacement);
        });
        
        // Traitement des paragraphes
        html = this.parseParagraphs(html);
        
        return html;
    }

    /**
     * Parse les blocs de code
     * @param {string} text - Le texte à parser
     * @returns {string} - Le texte avec les blocs de code parsés
     */
    parseCodeBlocks(text) {
        // Blocs de code avec langage
        text = text.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, language, code) => {
            const lang = language ? ` class="language-${language}"` : '';
            return `<pre><code${lang}>${this.escapeHtml(code.trim())}</code></pre>`;
        });
        
        // Blocs de code simples
        text = text.replace(/```\n([\s\S]*?)```/g, (match, code) => {
            return `<pre><code>${this.escapeHtml(code.trim())}</code></pre>`;
        });
        
        return text;
    }

    /**
     * Parse les citations
     * @param {string} text - Le texte à parser
     * @returns {string} - Le texte avec les citations parsées
     */
    parseBlockquotes(text) {
        const lines = text.split('\n');
        const result = [];
        let inBlockquote = false;
        let blockquoteContent = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            if (line.startsWith('> ')) {
                if (!inBlockquote) {
                    inBlockquote = true;
                    blockquoteContent = [];
                }
                blockquoteContent.push(line.substring(2));
            } else {
                if (inBlockquote) {
                    result.push(`<blockquote>${blockquoteContent.join('<br>')}</blockquote>`);
                    inBlockquote = false;
                    blockquoteContent = [];
                }
                result.push(line);
            }
        }
        
        // Traiter la dernière citation si nécessaire
        if (inBlockquote) {
            result.push(`<blockquote>${blockquoteContent.join('<br>')}</blockquote>`);
        }
        
        return result.join('\n');
    }

    /**
     * Parse les listes
     * @param {string} text - Le texte à parser
     * @returns {string} - Le texte avec les listes parsées
     */
    parseLists(text) {
        const lines = text.split('\n');
        const result = [];
        let inUnorderedList = false;
        let inOrderedList = false;
        let listItems = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Liste non ordonnée
            if (line.match(/^[-*+] /)) {
                if (inOrderedList) {
                    result.push(`<ol>${listItems.join('')}</ol>`);
                    inOrderedList = false;
                    listItems = [];
                }
                
                if (!inUnorderedList) {
                    inUnorderedList = true;
                }
                
                const content = line.substring(2);
                listItems.push(`<li>${content}</li>`);
            }
            // Liste ordonnée
            else if (line.match(/^\d+\. /)) {
                if (inUnorderedList) {
                    result.push(`<ul>${listItems.join('')}</ul>`);
                    inUnorderedList = false;
                    listItems = [];
                }
                
                if (!inOrderedList) {
                    inOrderedList = true;
                }
                
                const content = line.replace(/^\d+\. /, '');
                listItems.push(`<li>${content}</li>`);
            }
            // Fin de liste
            else {
                if (inUnorderedList) {
                    result.push(`<ul>${listItems.join('')}</ul>`);
                    inUnorderedList = false;
                    listItems = [];
                } else if (inOrderedList) {
                    result.push(`<ol>${listItems.join('')}</ol>`);
                    inOrderedList = false;
                    listItems = [];
                }
                result.push(lines[i]);
            }
        }
        
        // Traiter la dernière liste si nécessaire
        if (inUnorderedList) {
            result.push(`<ul>${listItems.join('')}</ul>`);
        } else if (inOrderedList) {
            result.push(`<ol>${listItems.join('')}</ol>`);
        }
        
        return result.join('\n');
    }

    /**
     * Parse les tableaux
     * @param {string} text - Le texte à parser
     * @returns {string} - Le texte avec les tableaux parsés
     */
    parseTables(text) {
        const lines = text.split('\n');
        const result = [];
        let inTable = false;
        let tableRows = [];
        let isHeader = true;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Détection d'une ligne de tableau
            if (line.includes('|') && line.split('|').length > 2) {
                if (!inTable) {
                    inTable = true;
                    isHeader = true;
                    tableRows = [];
                }
                
                const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell !== '');
                
                // Ignorer les lignes de séparation (|---|---|)
                if (cells.every(cell => cell.match(/^-+$/))) {
                    isHeader = false;
                    continue;
                }
                
                const tag = isHeader ? 'th' : 'td';
                const rowHtml = `<tr>${cells.map(cell => `<${tag}>${cell}</${tag}>`).join('')}</tr>`;
                tableRows.push(rowHtml);
                
                if (isHeader) {
                    isHeader = false;
                }
            } else {
                if (inTable) {
                    result.push(`<table>${tableRows.join('')}</table>`);
                    inTable = false;
                    tableRows = [];
                }
                result.push(lines[i]);
            }
        }
        
        // Traiter le dernier tableau si nécessaire
        if (inTable) {
            result.push(`<table>${tableRows.join('')}</table>`);
        }
        
        return result.join('\n');
    }

    /**
     * Parse les paragraphes
     * @param {string} text - Le texte à parser
     * @returns {string} - Le texte avec les paragraphes parsés
     */
    parseParagraphs(text) {
        const lines = text.split('\n');
        const result = [];
        let currentParagraph = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Ligne vide - fin de paragraphe
            if (line === '') {
                if (currentParagraph.length > 0) {
                    const paragraphText = currentParagraph.join(' ').trim();
                    if (paragraphText && !this.isHtmlBlock(paragraphText)) {
                        result.push(`<p>${paragraphText}</p>`);
                    } else {
                        result.push(paragraphText);
                    }
                    currentParagraph = [];
                }
                result.push('');
            }
            // Ligne de contenu
            else {
                // Si c'est déjà un bloc HTML, l'ajouter directement
                if (this.isHtmlBlock(line)) {
                    if (currentParagraph.length > 0) {
                        const paragraphText = currentParagraph.join(' ').trim();
                        if (paragraphText) {
                            result.push(`<p>${paragraphText}</p>`);
                        }
                        currentParagraph = [];
                    }
                    result.push(line);
                } else {
                    currentParagraph.push(line);
                }
            }
        }
        
        // Traiter le dernier paragraphe si nécessaire
        if (currentParagraph.length > 0) {
            const paragraphText = currentParagraph.join(' ').trim();
            if (paragraphText && !this.isHtmlBlock(paragraphText)) {
                result.push(`<p>${paragraphText}</p>`);
            } else if (paragraphText) {
                result.push(paragraphText);
            }
        }
        
        return result.join('\n');
    }

    /**
     * Vérifie si une ligne est déjà un bloc HTML
     * @param {string} line - La ligne à vérifier
     * @returns {boolean} - True si c'est un bloc HTML
     */
    isHtmlBlock(line) {
        const htmlTags = ['<h1', '<h2', '<h3', '<h4', '<h5', '<h6', '<p', '<div', '<ul', '<ol', '<li', '<blockquote', '<pre', '<table', '<tr', '<td', '<th', '<hr', '<img', '<a'];
        return htmlTags.some(tag => line.includes(tag));
    }

    /**
     * Échappe les caractères HTML
     * @param {string} text - Le texte à échapper
     * @returns {string} - Le texte échappé
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Compte les mots dans le texte
     * @param {string} text - Le texte à analyser
     * @returns {number} - Le nombre de mots
     */
    countWords(text) {
        if (!text || typeof text !== 'string') {
            return 0;
        }
        
        // Supprimer la syntaxe Markdown pour le comptage
        let cleanText = text
            .replace(/#{1,6}\s/g, '') // Titres
            .replace(/\*\*([^*]+)\*\*/g, '$1') // Gras
            .replace(/\*([^*]+)\*/g, '$1') // Italique
            .replace(/`([^`]+)`/g, '$1') // Code inline
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Liens
            .replace(/!\[[^\]]*\]\([^)]+\)/g, '') // Images
            .replace(/```[\s\S]*?```/g, '') // Blocs de code
            .replace(/^[-*+]\s/gm, '') // Listes
            .replace(/^\d+\.\s/gm, '') // Listes ordonnées
            .replace(/^>\s/gm, '') // Citations
            .replace(/\|/g, ' ') // Tableaux
            .replace(/---/g, '') // Séparateurs
            .trim();
        
        if (!cleanText) {
            return 0;
        }
        
        return cleanText.split(/\s+/).filter(word => word.length > 0).length;
    }
}

// Export pour utilisation
window.MarkdownParser = MarkdownParser;

