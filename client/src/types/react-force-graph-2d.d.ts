declare module 'react-force-graph-2d' {
  import { ComponentType } from 'react';

  export interface ForceGraphMethods {
    d3Force: (forceName: string, forceFn?: any) => any;
    d3ReheatSimulation: () => void;
    zoom: (zoomLevel?: number, durationMs?: number) => any;
    centerAt: (x?: number, y?: number, durationMs?: number) => any;
    zoomToFit: (durationMs?: number, padding?: number) => any;
  }

  export interface ForceGraphProps {
    graphData: { nodes: any[]; links: any[] };
    nodeId?: string;
    nodeLabel?: string | ((node: any) => string);
    nodeColor?: string | ((node: any) => string);
    nodeVal?: number | ((node: any) => number);
    nodeRelSize?: number;
    nodeCanvasObject?: (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => void;
    nodeCanvasObjectMode?: (node: any) => 'before' | 'after' | 'replace';
    linkSource?: string;
    linkTarget?: string;
    linkLabel?: string | ((link: any) => string);
    linkColor?: string | ((link: any) => string);
    linkWidth?: number | ((link: any) => number);
    linkCurvature?: number | ((link: any) => number);
    linkDirectionalParticles?: number | ((link: any) => number);
    linkDirectionalParticleSpeed?: number | ((link: any) => number);
    linkDirectionalParticleWidth?: number | ((link: any) => number);
    linkDirectionalArrowLength?: number | ((link: any) => number);
    linkDirectionalArrowRelPos?: number | ((link: any) => number);
    onNodeClick?: (node: any, event: MouseEvent) => void;
    onLinkClick?: (link: any, event: MouseEvent) => void;
    onBackgroundClick?: (event: MouseEvent) => void;
    cooldownTicks?: number;
    width?: number;
    height?: number;
    backgroundColor?: string;
    enableNodeDrag?: boolean;
    enableZoomInteraction?: boolean;
    enablePanInteraction?: boolean;
    ref?: any;
  }

  const ForceGraph2D: ComponentType<ForceGraphProps>;
  export default ForceGraph2D;
}
