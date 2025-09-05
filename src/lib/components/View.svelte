<script lang="ts">
  import type { State, ValidatedState } from '$/types';
  import { recordRenderTime, shouldRefreshView } from '$/util/autoSync';
  import { render as renderDiagram } from '$/util/mermaid';
  import { PanZoomState } from '$/util/panZoom';
  import { inputStateStore, stateStore, updateCode, updateCodeStore } from '$/util/state';
  import { logEvent, saveStatistics } from '$/util/stats';
  import FontAwesome, { mayContainFontAwesome } from '$lib/components/FontAwesome.svelte';
  import NodeToolbar from '$lib/components/NodeToolbar.svelte';
  import RelationshipToolbar from '$lib/components/RelationshipToolbar.svelte';
  import uniqueID from 'lodash-es/uniqueId';
  import type { MermaidConfig } from 'mermaid';
  import { mode } from 'mode-watcher';
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { Svg2Roughjs } from 'svg2roughjs';

  let {
    panZoomState = new PanZoomState(),
    shouldShowGrid = true
  }: { panZoomState?: PanZoomState; shouldShowGrid?: boolean } = $props();
  let code = '';
  let config = '';
  let container: HTMLDivElement | undefined = $state();
  let rough: boolean;
  let view: HTMLDivElement | undefined = $state();
  let error = $state(false);
  let panZoom = true;
  let manualUpdate = true;
  let waitForFontAwesomeToLoad: FontAwesome['waitForFontAwesomeToLoad'] | undefined = $state();

  // Node toolbar state
  let showNodeToolbar = $state(false);
  let selectedNodeId = $state('');
  let nodeToolbarPosition = $state({ x: 0, y: 0 });

  // Relationship toolbar state
  let showRelationshipToolbar = $state(false);
  let selectedRelationshipId = $state('');
  let relationshipToolbarPosition = $state({ x: 0, y: 0 });

  // Set up panZoom state observer to update the store when pan/zoom changes
  const setupPanZoomObserver = () => {
    panZoomState.onPanZoomChange = (pan, zoom) => {
      updateCodeStore({ pan, zoom });
      logEvent('panZoom');
    };
  };

  const handlePanZoom = (state: State, graphDiv: SVGSVGElement) => {
    panZoomState.updateElement(graphDiv, state);
  };

  const handleStateChange = async (state: ValidatedState) => {
    const startTime = Date.now();
    if (state.error !== undefined) {
      error = true;
      return;
    }
    error = false;
    let diagramType: string | undefined;
    try {
      if (container) {
        manualUpdate = true;
        // Do not render if there is no change in Code/Config/PanZoom
        if (
          code === state.code &&
          config === state.mermaid &&
          rough === state.rough &&
          panZoom === state.panZoom
        ) {
          return;
        }

        if (!shouldRefreshView()) {
          return;
        }

        code = state.code;
        config = state.mermaid;
        rough = state.rough;
        panZoom = state.panZoom ?? true;

        if (mayContainFontAwesome(code)) {
          await waitForFontAwesomeToLoad?.();
        }

        const scroll = view?.parentElement?.scrollTop;
        delete container.dataset.processed;
        const viewID = uniqueID('graph-');
        const {
          svg,
          bindFunctions,
          diagramType: detectedDiagramType
        } = await renderDiagram(JSON.parse(state.mermaid) as MermaidConfig, code, viewID);
        diagramType = detectedDiagramType;
        if (svg.length > 0) {
          container.innerHTML = svg;
          let graphDiv = document.querySelector<SVGSVGElement>(`#${viewID}`);
          if (!graphDiv) {
            throw new Error('graph-div not found');
          }
          if (state.rough) {
            const svg2roughjs = new Svg2Roughjs('#container');
            svg2roughjs.svg = graphDiv;
            await svg2roughjs.sketch();
            graphDiv.remove();
            const sketch = document.querySelector<SVGSVGElement>('#container > svg');
            if (!sketch) {
              throw new Error('sketch not found');
            }
            const height = sketch.getAttribute('height');
            const width = sketch.getAttribute('width');
            sketch.setAttribute('id', 'graph-div');
            sketch.setAttribute('height', '100%');
            sketch.setAttribute('width', '100%');
            sketch.setAttribute('viewBox', `0 0 ${width} ${height}`);
            sketch.style.maxWidth = '100%';
            graphDiv = sketch;
          } else {
            graphDiv.setAttribute('height', '100%');
            graphDiv.style.maxWidth = '100%';
            if (bindFunctions) {
              bindFunctions(graphDiv);
            }
            // Attach drag-to-create-node handlers when pan is disabled
            attachDragToCreate(graphDiv);
          }
          if (state.panZoom) {
            handlePanZoom(state, graphDiv);
          }
        }
        if (view?.parentElement && scroll) {
          view.parentElement.scrollTop = scroll;
        }
        error = false;
      } else if (manualUpdate) {
        manualUpdate = false;
      }
    } catch (error_) {
      console.error('view fail', error_);
      error = true;
    }
    const renderTime = Date.now() - startTime;
    saveStatistics({ code, diagramType, isRough: state.rough, renderTime });
    recordRenderTime(renderTime, () => {
      $inputStateStore.updateDiagram = true;
    });
  };

  onMount(() => {
    setupPanZoomObserver();
    // Queue state changes to avoid race condition
    let pendingStateChange = Promise.resolve();
    stateStore.subscribe((state) => {
      pendingStateChange = pendingStateChange.then(() => handleStateChange(state).catch(() => {}));
    });
  });

  // Drag-to-create helpers
  function selectNode(n: Element) {
    const svg = view?.querySelector('svg');
    if (!svg) {return;}

    // deselect previous
    const previous = svg.querySelector('[data-selected="1"]');
    if (previous && previous !== n) {
      deselectNode(previous);
    }
    // mark this one selected
    n.dataset.selected = '1';
    const rect = n.querySelector<SVGRectElement>('rect');
    if (rect) {
      // save original attributes
      if (!rect.dataset.origStroke) {
        const s = rect.getAttribute('stroke') || '';
        const sw = rect.getAttribute('stroke-width') || '';
        rect.dataset.origStroke = s;
        rect.dataset.origStrokeWidth = sw;
      }
      rect.setAttribute('stroke', '#0f172a');
      rect.setAttribute('stroke-width', '2');
    }
  }

  function deselectNode(n: Element) {
    delete n.dataset.selected;
    const rect = n.querySelector<SVGRectElement>('rect');
    if (rect) {
      const orig = rect.dataset.origStroke;
      const origw = rect.dataset.origStrokeWidth;
      if (orig !== null) {
        if (orig === '') {rect.removeAttribute('stroke');}
        else {rect.setAttribute('stroke', orig);}
      }
      if (origw !== null) {
        if (origw === '') {rect.removeAttribute('stroke-width');}
        else {rect.setAttribute('stroke-width', origw);}
      }
      delete rect.dataset.origStroke;
      delete rect.dataset.origStrokeWidth;
    }
  }

  function attachDragToCreate(svg: SVGSVGElement) {
    // remove previous handlers if any
    for (const element of svg.querySelectorAll('[data-drag-create]')) {
      delete element.dataset.dragCreate;
    }

    const nodes = svg.querySelectorAll<SVGElement>('.node');
    for (const node of nodes) {
      if ((node as unknown as HTMLElement).dataset?.dragCreate) {continue;}
      ((node as unknown as HTMLElement).dataset as any).dragCreate = '1';

      let dragging = false;
      let startX = 0;
      let startY = 0;
      let tempLine: SVGLineElement | null = null;
      let isDragAction = false;
      let pointerDownTime = 0;

      const onPointerDown = (e: PointerEvent) => {
        // only proceed if pan is disabled
        if (panZoomState.isPanEnabled) {return;}

        pointerDownTime = Date.now();
        isDragAction = false;
        startX = e.clientX;
        startY = e.clientY;

        // Don't start dragging immediately - wait for movement
        svg.setPointerCapture?.(e.pointerId);
      };

      const onPointerMove = (e: PointerEvent) => {
        if (!startX || !startY) {return;}

        const deltaX = Math.abs(e.clientX - startX);
        const deltaY = Math.abs(e.clientY - startY);
        const dragThreshold = 5; // pixels

        // If we've moved beyond threshold, start drag action
        if ((deltaX > dragThreshold || deltaY > dragThreshold) && !isDragAction) {
          isDragAction = true;
          dragging = true;

          // select this node visually (deselect others)
          selectNode(node);

          // Close any open node toolbar since we're dragging
          showNodeToolbar = false;

          // Get the center point of the node to start the line from
          const nodeRect = node.getBoundingClientRect();
          const svgRect = svg.getBoundingClientRect();

          // Calculate node center relative to SVG
          const nodeCenterX = nodeRect.left + nodeRect.width / 2 - svgRect.left;
          const nodeCenterY = nodeRect.top + nodeRect.height / 2 - svgRect.top;

          // Current pointer position relative to SVG
          const currentSvgX = e.clientX - svgRect.left;
          const currentSvgY = e.clientY - svgRect.top;

          // create temporary line from node center to current position
          tempLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          tempLine.setAttribute('x1', String(nodeCenterX));
          tempLine.setAttribute('y1', String(nodeCenterY));
          tempLine.setAttribute('x2', String(currentSvgX));
          tempLine.setAttribute('y2', String(currentSvgY));
          tempLine.setAttribute('stroke', '#888');
          tempLine.setAttribute('stroke-width', '2');
          tempLine.setAttribute('stroke-dasharray', '4');
          tempLine.style.pointerEvents = 'none';
          svg.append(tempLine);
        }

        if (dragging && tempLine) {
          // Convert current screen coordinates to SVG coordinates
          const svgRect = svg.getBoundingClientRect();
          const svgCurrentX = e.clientX - svgRect.left;
          const svgCurrentY = e.clientY - svgRect.top;

          tempLine.setAttribute('x2', String(svgCurrentX));
          tempLine.setAttribute('y2', String(svgCurrentY));
        }
      };
      const onPointerUp = async (e: PointerEvent) => {
        svg.releasePointerCapture?.(e.pointerId);

        // If it was a drag action, check what we dropped on
        if (isDragAction && dragging) {
          dragging = false;
          if (tempLine && tempLine.parentElement) {tempLine.remove();}
          tempLine = null;

          // Check if we dropped on another node
          const elementUnderPointer = document.elementFromPoint(e.clientX, e.clientY);
          const targetNode = elementUnderPointer?.closest('.node');

          if (targetNode && targetNode !== node) {
            // Dropped on another node - create connection between nodes
            const state = get(inputStateStore);
            const code = state.code || '';
            const originId = getNodeIdFromElement(node);
            const targetId = getNodeIdFromElement(targetNode);

            // Add connection between existing nodes
            const addition = `\n    ${originId} --> ${targetId}`;
            updateCode(code + addition, { updateDiagram: true });
          } else {
            // Dropped on empty space - create new node with connection
            const state = get(inputStateStore);
            const code = state.code || '';
            // create unique node id
            const newId = 'N' + Math.floor(Math.random() * 100_000);
            // Append single connection (origin --> newNode[label])
            const originId = getNodeIdFromElement(node);
            const addition = `\n    ${originId} --> ${newId}[New node]`;
            updateCode(code + addition, { updateDiagram: true });
          }
        } else if (!isDragAction) {
          // It was just a click - show node toolbar
          const clickDuration = Date.now() - pointerDownTime;

          // Only show toolbar for short clicks (not long presses)
          if (clickDuration < 500) {
            // select this node visually (deselect others)
            selectNode(node);

            // Show node toolbar on click
            const rect = node.getBoundingClientRect();
            nodeToolbarPosition = {
              x: rect.right + 10,
              y: rect.top
            };
            selectedNodeId = getNodeIdFromElement(node);
            showNodeToolbar = true;
          }
        }

        // Reset state
        isDragAction = false;
        dragging = false;
        startX = 0;
        startY = 0;
        pointerDownTime = 0;
      };

      node.addEventListener('pointerdown', onPointerDown);
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
    }

    // Add click handlers for edges/relationships
    const edges = svg.querySelectorAll<SVGElement>('.edgePath path, .flowchart-link');
    for (const edge of edges) {
      if ((edge as unknown as HTMLElement).dataset?.edgeClick) {continue;}
      ((edge as unknown as HTMLElement).dataset as any).edgeClick = '1';

      const onEdgeClick = (e: PointerEvent) => {
        // Prevent event bubbling
        e.stopPropagation();

        // Close node toolbar if open
        showNodeToolbar = false;

        // Try to extract relationship info from the edge element
        let fromNode = '';
        let toNode = '';

        const edgeId = edge.getAttribute('id') || '';

        // Parse edge ID patterns like "L_B_C_0" (flowchart link from B to C)
        if (edgeId.startsWith('L_')) {
          const parts = edgeId.split('_');
          if (parts.length >= 3) {
            fromNode = parts[1]; // Second part is source node
            toNode = parts[2]; // Third part is target node
          }
        }

        // Fallback: Look for source and target info in the edge's parent group
        if (!fromNode || !toNode) {
          const edgeGroup = edge.closest('.edgePath, .edge');

          if (edgeGroup) {
            const id = edgeGroup.getAttribute('id') || '';
            // Try to parse edge ID patterns like "flowchart-A-B-1"
            const matches = id.match(/(\w+)-(\w+)(?:-\d+)?$/);
            if (matches && matches.length >= 3) {
              fromNode = matches[1];
              toNode = matches[2];
            }
          }
        }

        // Show relationship toolbar
        const rect = edge.getBoundingClientRect();
        relationshipToolbarPosition = {
          x: rect.left + rect.width / 2,
          y: rect.top - 10
        };

        // Store relationship info for editing
        selectedRelationshipId = `${fromNode}-->${toNode}`;
        showRelationshipToolbar = true;
      };

      // Don't modify the original edge appearance
      edge.addEventListener('click', onEdgeClick);
      edge.style.cursor = 'pointer';

      // Create an invisible overlay for easier clicking
      const overlay = edge.cloneNode(true) as SVGElement;
      overlay.style.strokeWidth = '12'; // Wider for easier clicking
      overlay.style.stroke = 'transparent'; // Invisible but clickable
      overlay.style.fill = 'none';
      overlay.style.pointerEvents = 'all';
      overlay.addEventListener('click', onEdgeClick);

      // Insert overlay after the original edge
      if (edge.parentNode) {
        edge.parentNode.insertBefore(overlay, edge.nextSibling);
      }
    }
  }

  function getNodeIdFromElement(node: Element) {
    // attempt to extract node id from the SVG group id or text inside
    // default to 'A' if not found
    const id = node.getAttribute('id') || '';
    if (id) {
      // Common mermaid ids look like: "flowchart-B-1" or "node-flowchart-B" or "rect-B"
      // Strip common prefixes and trailing numeric suffixes so we return the original short id (e.g. B)
      // Try to capture the central token between optional prefix and optional numeric suffix
      const m = id.match(/^(?:[A-Za-z]+-)?(.+?)(?:-\d+)?$/);
      if (m && m[1]) {
        return m[1].replace(/^node-/, '').replace(/^rect-/, '') || 'A';
      }
      return id.replace('node-', '').replace('rect-', '') || 'A';
    }
    const text = node.querySelector('text');
    if (text?.textContent) {return text.textContent.trim().replaceAll(/\s+/g, '_');}
    return 'A';
  }

  // Node operations functions
  function changeNodeShape(nodeId: string, shapeId: string) {
    const state = get(inputStateStore);
    const code = state.code || '';

    // Find and replace the node definition with new shape
    // Match the node definition line for the given nodeId
    const nodeRegex = new RegExp(
      `(\\s*)${nodeId}(@\\{[^}]*\\}|\\[[^\\]]*\\]|\\([^)]*\\)|\\{[^}]*\\}|[^\\s\\-\\>\\<]*)`
    );
    const match = code.match(nodeRegex);

    if (match) {
      const indent = match[1];
      const newNodeDef = `${indent}${nodeId}@{ shape: ${shapeId}, label: "Updated node" }`;
      const newCode = code.replace(nodeRegex, newNodeDef);
      updateCode(newCode, { updateDiagram: true });
    } else {
      // If not found, try to add at the end
      const newNodeDef = `\n    ${nodeId}@{ shape: ${shapeId}, label: "Updated node" }`;
      updateCode(code + newNodeDef, { updateDiagram: true });
    }
  }

  function deleteNode(nodeId: string) {
    const state = get(inputStateStore);
    const code = state.code || '';

    // Remove all lines containing this node
    const lines = code.split('\n');
    const filteredLines = lines.filter((line) => {
      // Remove node definition lines
      if (
        line.includes(`${nodeId}@{`) ||
        line.includes(`${nodeId}[`) ||
        line.includes(`${nodeId}(`)
      ) {
        return false;
      }
      // Remove connection lines involving this node
      if (
        line.includes(`${nodeId} -->`) ||
        line.includes(`--> ${nodeId}`) ||
        line.includes(`${nodeId} ---`) ||
        line.includes(`--- ${nodeId}`)
      ) {
        return false;
      }
      return true;
    });

    const newCode = filteredLines.join('\n');
    updateCode(newCode, { updateDiagram: true });
  }

  function closeNodeToolbar() {
    showNodeToolbar = false;
    selectedNodeId = '';

    // Also deselect any selected nodes
    if (view) {
      const svg = view.querySelector('svg');
      if (svg) {
        const selectedNode = svg.querySelector('[data-selected="1"]');
        if (selectedNode) {
          deselectNode(selectedNode);
        }
      }
    }
  }

  // Relationship operations functions
  function changeRelationshipStyle(relationshipId: string, arrowType: string, strokeType: string) {
    const state = get(inputStateStore);
    const code = state.code || '';

    // Extract from/to nodes from relationshipId (format: "NodeA-->NodeB")
    const parts = relationshipId.split('-->');
    if (parts.length !== 2) {
      console.warn('Cannot parse relationship ID:', relationshipId);
      return;
    }

    const fromNode = parts[0].trim();
    const toNode = parts[1].trim();

    if (!fromNode || !toNode) {
      console.warn('Invalid node names in relationship:', relationshipId);
      return;
    }

    // Find and update only the specific relationship line
    const lines = code.split('\n');

    const updatedLines = lines.map((line) => {
      const trimmedLine = line.trim();

      // Check if this line contains the specific relationship
      // Handle labels with |label| syntax and node definitions:
      // Traditional: C -->|Two| E[iPhone] or B <--> C{Let me think}
      // Modern: A --x N77808@{ shape: procs, label: "New node" }
      // Pattern matches: fromNode (arrow) (optional |label|) toNode (optional shape definition or @{})
      const relationshipPattern = new RegExp(
        `\\b${fromNode}\\s*(-->|---|-\\.->|==>|<-->|--x)(?:\\|[^|]*\\|)?\\s*${toNode}(?:[\\[\\{\\(]|@\\{|\\b)`
      );

      if (relationshipPattern.test(trimmedLine)) {
        if (arrowType) {
          // Replace the existing arrow type with the new one, preserving labels and node definitions
          return line.replace(/(-->|---|-\.->|==>|<-->|--x)/, arrowType);
        }
        if (strokeType) {
          // Handle stroke type changes (this would need more sophisticated logic)
          // For now, just log that stroke changes aren't fully implemented
          console.log('Stroke type changes not fully implemented yet');
        }
      }
      return line;
    });

    const newCode = updatedLines.join('\n');
    updateCode(newCode, { updateDiagram: true });
  }

  function deleteRelationship(relationshipId: string) {
    // For now, just close the toolbar without deleting anything
    // since we need better relationship identification logic
    showRelationshipToolbar = false;

    // TODO: Implement proper relationship deletion when we have
    // better way to identify specific relationships in the code
  }

  function closeRelationshipToolbar() {
    showRelationshipToolbar = false;
    selectedRelationshipId = '';
  }
</script>

<FontAwesome bind:waitForFontAwesomeToLoad />

<div
  id="view"
  bind:this={view}
  class={['h-full w-full', shouldShowGrid && `grid-bg-${$mode}`, error && 'opacity-50']}>
  <div id="container" bind:this={container} class="h-full overflow-auto"></div>
</div>

{#if showNodeToolbar}
  <NodeToolbar
    nodeId={selectedNodeId}
    position={nodeToolbarPosition}
    {changeNodeShape}
    {deleteNode}
    onClose={closeNodeToolbar} />
{/if}

{#if showRelationshipToolbar}
  <RelationshipToolbar
    relationshipId={selectedRelationshipId}
    position={relationshipToolbarPosition}
    {changeRelationshipStyle}
    {deleteRelationship}
    onClose={closeRelationshipToolbar} />
{/if}

<style>
  .grid-bg-light {
    background-size: 30px 30px;
    background-image: radial-gradient(circle, #e4e4e48c 2px, #0000 2px);
  }

  .grid-bg-dark {
    background-size: 30px 30px;
    background-image: radial-gradient(circle, #46464646 2px, #0000 2px);
  }
</style>
