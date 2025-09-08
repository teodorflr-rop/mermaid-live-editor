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
  import { Switch } from '$/components/ui/switch';
  import VersionSecurityToolbar from '$/components/VersionSecurityToolbar.svelte';
  import View from '$/components/View.svelte';
  import type { EditorMode, Tab } from '$/types';
  import { PanZoomState } from '$/util/panZoom';
  import { stateStore, updateCodeStore } from '$/util/state';
  import { logEvent } from '$/util/stats';
  import { initHandler } from '$/util/util';
  import { onMount } from 'svelte';
  import CodeIcon from '~icons/custom/code';
  import GearIcon from '~icons/material-symbols/settings-outline-rounded';
  // Create an unlinked node with a given mermaid shape id
  import { inputStateStore, updateCode } from '$/util/state';
  import { get } from 'svelte/store';
  import { env } from '$/util/env';

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

  // Check for URL parameter override for easier testing
  let effectiveViewOnlyMode = $derived(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlOverride = urlParams.get('viewOnly');
      if (urlOverride === 'true') {
        return true;
      }
      if (urlOverride === 'false') {
        return false;
      }
    }
    return env.viewOnlyMode;
  });

  onMount(async () => {
    await initHandler();
    window.addEventListener('appinstalled', () => {
      logEvent('pwaInstalled', { isMobile });
    });
  });

  let isHistoryOpen = $state(false);

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

  <Navbar {effectiveViewOnlyMode}></Navbar>

  <div class="flex flex-1 flex-col overflow-hidden" bind:clientWidth={width}>
    {#if effectiveViewOnlyMode}
      <!-- View-only mode: Show only the diagram -->
      <div class="relative flex h-full flex-1 flex-col overflow-hidden">
        <View {panZoomState} shouldShowGrid={$stateStore.grid} viewOnlyMode={true} />
        <div class="absolute bottom-0 right-0"><VersionSecurityToolbar /></div>
        
        <!-- Developer mode toggle for testing (only show if URL override is active) -->
        {#if typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('viewOnly')}
          <div class="absolute top-0 left-0 m-4">
            <div class="flex items-center gap-2 rounded-md bg-gray-100 px-3 py-1 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
              <span>Dev Mode:</span>
              <a 
                href="?viewOnly=false" 
                class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                Enable Editing
              </a>
              |
              <a 
                href="?" 
                class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                Default
              </a>
            </div>
          </div>
        {/if}
      </div>
    {:else}
      <!-- Full interactive mode -->
      <div
        class={[
          'size-full',
          isMobile && ['w-[200%] duration-300', isViewMode && '-translate-x-1/2']
        ]}>
        <!-- Developer mode toggle for testing (only show if URL override is active) -->
        {#if typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('viewOnly')}
          <div class="absolute top-0 left-0 m-4 z-50">
            <div class="flex items-center gap-2 rounded-md bg-gray-100 px-3 py-1 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
              <span>Dev Mode:</span>
              <a 
                href="?viewOnly=true" 
                class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                View Only
              </a>
              |
              <a 
                href="?" 
                class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                Default
              </a>
            </div>
          </div>
        {/if}
        
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
            <View {panZoomState} shouldShowGrid={$stateStore.grid} />
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
