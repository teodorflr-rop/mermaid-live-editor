/// <reference types="@sveltejs/kit" />

// Global declarations for Liferay integration
export { };

declare global {
    interface Window {
        mermaidLiferayIntegration?: {
            handleSave: () => void;
            handleAutoSave: () => void;
            triggerContentChange: () => void;
            getCurrentDiagramContent: () => string;
            showSaveMessage: (message: string, isError?: boolean) => void;
        };
        inputStateStore?: any;
        updateCode?: (code: string, options?: { updateDiagram?: boolean }) => void;
        get?: (store: any) => any;
    }
}
