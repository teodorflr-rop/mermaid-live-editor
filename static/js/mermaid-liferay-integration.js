// Mermaid PostMessage Integration for Liferay JSP
// This script handles communication between the SvelteKit Mermaid editor and Liferay parent window

class MermaidLiferayIntegration {
    constructor() {
        this.isInIframe = window.self !== window.top;
        this.isEditMode = this.getMode() === 'edit';
        this.autoSaveTimeout = null;
        this.contentChangeCallbacks = [];

        if (this.isInIframe) {
            this.setupMessageHandling();
            this.notifyParentReady();
        }
    }

    // Initialize the integration
    init() {
        // console.log('Mermaid-Liferay integration initialized');
        // console.log('Edit mode:', this.isEditMode);
        // console.log('In iframe:', this.isInIframe);

        // Don't create save button as it's already handled by SvelteKit
        // Just setup the integration for message handling
    }

    // Get mode from URL parameters
    getMode() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('mode') || 'edit';
    }

    // Setup message handling with parent window
    setupMessageHandling() {
        window.addEventListener('message', (event) => {
            this.handleParentMessage(event);
        });
    }

    // Handle messages from parent (Liferay JSP)
    handleParentMessage(event) {
        try {
            const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

            if (data && data.action === 'load') {
                // console.log('Loading content from parent:', data.content?.substring(0, 100) + '...');
                this.loadContent(data.content || '');
            }
        } catch (error) {
            console.error('Error handling parent message:', error);
        }
    }

    // Notify parent that iframe is ready
    notifyParentReady() {
        window.parent.postMessage({ action: 'ready' }, '*');
    }

    // Load content into the editor
    loadContent(content) {
        // Update the SvelteKit editor with the content
        if (window.updateCode && typeof window.updateCode === 'function') {
            window.updateCode(content, { updateDiagram: true });
        }

        // Mark that we received a load from parent so pages can detect it (race-safe)
        try {
            window.__mermaidLiferay_lastLoad = Date.now();
            window.dispatchEvent(new CustomEvent('mermaid:contentLoaded', { detail: content }));
        } catch (e) {
            // ignore
        }

        // Call all registered content change callbacks
        this.contentChangeCallbacks.forEach(callback => {
            try {
                callback(content);
            } catch (error) {
                console.error('Error in content change callback:', error);
            }
        });
    }

    // Register a callback for when content changes
    onContentChange(callback) {
        this.contentChangeCallbacks.push(callback);
    }

    // Handle save button click - called from SvelteKit save button
    handleSave() {
        if (!this.isInIframe) {
            // console.log('Not in iframe, no Liferay save needed');
            return;
        }

        try {
            const currentContent = this.getCurrentDiagramContent();
            // console.log('Saving Mermaid content to Liferay:', currentContent.substring(0, 100) + '...');

            // Send save message to parent (this triggers the backend save and redirect)
            window.parent.postMessage({
                action: 'save',
                content: currentContent
            }, '*');

            // Visual feedback
            // this.showSaveMessage('Saving to Liferay...');

        } catch (error) {
            console.error('Error during Liferay save:', error);
            this.showSaveMessage('Liferay save failed: ' + error.message, true);
        }
    }

    // Handle exit action - notify parent similarly to save but with action 'exit'
    handleExit() {
        if (!this.isInIframe) {
            // console.log('Not in iframe, no Liferay exit needed');
            return;
        }

        try {
            const currentContent = this.getCurrentDiagramContent();
            // console.log('Flagging exit to Liferay with current content:', currentContent.substring(0, 100) + '...');

            // Send exit message to parent (parent can decide how to handle: save+close/redirect)
            window.parent.postMessage({
                action: 'exit',
                content: currentContent
            }, '*');

        } catch (error) {
            console.error('Error during Liferay exit:', error);
            this.showSaveMessage('Liferay exit failed: ' + error.message, true);
        }
    }

    // Auto-save handler (optional)
    handleAutoSave() {
        if (!this.isInIframe) return;

        try {
            const currentContent = this.getCurrentDiagramContent();

            // Send autosave message to parent (this updates the form but doesn't redirect)
            window.parent.postMessage({
                action: 'autosave',
                content: currentContent
            }, '*');

        } catch (error) {
            console.error('Error during autosave:', error);
        }
    }

    // Get current diagram content from SvelteKit state
    getCurrentDiagramContent() {
        // Method 1: Try to get from SvelteKit state store
        if (window.inputStateStore && typeof window.inputStateStore.subscribe === 'function') {
            let currentState = null;
            const unsubscribe = window.inputStateStore.subscribe(state => {
                currentState = state;
            });
            unsubscribe();

            if (currentState && currentState.code) {
                return currentState.code;
            }
        }

        // Method 2: Try to get from global get function if available
        if (window.get && window.inputStateStore) {
            try {
                const state = window.get(window.inputStateStore);
                if (state && state.code) {
                    return state.code;
                }
            } catch (error) {
                console.warn('Could not get state using window.get:', error);
            }
        }

        // Method 3: Try to get from Monaco Editor (SvelteKit might use Monaco)
        if (window.monaco && window.monaco.editor) {
            const models = window.monaco.editor.getModels();
            if (models.length > 0) {
                return models[0].getValue();
            }
        }

        // Method 4: Try to get from textarea or other editor elements
        const textarea = document.querySelector('textarea[id*="editor"], textarea[class*="editor"], textarea[placeholder*="mermaid" i]');
        if (textarea && textarea.value) {
            return textarea.value;
        }

        // Method 5: Look for CodeMirror
        if (window.CodeMirror) {
            const cmElements = document.querySelectorAll('.CodeMirror');
            for (const element of cmElements) {
                if (element.CodeMirror) {
                    return element.CodeMirror.getValue();
                }
            }
        }

        // Fallback: empty content
        console.warn('Could not find diagram content from SvelteKit editor');
        return '';
    }

    // Setup autosave (call this when content changes)
    setupAutoSave(getDiagramContentCallback) {
        // If a custom getter is provided, use it
        if (typeof getDiagramContentCallback === 'function') {
            this.getCurrentDiagramContent = getDiagramContentCallback;
        }

        // Setup autosave trigger
        this.onContentChange(() => {
            if (this.autoSaveTimeout) {
                clearTimeout(this.autoSaveTimeout);
            }
            this.autoSaveTimeout = setTimeout(() => {
                this.handleAutoSave();
            }, 2000); // Autosave after 2 seconds of inactivity
        });
    }

    // Show save message to user
    showSaveMessage(message, isError = false) {
        // Create or update save message element
        let messageEl = document.querySelector('.liferay-save-message');
        if (!messageEl) {
            messageEl = document.createElement('div');
            messageEl.className = 'liferay-save-message';
            messageEl.style.cssText = `
                position: fixed;
                top: 70px;
                right: 10px;
                z-index: 10001;
                padding: 10px 15px;
                border-radius: 4px;
                color: white;
                font-size: 14px;
                transition: opacity 0.3s;
                pointer-events: none;
            `;
            document.body.appendChild(messageEl);
        }

        messageEl.textContent = message;
        messageEl.style.backgroundColor = isError ? '#dc3545' : '#28a745';
        messageEl.style.opacity = '1';

        // Auto-hide after 3 seconds
        setTimeout(() => {
            messageEl.style.opacity = '0';
        }, 3000);
    }

    // Trigger content change (call this when the editor content changes)
    triggerContentChange() {
        this.contentChangeCallbacks.forEach(callback => {
            try {
                callback(this.getCurrentDiagramContent());
            } catch (error) {
                console.error('Error in content change callback:', error);
            }
        });
    }
}

// Auto-initialize when script loads
window.mermaidLiferayIntegration = new MermaidLiferayIntegration();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.mermaidLiferayIntegration.init();
    });
} else {
    window.mermaidLiferayIntegration.init();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MermaidLiferayIntegration;
}

// console.log('Mermaid-Liferay Integration loaded for SvelteKit!');
