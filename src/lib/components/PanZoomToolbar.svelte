<script lang="ts">
  import { Button } from '$/components/ui/button';
  import type { PanZoomState } from '$/util/panZoom';
  import CenterIcon from '~icons/material-symbols/open-in-full-rounded';
  import PanIcon from '~icons/material-symbols/pan-tool-rounded';
  import ResetIcon from '~icons/material-symbols/screenshot-frame-2';
  import ZoomInIcon from '~icons/material-symbols/zoom-in';
  import ZoomOutIcon from '~icons/material-symbols/zoom-out';
  import FloatingToolbar from './FloatingToolbar.svelte';

  let { panZoomState }: { panZoomState: PanZoomState } = $props();

  import { onMount } from 'svelte';

  // local pressed state for the Toggle. Default should be disabled (false).
  let pressed = $state(false);
  let initialized = false;

  onMount(() => {
    // initialize from the panZoomState if provided
    if (panZoomState) {
      pressed = !!panZoomState.isPanEnabled;
      // keep local pressed in sync when pan state changes elsewhere
      panZoomState.onPanEnabledChange = (enabled: boolean) => {
        pressed = enabled;
      };
    }
    initialized = true;
  });

  // when the toggle is changed by the user, enable/disable pan on the panZoomState
  $effect(() => {
    if (!initialized || !panZoomState) return;
    if (pressed) {
      panZoomState.enablePan();
    } else {
      panZoomState.disablePan();
    }
  });
</script>

<FloatingToolbar>
  <!-- Pan toggle button: styled to match attached images -->
  <button
    aria-pressed={pressed}
    title="Pan toggle"
    class={[
      'rounded-xl p-2',
      pressed ? 'bg-slate-900 text-white' : 'bg-white text-slate-700',
      'border border-transparent shadow-sm'
    ]}
    onclick={() => (pressed = !pressed)}>
    <span class="sr-only">Toggle pan</span>
    <PanIcon />
  </button>

  <Button variant="ghost" size="icon" title="Zoom In" onclick={() => panZoomState.zoomIn()}>
    <ZoomInIcon />
  </Button>

  <Button variant="ghost" size="icon" title="Zoom Out" onclick={() => panZoomState.zoomOut()}>
    <ZoomOutIcon />
  </Button>

  <Button variant="ghost" size="icon" title="Center" onclick={() => panZoomState.center()}>
    <CenterIcon />
  </Button>

  <Button variant="ghost" size="icon" title="Reset View" onclick={() => panZoomState.reset()}>
    <ResetIcon />
  </Button>
</FloatingToolbar>
