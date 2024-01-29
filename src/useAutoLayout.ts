import { useEffect } from 'react';
import dagre from '@dagrejs/dagre';
import {
  Node,
  Edge,
  Position,
  ReactFlowState,
  useStore,
  useReactFlow,
} from 'reactflow';


const dagreGraph = new dagre.graphlib!.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const positionMap: Record<string, Position> = {
  T: Position.Top,
  L: Position.Left,
  R: Position.Right,
  B: Position.Bottom,
};

const nodeCountSelector = (state: ReactFlowState) => state.nodeInternals.size;
const nodesInitializedSelector = (state: ReactFlowState) =>
  Array.from(state.nodeInternals.values()).every(
    (node:Node) => node.width && node.height
  );

function useAutoLayout() {
  //const { direction } = options;
  const nodeCount = useStore(nodeCountSelector);
  const nodesInitialized = useStore(nodesInitializedSelector);
  const { getNodes, getEdges, setNodes, setEdges, fitView } = useReactFlow();

  useEffect(() => {
    // only run the layout if there are nodes and they have been initialized with their dimensions
    if (!nodeCount || !nodesInitialized) {
      return;
    }

    const nodes: Node[] = getNodes();
    const edges: Edge[] = getEdges();

    dagreGraph.setGraph({ rankdir: "TB" });

    nodes.forEach((node: Node) => {
      dagreGraph.setNode(node.id, {
        width: node.width ?? 0,
        height: node.height ?? 0,
      });
    });

    edges.forEach((edge: Edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    setNodes((nodes: Node[]) =>
      nodes.map((node) => {
        const { x, y } = dagreGraph.node(node.id);

        return {
          ...node,
          sourcePosition: positionMap['B'],
          targetPosition: positionMap['T'],
          position: { x, y },
          style: { opacity: 1 },
        };
      })
    );

    setEdges((edges:Edge[]) =>
      edges.map((edge) => ({ ...edge, style: { opacity: 1 } }))
    );
  }, [
    nodeCount,
    nodesInitialized,
    getNodes,
    getEdges,
    setNodes,
    setEdges,
    fitView,
    //direction,
  ]);
}

export default useAutoLayout;
