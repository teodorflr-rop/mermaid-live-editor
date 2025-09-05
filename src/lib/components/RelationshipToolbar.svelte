<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Trash2 } from 'lucide-svelte';

  let {
    relationshipId,
    position = { x: 0, y: 0 },
    changeRelationshipStyle,
    deleteRelationship,
    onClose
  }: {
    relationshipId: string;
    position?: { x: number; y: number };
    changeRelationshipStyle?: (
      relationshipId: string,
      arrowType: string,
      strokeType: string
    ) => void;
    deleteRelationship?: (relationshipId: string) => void;
    onClose?: () => void;
  } = $props();

  // Toolbar state
  let showArrows = $state(false);
  let showStrokes = $state(false);
  let hoveredOption = $state<any>(null);
  let tooltipPosition = $state({ x: 0, y: 0 });

  const arrowTypes = [
    {
      id: 'arrow',
      label: 'Arrow',
      svg: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 24 L35 24 M30 19 L35 24 L30 29" stroke="currentColor" stroke-width="2" fill="none"/></svg>`,
      mermaidSyntax: '-->'
    },
    {
      id: 'arrow-cross',
      label: 'Arrow with Cross',
      svg: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 24 L32 24 M27 19 L32 24 L27 29" stroke="currentColor" stroke-width="2" fill="none"/><path d="M35 21 L39 27 M39 21 L35 27" stroke="currentColor" stroke-width="2"/></svg>`,
      mermaidSyntax: '--x'
    },
    {
      id: 'double-arrow',
      label: 'Double Arrow',
      svg: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 24 L40 24 M35 19 L40 24 L35 29 M13 19 L8 24 L13 29" stroke="currentColor" stroke-width="2" fill="none"/></svg>`,
      mermaidSyntax: '<-->'
    },
    {
      id: 'line-arrow',
      label: 'Line with Arrow',
      svg: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 24 L35 24 M30 19 L35 24 L30 29" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="8" cy="24" r="2" fill="currentColor"/></svg>`,
      mermaidSyntax: '-..->'
    },
    {
      id: 'line-dot',
      label: 'Line with Dot',
      svg: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 24 L32 24" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="8" cy="24" r="2" fill="currentColor"/><circle cx="35" cy="24" r="2" fill="currentColor"/></svg>`,
      mermaidSyntax: '-..-'
    },
    {
      id: 'thick-arrow',
      label: 'Thick Arrow',
      svg: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 24 L35 24 M30 19 L35 24 L30 29" stroke="currentColor" stroke-width="3" fill="none"/></svg>`,
      mermaidSyntax: '==>'
    }
  ];

  const strokeTypes = [
    {
      id: 'solid',
      label: 'Solid Line',
      svg: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 24 L40 24" stroke="currentColor" stroke-width="2"/></svg>`,
      mermaidPrefix: ''
    },
    {
      id: 'dotted',
      label: 'Dotted Line',
      svg: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 24 L40 24" stroke="currentColor" stroke-width="2" stroke-dasharray="2,3"/></svg>`,
      mermaidPrefix: '-.'
    },
    {
      id: 'dashed',
      label: 'Dashed Line',
      svg: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 24 L40 24" stroke="currentColor" stroke-width="2" stroke-dasharray="6,3"/></svg>`,
      mermaidPrefix: '--'
    },
    {
      id: 'none',
      label: 'No Line',
      svg: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><text x="24" y="28" text-anchor="middle" font-size="10" fill="currentColor">NONE</text></svg>`,
      mermaidPrefix: '~~~'
    }
  ];

  function handleOptionHover(option: any, event: MouseEvent) {
    hoveredOption = option;
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    tooltipPosition = {
      x: rect.left + rect.width / 2,
      y: rect.top - 8
    };
  }

  function handleOptionLeave() {
    hoveredOption = null;
  }

  // Clear tooltips when menus close
  $effect(() => {
    if (!showArrows && !showStrokes) {
      hoveredOption = null;
    }
  });

  $effect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!target.closest('.relationship-toolbar')) {
        onClose?.();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  });
</script>

<div
  class="relationship-toolbar fixed z-50 flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-600 dark:bg-gray-800"
  style="left: {position.x}px; top: {position.y}px;">
  <!-- Arrow Types Button -->
  <div class="relative">
    <Button
      variant="ghost"
      size="icon"
      onclick={() => {
        showArrows = !showArrows;
        showStrokes = false;
      }}
      class="h-8 w-8 hover:bg-blue-50 dark:hover:bg-blue-900/20">
      <svg
        width="16"
        height="16"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <path
          d="M8 24 L35 24 M30 19 L35 24 L30 29"
          stroke="currentColor"
          stroke-width="2"
          fill="none" />
      </svg>
    </Button>

    {#if showArrows}
      <div
        class="absolute left-0 top-full mt-2 w-64 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800">
        <div class="p-3">
          <h3 class="mb-3 text-sm font-medium text-gray-900 dark:text-gray-100">Arrow</h3>
          <div class="grid grid-cols-3 gap-2">
            {#each arrowTypes as arrow}
              <button
                type="button"
                class="group flex items-center justify-center rounded-lg border border-gray-200 p-3 transition-all duration-200 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-700"
                onclick={() => {
                  showArrows = false;
                  changeRelationshipStyle?.(relationshipId, arrow.mermaidSyntax, '');
                }}
                onmouseenter={(e) => handleOptionHover(arrow, e)}
                onmouseleave={handleOptionLeave}>
                <div
                  class="h-6 w-6 text-gray-700 group-hover:text-blue-600 dark:text-gray-300 dark:group-hover:text-blue-400">
                  {@html arrow.svg}
                </div>
              </button>
            {/each}
          </div>
        </div>
      </div>
    {/if}
  </div>

  <!-- Stroke Types Button -->
  <div class="relative">
    <Button
      variant="ghost"
      size="icon"
      onclick={() => {
        showStrokes = !showStrokes;
        showArrows = false;
      }}
      class="h-8 w-8 hover:bg-blue-50 dark:hover:bg-blue-900/20">
      <svg
        width="16"
        height="16"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <path d="M8 24 L40 24" stroke="currentColor" stroke-width="2" stroke-dasharray="6,3" />
      </svg>
    </Button>

    {#if showStrokes}
      <div
        class="absolute left-0 top-full mt-2 w-64 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800">
        <div class="p-3">
          <h3 class="mb-3 text-sm font-medium text-gray-900 dark:text-gray-100">Stroke</h3>
          <div class="grid grid-cols-2 gap-2">
            {#each strokeTypes as stroke}
              <button
                type="button"
                class="group flex items-center justify-center rounded-lg border border-gray-200 p-3 transition-all duration-200 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-700"
                onclick={() => {
                  showStrokes = false;
                  changeRelationshipStyle?.(relationshipId, '', stroke.mermaidPrefix);
                }}
                onmouseenter={(e) => handleOptionHover(stroke, e)}
                onmouseleave={handleOptionLeave}>
                <div
                  class="h-6 w-6 text-gray-700 group-hover:text-blue-600 dark:text-gray-300 dark:group-hover:text-blue-400">
                  {@html stroke.svg}
                </div>
              </button>
            {/each}
          </div>
        </div>
      </div>
    {/if}
  </div>

  <!-- Delete Button -->
  <Button
    variant="ghost"
    size="icon"
    onclick={() => deleteRelationship?.(relationshipId)}
    class="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20">
    <Trash2 size={16} />
  </Button>
</div>

<!-- Custom tooltip -->
{#if hoveredOption && tooltipPosition.x > 0}
  <div
    class="pointer-events-none fixed z-50 rounded-lg bg-gray-900 px-2 py-1 text-sm font-medium text-white shadow-sm dark:bg-gray-700"
    style="left: {tooltipPosition.x}px; top: {tooltipPosition.y}px; transform: translate(-50%, -100%);">
    {hoveredOption.label}
    <div
      class="absolute left-1/2 top-full -translate-x-1/2 transform border-4 border-transparent border-t-gray-900 dark:border-t-gray-700">
    </div>
  </div>
{/if}
