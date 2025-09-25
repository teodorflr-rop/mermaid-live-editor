<script lang="ts">
  import Card from '$/components/Card/Card.svelte';
  import DiagramDocButton from '$/components/DiagramDocumentationButton.svelte';
  import Editor from '$/components/Editor.svelte';
  import History from '$/components/History/History.svelte';
  import Navbar from '$/components/Navbar.svelte';
  import PanZoomToolbar from '$/components/PanZoomToolbar.svelte';
  import Preset from '$/components/Preset.svelte';
  import SyncRoughToolbar from '$/components/SyncRoughToolbar.svelte';
  import * as Resizable from '$/components/ui/resizable';
  import VersionSecurityToolbar from '$/components/VersionSecurityToolbar.svelte';
  import View from '$/components/View.svelte';
  import type { EditorMode, Tab } from '$/types';
  import { PanZoomState } from '$/util/panZoom';
  import { stateStore, updateCodeStore } from '$/util/state';
  import { logEvent } from '$/util/stats';
  import { initHandler } from '$/util/util';
  import { onDestroy, onMount } from 'svelte';
  import CodeIcon from '~icons/custom/code';
  import GearIcon from '~icons/material-symbols/settings-outline-rounded';
  // Create an unlinked node with a given mermaid shape id
  import { addHistoryEntry, getPreviousState } from '$/components/History/history';
  import { Button } from '$/components/ui/button';
  import { notify } from '$/util/notify';
  import { inputStateStore, updateCode } from '$/util/state';
  import { get } from 'svelte/store';
  import SaveIcon from '~icons/material-symbols/save-outline-rounded';
  import type { PageData } from './$types';

  // Receive the mode from the page.ts loader
  let { data }: { data: PageData } = $props();

  const panZoomState = new PanZoomState();

  const tabSelectHandler = (tab: Tab) => {
    const editorMode: EditorMode = tab.id === 'code' ? 'code' : 'config';
    updateCodeStore({ editorMode });
  };

  const editorTabs: Tab[] = [
    {
      icon: CodeIcon,
      id: 'code',
      title: 'Code'
    },
    {
      icon: GearIcon,
      id: 'config',
      title: 'Config'
    }
  ];

  let width = $state(0);
  let isMobile = $derived(width < 640);
  let isViewMode = $state(true);

  // Use the mode parameter to determine view-only behavior
  // mode=view: Show in read-only mode
  // mode=edit: Show full editor with editing capabilities
  let effectiveViewOnlyMode = $derived(data.mode === 'view');

  // Store unsubscribe function for cleanup
  let unsubscribeLiferay: (() => void) | null = null;

  // Loader state: show until diagram emits 'rendered' or fallback timeout
  let showLoader = $state(true);
  let loaderTimeout: ReturnType<typeof setTimeout> | null = null;
  // If we expect content from parent (iframe), track that
  let contentLoadedFromParent = $state(false);
  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;
  // Show a small rendering message while mermaid renders the diagram
  let showRenderingMessage = $state(false);
  let renderingMessageTimeout: ReturnType<typeof setTimeout> | null = null;

  function handleParentContentLoaded(event?: CustomEvent | Event) {
    // mark content loaded
    contentLoadedFromParent = true;
    // hide loader and show rendering message to reduce perceived delay
    showLoader = false;
    if (loaderTimeout) {
      clearTimeout(loaderTimeout);
      loaderTimeout = null;
    }
    showRenderingMessage = true;
    if (renderingMessageTimeout) {
      clearTimeout(renderingMessageTimeout);
    }
    renderingMessageTimeout = setTimeout(() => {
      showRenderingMessage = false;
      renderingMessageTimeout = null;
    }, 1500);
  }

  // function called when View dispatches 'rendered'
  function onViewRendered(_: any) {
    // If we are inside an iframe and expecting parent content, wait for content load
    if (isInIframe) {
      // If parent already loaded content (race-safe), hide loader now
      if (window.__mermaidLiferay_lastLoad || contentLoadedFromParent) {
        showLoader = false;
        showRenderingMessage = false;
        if (renderingMessageTimeout) {
          clearTimeout(renderingMessageTimeout);
          renderingMessageTimeout = null;
        }
        if (loaderTimeout) {
          clearTimeout(loaderTimeout);
          loaderTimeout = null;
        }
      } else {
        // otherwise keep loader visible until parent content arrives (or fallback)
        console.debug('View rendered but waiting for parent content');
      }
    } else {
      // Not in iframe: hide loader immediately
      showLoader = false;
      showRenderingMessage = false;
      if (renderingMessageTimeout) {
        clearTimeout(renderingMessageTimeout);
        renderingMessageTimeout = null;
      }
      if (loaderTimeout) {
        clearTimeout(loaderTimeout);
        loaderTimeout = null;
      }
    }
  }

  onMount(async () => {
    await initHandler();
    window.addEventListener('appinstalled', () => {
      logEvent('pwaInstalled', { isMobile });
    });

    // Expose SvelteKit state and functions to global window for Liferay integration
    if (typeof window !== 'undefined') {
      window.inputStateStore = inputStateStore;
      window.updateCode = updateCode;
      window.get = get;

      // Setup content change listener for Liferay autosave
      if (window.mermaidLiferayIntegration) {
        // Listen to state changes and trigger autosave
        unsubscribeLiferay = inputStateStore.subscribe((state) => {
          if (window.mermaidLiferayIntegration) {
            window.mermaidLiferayIntegration.triggerContentChange();
          }
        });
      }
    }
    // Start a fallback timeout so loader doesn't remain visible forever
    if (loaderTimeout == null) {
      loaderTimeout = setTimeout(() => {
        showLoader = false;
        loaderTimeout = null;
      }, 5000);
    }

    // Listen for parent content load event (from integration script)
    if (typeof window !== 'undefined') {
      window.addEventListener('mermaid:contentLoaded', handleParentContentLoaded as EventListener);
    }
  });

  onDestroy(() => {
    // Cleanup Liferay subscription
    if (unsubscribeLiferay) {
      unsubscribeLiferay();
    }
    if (loaderTimeout) {
      clearTimeout(loaderTimeout);
      loaderTimeout = null;
    }
    if (renderingMessageTimeout) {
      clearTimeout(renderingMessageTimeout);
      renderingMessageTimeout = null;
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener(
        'mermaid:contentLoaded',
        handleParentContentLoaded as EventListener
      );
    }
  });

  let isHistoryOpen = $state(false);

  // Save function - saves current state to history
  const handleSave = () => {
    const currentState = get(inputStateStore);
    const stateString = JSON.stringify(currentState);
    const previousState = getPreviousState(false);

    if (previousState !== stateString) {
      addHistoryEntry({
        state: currentState,
        time: Date.now(),
        type: 'manual'
      });
      notify('State saved successfully!');
      logEvent('history', { action: 'save', source: 'toolbar' });
    } else {
      notify('State already saved.');
    }

    // Liferay integration: trigger save event for backend
    if (
      typeof window !== 'undefined' &&
      window.mermaidLiferayIntegration &&
      typeof window.mermaidLiferayIntegration.handleSave === 'function'
    ) {
      window.mermaidLiferayIntegration.handleSave();
    }
  };

  // Exit handler: notify Liferay backend similar to save, then request parent to perform exit
  const handleExit = () => {
    // Prefer integration's handleExit if available (will do save+exit behavior)
    if (
      typeof window !== 'undefined' &&
      window.mermaidLiferayIntegration &&
      typeof window.mermaidLiferayIntegration.handleExit === 'function'
    ) {
      try {
        window.mermaidLiferayIntegration.handleExit();
        return;
      } catch (e) {
        console.warn('mermaidLiferayIntegration.handleExit failed, falling back', e);
      }
    }

    // Fallback: ensure we at least trigger a save and notify parent exit
    if (
      typeof window !== 'undefined' &&
      window.mermaidLiferayIntegration &&
      typeof window.mermaidLiferayIntegration.handleSave === 'function'
    ) {
      window.mermaidLiferayIntegration.handleSave();
    }

    if (typeof window !== 'undefined' && window.self !== window.top) {
      try {
        window.parent.postMessage({ action: 'exit' }, '*');
      } catch (e) {
        console.warn('Could not post exit to parent', e);
      }
    }
  };

  let editorPane: Resizable.Pane | undefined = $state();
  $effect(() => {
    if (isMobile) {
      editorPane?.resize(50);
    }
  });

  function createNode(shapeId: string) {
    const state = get(inputStateStore);
    const code = state.code || '';
    const newId = 'N' + Math.floor(Math.random() * 100_000);

    // Map shapeId to Mermaid flowchart node syntax using the new v11.3.0+ format
    const label = 'New node';
    let nodeText = '';

    // Use the new syntax: A@{ shape: rect } for v11.3.0+ shapes
    switch (shapeId) {
      case 'text': {
        nodeText = `@{ shape: text, label: "${label}" }`;
        break;
      }
      case 'rect': {
        nodeText = `@{ shape: rect, label: "${label}" }`;
        break;
      }
      case 'rounded': {
        nodeText = `@{ shape: rounded, label: "${label}" }`;
        break;
      }
      case 'stadium': {
        nodeText = `@{ shape: stadium, label: "${label}" }`;
        break;
      }
      case 'tri': {
        nodeText = `@{ shape: tri, label: "${label}" }`;
        break;
      }
      case 'diam': {
        nodeText = `@{ shape: diam, label: "${label}" }`;
        break;
      }
      case 'hex': {
        nodeText = `@{ shape: hex, label: "${label}" }`;
        break;
      }
      case 'cyl': {
        nodeText = `@{ shape: cyl, label: "${label}" }`;
        break;
      }
      case 'h-cyl': {
        nodeText = `@{ shape: h-cyl, label: "${label}" }`;
        break;
      }
      case 'circ': {
        nodeText = `@{ shape: circ, label: "${label}" }`;
        break;
      }
      case 'dbl-circ': {
        nodeText = `@{ shape: dbl-circ, label: "${label}" }`;
        break;
      }
      case 'sm-circ': {
        nodeText = `@{ shape: sm-circ, label: "${label}" }`;
        break;
      }
      case 'fr-circ': {
        nodeText = `@{ shape: fr-circ, label: "${label}" }`;
        break;
      }
      case 'f-circ': {
        nodeText = `@{ shape: f-circ, label: "${label}" }`;
        break;
      }
      case 'lean-l': {
        nodeText = `@{ shape: lean-l, label: "${label}" }`;
        break;
      }
      case 'lean-r': {
        nodeText = `@{ shape: lean-r, label: "${label}" }`;
        break;
      }
      case 'trap-b': {
        nodeText = `@{ shape: trap-b, label: "${label}" }`;
        break;
      }
      case 'trap-t': {
        nodeText = `@{ shape: trap-t, label: "${label}" }`;
        break;
      }
      case 'card': {
        nodeText = `@{ shape: card, label: "${label}" }`;
        break;
      }
      case 'odd': {
        nodeText = `@{ shape: odd, label: "${label}" }`;
        break;
      }
      case 'anchor': {
        nodeText = `@{ shape: anchor, label: "${label}" }`;
        break;
      }
      // Process shapes
      case 'proc': {
        nodeText = `@{ shape: proc, label: "${label}" }`;
        break;
      }
      case 'subproc': {
        nodeText = `@{ shape: subproc, label: "${label}" }`;
        break;
      }
      case 'tag-proc': {
        nodeText = `@{ shape: tag-proc, label: "${label}" }`;
        break;
      }
      case 'procs': {
        nodeText = `@{ shape: procs, label: "${label}" }`;
        break;
      }
      case 'div-proc': {
        nodeText = `@{ shape: div-proc, label: "${label}" }`;
        break;
      }
      case 'extract': {
        nodeText = `@{ shape: extract, label: "${label}" }`;
        break;
      }
      case 'lin-proc': {
        nodeText = `@{ shape: lin-proc, label: "${label}" }`;
        break;
      }
      case 'in-out': {
        nodeText = `@{ shape: in-out, label: "${label}" }`;
        break;
      }
      case 'out-in': {
        nodeText = `@{ shape: out-in, label: "${label}" }`;
        break;
      }
      case 'manual-file': {
        nodeText = `@{ shape: manual-file, label: "${label}" }`;
        break;
      }
      case 'priority': {
        nodeText = `@{ shape: priority, label: "${label}" }`;
        break;
      }
      case 'collate': {
        nodeText = `@{ shape: collate, label: "${label}" }`;
        break;
      }
      case 'loop-limit': {
        nodeText = `@{ shape: loop-limit, label: "${label}" }`;
        break;
      }
      case 'manual-input': {
        nodeText = `@{ shape: manual-input, label: "${label}" }`;
        break;
      }
      case 'event': {
        nodeText = `@{ shape: event, label: "${label}" }`;
        break;
      }
      case 'start': {
        nodeText = `@{ shape: start, label: "${label}" }`;
        break;
      }
      case 'stop': {
        nodeText = `@{ shape: stop, label: "${label}" }`;
        break;
      }
      case 'terminal': {
        nodeText = `@{ shape: terminal, label: "${label}" }`;
        break;
      }
      case 'delay': {
        nodeText = `@{ shape: delay, label: "${label}" }`;
        break;
      }
      case 'junction': {
        nodeText = `@{ shape: junction, label: "${label}" }`;
        break;
      }
      case 'decision': {
        nodeText = `@{ shape: decision, label: "${label}" }`;
        break;
      }
      case 'doc': {
        nodeText = `@{ shape: doc, label: "${label}" }`;
        break;
      }
      case 'tag-doc': {
        nodeText = `@{ shape: tag-doc, label: "${label}" }`;
        break;
      }
      case 'docs': {
        nodeText = `@{ shape: docs, label: "${label}" }`;
        break;
      }
      case 'comment': {
        nodeText = `@{ shape: comment, label: "${label}" }`;
        break;
      }
      case 'brace-r': {
        nodeText = `@{ shape: brace-r, label: "${label}" }`;
        break;
      }
      case 'braces': {
        nodeText = `@{ shape: braces, label: "${label}" }`;
        break;
      }
      case 'summary': {
        nodeText = `@{ shape: summary, label: "${label}" }`;
        break;
      }
      case 'lin-doc': {
        nodeText = `@{ shape: lin-doc, label: "${label}" }`;
        break;
      }
      // Technical shapes
      case 'db': {
        nodeText = `@{ shape: db, label: "${label}" }`;
        break;
      }
      case 'disk': {
        nodeText = `@{ shape: disk, label: "${label}" }`;
        break;
      }
      case 'das': {
        nodeText = `@{ shape: das, label: "${label}" }`;
        break;
      }
      case 'internal-storage': {
        nodeText = `@{ shape: internal-storage, label: "${label}" }`;
        break;
      }
      case 'display': {
        nodeText = `@{ shape: display, label: "${label}" }`;
        break;
      }
      case 'stored-data': {
        nodeText = `@{ shape: stored-data, label: "${label}" }`;
        break;
      }
      case 'com-link': {
        nodeText = `@{ shape: com-link, label: "${label}" }`;
        break;
      }
      case 'paper-tape': {
        nodeText = `@{ shape: paper-tape, label: "${label}" }`;
        break;
      }
      // Legacy shapes for backwards compatibility
      case 'circle': {
        nodeText = `(${label})`;
        break;
      }
      case 'square': {
        nodeText = `[${label}]`;
        break;
      }
      case 'triangle': {
        nodeText = `>${label}]`;
        break;
      }
      case 'diamond': {
        nodeText = `{${label}}`;
        break;
      }
      default: {
        nodeText = `[${label}]`;
      }
    }

    const addition = `\n    ${newId}${nodeText}`;
    updateCode(code + addition, { updateDiagram: true });
  }
</script>

<div class="flex h-full flex-col overflow-hidden">
  <Navbar {effectiveViewOnlyMode}>
    <!-- Right side content: Save button and Mode indicator -->
    <div class="ml-auto flex items-center gap-4">
      <!-- Save button - only show in edit mode -->
      {#if !effectiveViewOnlyMode}
        <Button
          variant="outline"
          size="sm"
          onclick={handleSave}
          class="flex items-center gap-2"
          title="Save current state to history">
          <SaveIcon class="h-4 w-4" />
          Save
        </Button>
        <!-- Exit button - flags Liferay backend like Save and requests parent exit -->
        <Button
          variant="outline"
          size="sm"
          onclick={handleExit}
          class="flex items-center gap-2"
          title="Exit and flag backend">
          Exit
        </Button>
      {/if}

      <!-- Mode indicator -->
      <div class="flex items-center gap-2 text-sm">
        <span class="text-gray-600 dark:text-gray-400">Mode:</span>
        <span
          class="font-medium {data.mode === 'view'
            ? 'text-blue-600 dark:text-blue-400'
            : 'text-green-600 dark:text-green-400'}">
          {data.mode === 'view' ? 'View Only' : 'Edit'}
        </span>
        {#if showRenderingMessage}
          <span
            class="ml-2 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
            Rendering...
          </span>
        {/if}
      </div>
    </div>
  </Navbar>

  <div class="flex flex-1 flex-col overflow-hidden" bind:clientWidth={width}>
    {#if effectiveViewOnlyMode}
      <!-- View-only mode: Show only the diagram -->
      <div class="relative flex h-full flex-1 flex-col overflow-hidden">
        <View
          {panZoomState}
          shouldShowGrid={$stateStore.grid}
          viewOnlyMode={true}
          on:rendered={onViewRendered} />
        {#if showLoader}
          <div class="page-loader">
            <div class="flex items-center">
              <div class="loader-dot"></div>
              <div class="loader-dot"></div>
              <div class="loader-dot"></div>
            </div>
          </div>
        {/if}
        <div class="absolute bottom-0 right-0"><VersionSecurityToolbar /></div>
      </div>
    {:else}
      <!-- Full interactive mode -->
      <div
        class={[
          'size-full',
          isMobile && ['w-[200%] duration-300', isViewMode && '-translate-x-1/2']
        ]}>
        <Resizable.PaneGroup
          direction="horizontal"
          autoSaveId="liveEditor"
          class="gap-4 p-2 pt-0 sm:gap-0 sm:p-6 sm:pt-0">
          <Resizable.Pane bind:this={editorPane} defaultSize={30} minSize={15}>
            <div class="flex h-full flex-col gap-4 sm:gap-6">
              <Card
                onselect={tabSelectHandler}
                isOpen
                tabs={editorTabs}
                activeTabID={$stateStore.editorMode}
                isClosable={false}>
                {#snippet actions()}
                  <DiagramDocButton />
                {/snippet}
                <Editor {isMobile} />
              </Card>

              <div class="group flex flex-wrap justify-between gap-4 sm:gap-6">
                <Preset />
              </div>
            </div>
          </Resizable.Pane>
          <Resizable.Handle class="mr-1 hidden opacity-0 sm:block" />
          <Resizable.Pane minSize={15} class="relative flex h-full flex-1 flex-col overflow-hidden">
            <View {panZoomState} shouldShowGrid={$stateStore.grid} on:rendered={onViewRendered} />
            {#if showLoader}
              <div class="page-loader">
                <div class="flex items-center">
                  <div class="loader-dot"></div>
                  <div class="loader-dot"></div>
                  <div class="loader-dot"></div>
                </div>
              </div>
            {/if}
            <div class="absolute right-0 top-0"><PanZoomToolbar {panZoomState} {createNode} /></div>
            <div class="absolute bottom-0 right-0"><VersionSecurityToolbar /></div>
            <div class="absolute bottom-0 left-0 sm:left-5"><SyncRoughToolbar /></div>
          </Resizable.Pane>
          {#if isHistoryOpen}
            <Resizable.Handle class="ml-1 hidden opacity-0 sm:block" />
            <Resizable.Pane
              minSize={15}
              defaultSize={30}
              class="hidden h-full flex-grow flex-col sm:flex">
              <History />
            </Resizable.Pane>
          {/if}
        </Resizable.PaneGroup>
      </div>
    {/if}
  </div>
</div>

<style>
  .page-loader {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.9);
    z-index: 60;
    backdrop-filter: blur(2px);
  }

  .loader-dot {
    width: 10px;
    height: 10px;
    margin: 0 6px;
    background: #2563eb;
    border-radius: 50%;
    animation: loader-bounce 0.8s infinite ease-in-out;
  }

  .loader-dot:nth-child(2) {
    animation-delay: 0.1s;
  }
  .loader-dot:nth-child(3) {
    animation-delay: 0.2s;
  }

  @keyframes loader-bounce {
    0%,
    80%,
    100% {
      transform: translateY(0);
      opacity: 0.6;
    }
    40% {
      transform: translateY(-8px);
      opacity: 1;
    }
  }
</style>
