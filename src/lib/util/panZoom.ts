import type { State } from '$/types';
import Hammer from 'hammerjs';
import type { Point } from 'mermaid/dist/types.js';
import panzoom from 'svg-pan-zoom';
type PanZoom = typeof panzoom;

export class PanZoomState {
  private pan?: Point;
  private zoom?: number;
  private pzoom: PanZoom | undefined;
  private isDirty = false;
  private resizeObserver: ResizeObserver;

  public isPanEnabled: boolean;
  public onPanZoomChange?: (pan: Point, zoom: number) => void;
  public onPanEnabledChange?: (enabled: boolean) => void;

  constructor() {
    this.isPanEnabled = false;
    this.resizeObserver = new ResizeObserver(() => {
      this.resize();
      if (!this.isDirty) {
        this.reset();
      }
    });
  }

  public updateElement(diagramView: SVGElement, { pan, zoom }: Pick<State, 'pan' | 'zoom'>) {
    this.pzoom?.destroy();
    let hammer: HammerManager | undefined;
    const self = this; // Reference to class instance for use in event handlers
    this.pzoom = panzoom(diagramView, {
      center: true,
      controlIconsEnabled: false,
      customEventsHandler: {
        haltEventListeners: ['touchstart', 'touchend', 'touchmove', 'touchleave', 'touchcancel'],
        init: function (options) {
          const instance = options.instance;
          let initialScale = 1;
          let pannedX = 0;
          let pannedY = 0;
          hammer = new Hammer(options.svgElement);

          const resetPanned = () => {
            pannedX = 0;
            pannedY = 0;
          };
          const handlePan = (event: HammerInput) => {
            // Only handle pan if pan is enabled
            if (self.isPanEnabled) {
              instance.panBy({ x: event.deltaX - pannedX, y: event.deltaY - pannedY });
            }
            pannedX = event.deltaX;
            pannedY = event.deltaY;
          };

          hammer.get('pinch').set({ enable: true });
          hammer.on('panstart panmove', function (event) {
            if (event.type === 'panstart') {
              resetPanned();
            }
            handlePan(event);
          });
          hammer.on('pinchstart pinchmove', function (event) {
            if (event.type === 'pinchstart') {
              initialScale = instance.getZoom();
              resetPanned();
            }
            instance.zoomAtPoint(initialScale * event.scale, {
              x: event.center.x,
              y: event.center.y
            });
            // Don't handle pan during pinch if pan is disabled
            if (self.isPanEnabled) {
              handlePan(event);
            }
          });
          options.svgElement.addEventListener('touchmove', function (event) {
            event.preventDefault();
          });
        },
        destroy: function () {
          hammer?.destroy();
        }
      },
      fit: true,
      maxZoom: 12,
      minZoom: 0.2,
      onPan: (pan) => {
        this.pan = pan;
        this.zoom = this.pzoom?.getZoom();
        this.isDirty = true;
        if (this.zoom) {
          this.onPanZoomChange?.(this.pan, this.zoom);
        }
      },
      onZoom: (zoom) => {
        this.zoom = zoom;
        this.pan = this.pzoom?.getPan();
        this.isDirty = true;
        if (this.pan) {
          this.onPanZoomChange?.(this.pan, this.zoom);
        }
      },
      panEnabled: true,
      zoomEnabled: true
    });

    this.pzoom.disableDblClickZoom();

    this.resizeObserver.disconnect();
    this.resizeObserver.observe(diagramView);

    if (pan && zoom && Number.isFinite(zoom) && Number.isFinite(pan.x) && Number.isFinite(pan.y)) {
      this.restorePanZoom(pan, zoom);
    } else {
      this.reset();
    }

    // we start out with both pan and zoom enabled so that the tool can auto position view refreshed
    // then set enable/disable pan based on state
    if (this.isPanEnabled) {
      this.pzoom.enablePan();
      this.pzoom.enableZoom();
    } else {
      this.pzoom.disablePan();
      // Keep zoom enabled even when pan is disabled
      this.pzoom.enableZoom();
    }

    if (pan === undefined && zoom === undefined) {
      this.reset();
    }
  }

  public restorePanZoom(pan: Point, zoom: number) {
    if (!this.pzoom) {
      console.error('PanZoomState.restorePanZoom: pzoom is not initialized');
      return;
    }
    this.pzoom.zoom(zoom);
    this.pzoom.pan(pan);
  }

  public resize() {
    this.pzoom?.resize();
    if (!this.isDirty) {
      this.reset();
    }
  }

  public zoomIn() {
    this.pzoom?.zoomIn();
  }

  public zoomOut() {
    this.pzoom?.zoomOut();
  }

  public center() {
    this.pzoom?.center();
  }

  public reset() {
    this.pzoom?.reset();
    // Zoom out a bit to avoid overlap with the toolbar
    this.pzoom?.zoom(0.875);
    this.isDirty = false;
  }

  public enablePan() {
    this.isPanEnabled = true;
    this.pzoom?.enablePan();
    this.pzoom?.enableZoom();
    this.onPanEnabledChange?.(true);
  }

  public disablePan() {
    this.isPanEnabled = false;
    this.pzoom?.disablePan();
    // Keep zoom enabled while disabling pan
    this.pzoom?.enableZoom();
    this.onPanEnabledChange?.(false);
  }

  public togglePan() {
    if (this.isPanEnabled) {
      this.disablePan();
    } else {
      this.enablePan();
    }
  }
}
