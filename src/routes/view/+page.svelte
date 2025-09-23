<script lang="ts">
  import View from '$/components/View.svelte';
  import { inputStateStore, updateCode } from '$/util/state';
  import { initHandler } from '$/util/util';
  import { onDestroy, onMount } from 'svelte';
  import { get } from 'svelte/store';

  let showLoader = true;
  let loaderTimeout: ReturnType<typeof setTimeout> | null = null;
  let showRenderingMessage = false;
  let renderingMessageTimeout: ReturnType<typeof setTimeout> | null = null;
  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

  function handleParentContentLoaded() {
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

  function onViewRendered() {
    if (isInIframe) {
      // if parent already loaded content, hide loader
      if ((window as any).__mermaidLiferay_lastLoad) {
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
        // wait for parent content
      }
    } else {
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

  onMount(() => {
    initHandler();
    if (loaderTimeout == null) {
      loaderTimeout = setTimeout(() => {
        showLoader = false;
        loaderTimeout = null;
      }, 5000);
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('mermaid:contentLoaded', handleParentContentLoaded as EventListener);
      // expose global hooks for Liferay integration so parent can load content into view-only pages
      try {
        window.inputStateStore = inputStateStore;
        window.updateCode = updateCode;
        window.get = get;
      } catch (e) {
        // ignore
      }
    }
  });

  onDestroy(() => {
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
      try {
        delete window.inputStateStore;
        delete window.updateCode;
        delete window.get;
      } catch (e) {
        // ignore
      }
    }
  });
</script>

<svelte:head>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="relative h-full w-full">
  <View shouldShowGrid={false} viewOnlyMode={true} on:rendered={onViewRendered} />

  {#if showLoader}
    <div class="absolute inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur">
      <div class="flex items-center gap-3">
        <div class="h-2.5 w-2.5 animate-pulse rounded-full bg-blue-600"></div>
        <div
          class="h-2.5 w-2.5 animate-pulse rounded-full bg-blue-600"
          style="animation-delay:100ms">
        </div>
        <div
          class="h-2.5 w-2.5 animate-pulse rounded-full bg-blue-600"
          style="animation-delay:200ms">
        </div>
      </div>
    </div>
  {/if}
  {#if showRenderingMessage}
    <div
      class="z-60 absolute right-4 top-4 rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800">
      Rendering...
    </div>
  {/if}
</div>
