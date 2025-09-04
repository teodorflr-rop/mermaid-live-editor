<script lang="ts" module>
  import { logEvent } from '$lib/util/stats';
  import { version } from 'mermaid/package.json';

  void logEvent('version', {
    mermaidVersion: version
  });
</script>

<script lang="ts">
</script>

<nav class="z-50 flex p-4 sm:p-6">
  <div class="flex flex-1 items-center gap-4"></div>
</nav>
