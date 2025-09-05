<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Trash2 } from 'lucide-svelte';

  let {
    nodeId,
    position = { x: 0, y: 0 },
    changeNodeShape,
    deleteNode,
    onClose
  }: {
    nodeId: string;
    position?: { x: number; y: number };
    changeNodeShape?: (nodeId: string, shapeId: string) => void;
    deleteNode?: (nodeId: string) => void;
    onClose?: () => void;
  } = $props();

  // shapes menu state
  let showShapes = $state(false);
  let activeTab = $state('Basic');
  let hoveredShape = $state('');
  let tooltipPosition = $state({ x: 0, y: 0 });

  const basicShapes = [
    {
      id: 'text',
      label: 'Text Block',
      svg: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><text x="24" y="28" text-anchor="middle" font-size="10" fill="currentColor">TEXT</text></svg>`
    },
    {
      id: 'rect',
      label: 'Rectangle',
      svg: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="16" width="28" height="16" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>`
    },
    {
      id: 'rounded',
      label: 'Rounded',
      svg: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="16" width="28" height="16" rx="8" ry="8" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>`
    },
    {
      id: 'stadium',
      label: 'Stadium',
      svg: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="18" width="28" height="12" rx="6" ry="6" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>`
    },
    {
      id: 'tri',
      label: 'Triangle',
      svg: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M24 8 L40 36 L8 36 Z" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>`
    },
    {
      id: 'diam',
      label: 'Diamond',
      svg: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M24 8 L40 24 L24 40 L8 24 Z" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>`
    },
    {
      id: 'hex',
      label: 'Hexagon',
      svg: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 12 L30 12 L36 24 L30 36 L18 36 L12 24 Z" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>`
    },
    {
      id: 'cyl',
      label: 'Cylinder',
      svg: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 16 a12 4 0,0,0 24 0 a12 4 0,0,0 -24 0 l0 16 a12 4 0,0,0 24 0 l0 -16" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>`
    },
    {
      id: 'h-cyl',
      label: 'Horizontal Cylinder',
      svg: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 12 a4 12 0,0,0 0 24 a4 12 0,0,0 0 -24 l16 0 a4 12 0,0,0 0 24 l-16 0" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>`
    },
    {
      id: 'circ',
      label: 'Circle',
      svg: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="24" cy="24" r="12" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>`
    },
    {
      id: 'dbl-circ',
      label: 'Double Circle',
      svg: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="24" cy="24" r="12" stroke="currentColor" stroke-width="1.5" fill="none"/><circle cx="24" cy="24" r="8" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>`
    },
    {
      id: 'sm-circ',
      label: 'Small Circle',
      svg: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="24" cy="24" r="8" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>`
    },
    {
      id: 'fr-circ',
      label: 'Framed Circle',
      svg: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="24" cy="24" r="12" stroke="currentColor" stroke-width="1.5" fill="none"/><circle cx="24" cy="24" r="9" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>`
    },
    {
      id: 'f-circ',
      label: 'Filled Circle',
      svg: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="24" cy="24" r="10" stroke="currentColor" stroke-width="1.5" fill="currentColor"/></svg>`
    },
    {
      id: 'lean-l',
      label: 'Parallelogram',
      svg: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 16 L38 16 L30 32 L10 32 Z" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>`
    },
    {
      id: 'lean-r',
      label: 'Parallelogram Reversed',
      svg: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 16 L34 16 L38 32 L18 32 Z" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>`
    },
    {
      id: 'trap-b',
      label: 'Trapezoid',
      svg: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 16 L36 16 L32 32 L16 32 Z" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>`
    },
    {
      id: 'trap-t',
      label: 'Trapezoid Reversed',
      svg: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 16 L32 16 L36 32 L12 32 Z" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>`
    },
    {
      id: 'card',
      label: 'Card',
      svg: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="16" width="28" height="16" stroke="currentColor" stroke-width="1.5" fill="none"/><rect x="8" y="20" width="4" height="8" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>`
    },
    {
      id: 'odd',
      label: 'Odd',
      svg: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 20 Q10 15 15 10 Q20 15 25 10 Q30 15 35 10 Q40 15 35 20 Q30 25 35 30 Q40 35 35 40 Q30 35 25 40 Q20 35 15 40 Q10 35 15 30 Q20 25 15 20 Z" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>`
    },
    {
      id: 'anchor',
      label: 'Anchor',
      svg: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="24" cy="12" r="4" stroke="currentColor" stroke-width="1.5" fill="none"/><line x1="24" y1="16" x2="24" y2="36" stroke="currentColor" stroke-width="1.5"/><path d="M12 28 Q12 36 24 36 Q36 36 36 28" stroke="currentColor" stroke-width="1.5" fill="none"/><line x1="18" y1="20" x2="30" y2="20" stroke="currentColor" stroke-width="1.5"/></svg>`
    }
  ];

  const processShapes = [
    {
      id: 'proc',
      label: 'Standard Process',
      svg: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="16" width="28" height="16" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>`
    },
    {
      id: 'subproc',
      label: 'Sub Process',
      svg: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="14" width="32" height="20" stroke="currentColor" stroke-width="1.5" fill="none"/><rect x="10" y="16" width="28" height="16" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>`
    },
    {
      id: 'tag-proc',
      label: 'Tagged Process',
      svg: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="16" width="28" height="16" stroke="currentColor" stroke-width="1.5" fill="none"/><rect x="6" y="12" width="8" height="8" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>`
    },
    {
      id: 'procs',
      label: 'Multi Process',
      svg: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="12" y="18" width="28" height="16" stroke="currentColor" stroke-width="1.5" fill="none"/><rect x="10" y="16" width="28" height="16" stroke="currentColor" stroke-width="1.5" fill="none"/><rect x="8" y="14" width="28" height="16" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>`
    },
    {
      id: 'div-proc',
      label: 'Divided Process',
      svg: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="16" width="28" height="16" stroke="currentColor" stroke-width="1.5" fill="none"/><line x1="24" y1="16" x2="24" y2="32" stroke="currentColor" stroke-width="1.5"/></svg>`
    },
    {
      id: 'extract',
      label: 'Extraction Process',
      svg: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M24 12 L36 32 L12 32 Z" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>`
    },
    {
      id: 'lin-proc',
      label: 'Lined Process',
      svg: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="16" width="28" height="16" stroke="currentColor" stroke-width="1.5" fill="none"/><line x1="16" y1="16" x2="16" y2="32" stroke="currentColor" stroke-width="1"/><line x1="22" y1="16" x2="22" y2="32" stroke="currentColor" stroke-width="1"/><line x1="32" y1="16" x2="32" y2="32" stroke="currentColor" stroke-width="1"/></svg>`
    },
    {
      id: 'in-out',
      label: 'In Out',
      svg: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 16 L34 16 L30 32 L10 32 Z" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>`
    },
    {
      id: 'out-in',
      label: 'Out In',
      svg: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 16 L38 16 L34 32 L14 32 Z" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>`
    },
    {
      id: 'manual-file',
      label: 'Manual File Action',
      svg: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 32 L24 12 L36 32 Z" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>`
    },
    {
      id: 'priority',
      label: 'Priority Action',
      svg: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 16 L36 16 L32 32 L16 32 Z" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>`
    },
    {
      id: 'collate',
      label: 'Collate Action',
      svg: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 12 L30 24 L18 36 M30 12 L18 24 L30 36" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>`
    },
    {
      id: 'loop-limit',
      label: 'Loop Limit',
      svg: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 20 L18 12 L30 12 L36 20 L30 32 L18 32 Z" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>`
    },
    {
      id: 'manual-input',
      label: 'Manual Input',
      svg: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 20 L38 16 L38 32 L10 32 Z" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>`
    },
    {
      id: 'event',
      label: 'Event',
      svg: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="16" width="28" height="16" rx="8" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>`
    },
    {
      id: 'start',
      label: 'Start',
      svg: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="24" cy="24" r="12" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>`
    },
    {
      id: 'stop',
      label: 'Stop',
      svg: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="24" cy="24" r="12" stroke="currentColor" stroke-width="1.5" fill="none"/><circle cx="24" cy="24" r="8" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>`
    },
    {
      id: 'fork',
      label: 'Fork/Join',
      svg: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="20" width="32" height="8" stroke="currentColor" stroke-width="1.5" fill="currentColor"/></svg>`
    },
    {
      id: 'terminal',
      label: 'Terminal',
      svg: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="18" width="28" height="12" rx="6" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>`
    },
    {
      id: 'delay',
      label: 'Delay',
      svg: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="16" width="28" height="16" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M38 16 Q42 24 38 32" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>`
    },
    {
      id: 'junction',
      label: 'Junction',
      svg: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="24" cy="24" r="10" stroke="currentColor" stroke-width="1.5" fill="currentColor"/></svg>`
    },
    {
      id: 'decision',
      label: 'Decision',
      svg: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M24 8 L40 24 L24 40 L8 24 Z" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>`
    },
    {
      id: 'doc',
      label: 'Document',
      svg: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 12 L38 12 L38 32 Q32 36 24 32 Q16 36 10 32 Z" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>`
    },
    {
      id: 'tag-doc',
      label: 'Tagged Document',
      svg: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 12 L38 12 L38 32 Q32 36 24 32 Q16 36 10 32 Z" stroke="currentColor" stroke-width="1.5" fill="none"/><rect x="6" y="8" width="8" height="8" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>`
    },
    {
      id: 'docs',
      label: 'Multiple Documents',
      svg: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 14 L40 14 L40 34 Q34 38 26 34 Q18 38 12 34 Z" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M10 12 L38 12 L38 32 Q32 36 24 32 Q16 36 10 32 Z" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>`
    },
    {
      id: 'comment',
      label: 'Comment',
      svg: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 10 Q14 10 14 14 L14 20 Q14 24 10 24 Q14 24 14 28 L14 34 Q14 38 18 38" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>`
    },
    {
      id: 'brace-r',
      label: 'Comment Right',
      svg: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M30 10 Q34 10 34 14 L34 20 Q34 24 38 24 Q34 24 34 28 L34 34 Q34 38 30 38" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>`
    },
    {
      id: 'braces',
      label: 'Braces',
      svg: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 10 Q14 10 14 14 L14 20 Q14 24 10 24 Q14 24 14 28 L14 34 Q14 38 18 38" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M30 10 Q34 10 34 14 L34 20 Q34 24 38 24 Q34 24 34 28 L34 34 Q34 38 30 38" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>`
    },
    {
      id: 'summary',
      label: 'Summary',
      svg: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="24" cy="24" r="12" stroke="currentColor" stroke-width="1.5" fill="none"/><line x1="16" y1="16" x2="32" y2="32" stroke="currentColor" stroke-width="1.5"/><line x1="32" y1="16" x2="16" y2="32" stroke="currentColor" stroke-width="1.5"/></svg>`
    },
    {
      id: 'lin-doc',
      label: 'Lined Document',
      svg: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 12 L38 12 L38 32 Q32 36 24 32 Q16 36 10 32 Z" stroke="currentColor" stroke-width="1.5" fill="none"/><line x1="14" y1="16" x2="34" y2="16" stroke="currentColor" stroke-width="1"/><line x1="14" y1="20" x2="34" y2="20" stroke="currentColor" stroke-width="1"/><line x1="14" y1="24" x2="34" y2="24" stroke="currentColor" stroke-width="1"/></svg>`
    }
  ];

  const technicalShapes = [
    {
      id: 'db',
      label: 'Database',
      svg: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 16 a12 4 0,0,0 24 0 a12 4 0,0,0 -24 0 l0 16 a12 4 0,0,0 24 0 l0 -16" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>`
    },
    {
      id: 'disk',
      label: 'Disk Storage',
      svg: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 16 a12 4 0,0,0 24 0 a12 4 0,0,0 -24 0 l0 16 a12 4 0,0,0 24 0 l0 -16" stroke="currentColor" stroke-width="1.5" fill="none"/><line x1="18" y1="16" x2="18" y2="32" stroke="currentColor" stroke-width="1"/><line x1="30" y1="16" x2="30" y2="32" stroke="currentColor" stroke-width="1"/></svg>`
    },
    {
      id: 'das',
      label: 'Direct Access Storage',
      svg: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 16 a4 8 0,0,0 0 16 a4 8 0,0,0 0 -16 l16 0 a4 8 0,0,0 0 16 l-16 0" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>`
    },
    {
      id: 'internal-storage',
      label: 'Internal Storage',
      svg: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="16" width="28" height="16" stroke="currentColor" stroke-width="1.5" fill="none"/><line x1="24" y1="16" x2="24" y2="32" stroke="currentColor" stroke-width="1"/><line x1="10" y1="24" x2="38" y2="24" stroke="currentColor" stroke-width="1"/></svg>`
    },
    {
      id: 'display',
      label: 'Display',
      svg: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 16 L36 16 Q40 20 40 24 Q40 28 36 32 L12 32 Q8 28 8 24 Q8 20 12 16 Z" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>`
    },
    {
      id: 'stored-data',
      label: 'Stored Data',
      svg: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 20 L24 12 L38 20 L24 28 L10 20 M10 20 L24 28 L38 20 L24 36 L10 28 Z" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>`
    },
    {
      id: 'com-link',
      label: 'Communication Link',
      svg: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 8 L14 20 L22 20 L18 36 L32 16 L24 16 L28 8 Z" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>`
    },
    {
      id: 'paper-tape',
      label: 'Paper Tape',
      svg: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 12 L35 12 L30 24 L35 36 L10 36 Z" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>`
    }
  ];

  function handleShapeSelect(shapeId: string) {
    changeNodeShape?.(nodeId, shapeId);
    showShapes = false;
    onClose?.();
  }

  function handleDeleteNode() {
    deleteNode?.(nodeId);
    onClose?.();
  }

  function handleShapeHover(shape: any, event: MouseEvent) {
    hoveredShape = shape.label;
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    tooltipPosition = {
      x: rect.left + rect.width / 2,
      y: rect.top - 8
    };
  }

  function handleShapeLeave() {
    hoveredShape = '';
  }

  // Clear tooltip when menu closes
  $effect(() => {
    if (!showShapes) {
      hoveredShape = '';
    }
  });

  $effect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!target.closest('.node-toolbar')) {
        onClose?.();
      }
    };

    // Add a small delay to prevent immediate closing
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside);
    };
  });
</script>

<!-- Node Toolbar -->
<div
  class="node-toolbar fixed z-50 rounded-lg border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-800"
  style="left: {position.x}px; top: {position.y}px;">
  <div class="flex items-center gap-2">
    <!-- Change Shape Button -->
    <Button
      variant="outline"
      size="sm"
      onclick={() => (showShapes = !showShapes)}
      class="h-8 px-2 text-xs">
      <svg class="mr-1 h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M12 2 L22 8.5 L17 21 L7 21 L2 8.5 Z"
          stroke="currentColor"
          stroke-width="1.5"
          fill="none" />
      </svg>
      Change Shape
    </Button>

    <!-- Delete Button -->
    <Button
      variant="outline"
      size="sm"
      onclick={handleDeleteNode}
      class="h-8 px-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700">
      <Trash2 class="mr-1 h-4 w-4" />
      Delete
    </Button>

    <!-- Close Button -->
    <Button
      variant="ghost"
      size="sm"
      onclick={onClose}
      class="h-8 w-8 p-0 text-gray-500 hover:text-gray-700">
      ×
    </Button>
  </div>

  <!-- Shapes Menu (similar to PanZoomToolbar) -->
  {#if showShapes}
    <div
      class="z-60 absolute left-0 top-full mt-2 min-w-[320px] max-w-[400px] rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
      <!-- Tabs -->
      <div class="flex border-b border-gray-200 dark:border-gray-700">
        {#each ['Basic', 'Process', 'Technical'] as tab}
          <button
            type="button"
            class="flex-1 px-3 py-2 text-sm font-medium transition-colors {activeTab === tab
              ? 'border-b-2 border-blue-600 bg-blue-50 text-blue-600 dark:bg-blue-900/20'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}"
            onclick={() => (activeTab = tab)}>
            {tab}
          </button>
        {/each}
      </div>

      <!-- Shape Grid -->
      <div class="max-h-64 overflow-y-auto p-3">
        <div class="grid grid-cols-6 gap-2">
          {#each activeTab === 'Basic' ? basicShapes : activeTab === 'Process' ? processShapes : technicalShapes as shape}
            <button
              type="button"
              class="group flex items-center justify-center rounded-lg border border-gray-200 p-3 transition-all duration-200 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-700"
              onclick={() => handleShapeSelect(shape.id)}
              onmouseenter={(e) => handleShapeHover(shape, e)}
              onmouseleave={handleShapeLeave}>
              <div
                class="h-6 w-6 text-gray-700 group-hover:text-blue-600 dark:text-gray-300 dark:group-hover:text-blue-400">
                {@html shape.svg}
              </div>
            </button>
          {/each}
        </div>
      </div>
    </div>
  {/if}
</div>

<!-- Custom Tooltip -->
{#if hoveredShape}
  <div
    class="pointer-events-none fixed z-[100] -translate-x-1/2 -translate-y-full transform rounded bg-gray-900 px-2 py-1 text-xs text-white shadow-lg"
    style="left: {tooltipPosition.x}px; top: {tooltipPosition.y}px;">
    {hoveredShape}
    <div
      class="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 transform border-l-[4px] border-r-[4px] border-t-[4px] border-l-transparent border-r-transparent border-t-gray-900">
    </div>
  </div>
{/if}
