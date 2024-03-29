// @ts-nocheck
import React, {
  useEffect,
  useState,
  DragEvent,
  DragEventHandler,
  useCallback,
  useRef,
} from "react";
import ReactFlow, {
  MarkerType,
  ReactFlowProvider,
  useReactFlow,
  Node,
  Edge,
  NodeTypes,
  OnNodesChange,
  applyNodeChanges,
  NodeMouseHandler,
  NodeChange,
  OnEdgesChange,
  EdgeChange,
  applyEdgeChanges,
  OnNodesDelete,
} from "reactflow";
import { nodeTypeLookup, compareOperatorLookup } from "./lookup";

import Sidebar from "./Sidebar";
import Suggestionbar from "./Suggestionbar";
import { fetchSuggestionbarData } from "./Suggestionbar";
import { fetchQueryResult } from "./QueryResultsTable";
import QueryResultsTable from "./QueryResultsTable";
import CustomNode from "./CustomNode";
import useAutoLayout from "./useAutoLayout";
import * as initialElements from "./initialElements";
import PopupModal from "./Modal/PopupModal";
import "reactflow/dist/style.css";
import styles from "./styles.module.css";

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

const defaultEdgeOptions = {
  type: "smoothstep",
  markerEnd: { type: MarkerType.ArrowClosed },
  pathOptions: { offset: 5 },
};

type NodeData = {
  label: string;
};

function ReactFlowTree() {
  // this hook handles the computation of the layout once the elements change
  const { fitView } = useReactFlow();
  useAutoLayout();

  //all needed states of the application
  const [nodes, setNodes] = useState<Node<NodeData>[]>(initialElements.nodes);
  const [edges, setEdges] = useState<Edge[]>(initialElements.edges);
  const [nextId, setNextId] = useState<number>(0);
  const [nodesWithData, setNodesWithData] = useState<Node<NodeData>[]>([]);
  const [init, setInit] = useState<Boolean>(false);
  const [suggestionbarData, setSuggestionbarData] = useState<JSON[]>([]);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>();
  const [selectedEdgeType, setSelectedEdgeType] = useState<string>();
  const [selectedDataRange, setSelectedDataRange] = useState(null);
  const [selectedEdgeBrother, setSelectedEdgeBrother] = useState<Edge | null>(
    null
  );
  const [isPopupModalOpen, setIsPopupModalOpen] = useState<Boolean>(false);
  const [popupResponse, setPopupResponse] = useState<JSON | null>();
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [showTable, setShowTable] = useState<Boolean>(false);
  const [queryResultData, setQueryResultData] = useState<Node<NodeData>[]>([]);

  //used for scrolling reference
  const ref = useRef(null);

  /**
   * Function to handle the first node drop, as in that case the node should not be duplicated.
   **/
  const createFirstNode = (dataString: string) => {
    const dataParsed = JSON.parse(dataString);
    const firstNode: Node<NodeData> = {
      id: `${nextId + 1}`,
      data: { label: dataParsed.nodeLabel },
      position: { x: 0, y: 0 }, // no need to pass a position as it is computed by the layout hook
      type: "custom",
      style: { opacity: 0 },
    };
    setNodes([firstNode]);
    setInit(true);
    setNextId(nextId + 1);
  };

  /**
   * After a new node is dropped onto an existing one, two new nodes need to be created.
   * This function handles the creation of the two new nodes as well as the two new edges.
   * If a result node is passed, no 'companion' node is created.
   **/
  const createConnection = (sourceId: string, dataString: string) => {
    // create an incremental ID based on the number of elements already in the graph
    const sourceNodeName = nodes.find((node) => node.id === sourceId)?.data
      .label;
    const targetId: string = `${nextId + 1}`;
    const secondId: string = `${nextId + 2}`;
    const dataParsed = JSON.parse(dataString);

    const targetNode: Node<NodeData> = {
      id: targetId,
      data: { label: dataParsed.nodeLabel },
      position: { x: 0, y: 0 }, // no need to pass a position as it is computed by the layout hook
      type: "custom",
      style: { opacity: 0 },
    };

    const secondNode: Node<NodeData> = {
      id: secondId,
      data: { label: dataParsed.nodeLabel },
      position: { x: 0, y: 0 }, // no need to pass a position as it is computed by the layout hook
      type: "custom",
      style: { opacity: 0 },
    };

    const connectingEdge: Edge = {
      id: `${sourceId}->${targetId}`,
      source: sourceId,
      target: targetId,
      style: { opacity: 0 },
      data: { "Source->Target": [sourceNodeName, dataParsed.nodeLabel] },
    };

    const secondEdge: Edge = {
      id: `${sourceId}->${secondId}`,
      source: sourceId,
      target: secondId,
      style: { opacity: 0 },
      data: { "Source->Target": [sourceNodeName, dataParsed.nodeLabel] },
    };
    if (sourceNodeName === "Results") {
      //dont allow drop on result nodes
    } else if (dataParsed.nodeLabel === "Results") {
      setNodes((nodes) => nodes.concat([targetNode]));
      setEdges((edges) => edges.concat([connectingEdge]));
      setNextId(nextId + 1);
    } else {
      setNodes((nodes) => nodes.concat([targetNode, secondNode]));
      setEdges((edges) => edges.concat([connectingEdge, secondEdge]));
      setNextId(nextId + 2);
    }
  };

  /**
   * onDrop handles the dropping of a node on an existing node.
   * A node can only be dropped onto another node.
   * Sends the dropped node to the backend and waits for an updated suggestion from the backend.
   * */
  const onDrop: DragEventHandler = async (evt: DragEvent<HTMLDivElement>) => {
    // make sure that the event target is a DOM element
    if (evt.target instanceof Element) {
      // from the target element search for the node wrapper element which has the node id as attribute
      const targetId = evt.target
        .closest(".react-flow__node")
        ?.getAttribute("data-id");
      // only allows drop on node with no children
      if (targetId && !edges.map((edge) => edge.source).includes(targetId)) {
        // now we can create a connection to the drop target node
        const data: string = evt.dataTransfer.getData("application/reactflow");
        // check for initialisation state
        if (init) {
          createConnection(targetId, data);
        } else {
          createFirstNode(data);
        }
        const dataJSON = JSON.parse(data);
        setNodesWithData((prev) => [...prev, dataJSON]);
        // send the latest node to the backend.
        await fetch("http://localhost:3001/sendlastnode", {
          method: "POST",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(dataJSON),
        });
        // Wait for the backend to return an updated suggestion.
        await fetchSuggestionbarData()
          .then((data) => setSuggestionbarData([data]))
          .catch((error) =>
            console.error("Error updating suggestion bar data:", error)
          );
      }
    }
    // log the current version of the tree for tree reconstruction steps
    handleButtonClickLog();
  };

  /** helper function for debugging, commented out */
  /* useEffect(() => {
    //console.log("nodesWithData (after state update):", nodesWithData);
  }, [nodesWithData]); */

  /*If a "Results"-node is clicked, fetch metching athlete subset from backend and set table to be shown.*/
  const onNodeClick: NodeMouseHandler = async (
    _: MouseEvent,
    node: Node<NodeData>
  ) => {
    if (node.data.label === "Results") {
      const flow: JSON = reactFlowInstance?.toObject();
      const queryResult: Node[] = await fetchQueryResult(
        flow,
        node,
        queryResultData,
        setQueryResultData,
        nodes,
        edges
      );
      ref.current?.scrollIntoView({ behavior: "smooth" });
      setQueryResultData(() => queryResult);
      setShowTable(true);
    } else {
    }
  };

  //Create Initial Node if all nodes are deleted
  const onNodesDelete: OnNodesDelete = (delNodes: Node[]) => {
    if (nodes.length == 1) {
      handleButtonClickNew();
    }
  };

  const onNodesChange: OnNodesChange = (changes: NodeChange[]) => {
    setNodes((nodes) => applyNodeChanges(changes, nodes));
  };

  const onEdgesChange: OnEdgesChange = (changes: EdgeChange[]) => {
    setEdges((edges) => applyEdgeChanges(changes, edges));
  };

  /*This function sends the tree to the backend to be saved in the database. 
  It is called by various other functions */
  const handleButtonClickLog = (finished: boolean = false) => {
    const path = finished
      ? "http://localhost:3001/flow"
      : "http://localhost:3001/treeconstruction";
    const flow = reactFlowInstance?.toObject();
    fetch(path, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(flow),
    });
  };
  const handleOpenPopup = (type, data) => {
    setSelectedEdgeType(type);
    setSelectedDataRange(data);
    setIsPopupModalOpen(true);
  };
  const handleClosePopup = () => {
    setIsPopupModalOpen(false);
  };

  const handlePopupResponse = (data: JSON) => {
    console.log();
    setPopupResponse(data);
    handleClosePopup();
  };

  //Reinitialize the states so a new tree can be built
  const handleButtonClickNew = () => {
    handleButtonClickLog();
    setNodes(initialElements.nodes);
    setEdges(initialElements.edges);
    setInit(false);
    setSuggestionbarData([]);
    setNextId(0);
    setShowTable(false);
    setNodesWithData([]);
    setSuggestionbarData([]);
    setSelectedEdge(null);
    setSelectedEdgeType(null);
    setSelectedDataRange(null);
    setSelectedEdgeBrother(null);
    setIsPopupModalOpen(false);
    setPopupResponse(null);
    setQueryResultData([]);
  };

  //Opens up a Pop-up on edge click where the threshold value can be input as label
  const onEdgeClick = useCallback(
    (event: React.SyntheticEvent<HTMLFormElement>, edge: Edge) => {
      const source = edge.source;
      const target = edge.target;
      // The "brother" edge will have the same source but different target. "Results"-nodes have no brother edge.
      const otherEdge = edges.find(
        (edg) => edg.source === source && edg.target !== target
      );
      const sourceNode: Node<NodeData> | undefined = nodes.find(
        (nd) => nd.id === source
      );
      const type: string = nodeTypeLookup.get(
        sourceNode?.data.label.toLowerCase()
      );
      const sourceLabel = nodes.find((node) => node.id === source)?.data.label;
      const dataRangeNode = nodesWithData.find(
        (node) => node.nodeLabel === sourceLabel
      );
      const dataRange = dataRangeNode.nodeData;
      // clicking an edge without a label
      if (!edge.label) {
        setSelectedEdge(edge);
        if (otherEdge !== undefined) {
          setSelectedEdgeBrother(otherEdge);
        }
        handleOpenPopup(type, dataRange);
      }
    },
    [handleOpenPopup, edges, nodes, nodesWithData]
  );
  /**
   * workaround so that handleButtonClickLog logs the tree with updated labels.
   */
  const [a, setA] = useState<Boolean>(false);
  useEffect(() => {
    if (a) {
      handleButtonClickLog();
      setA(false);
    }
  }, [a]);

  /**
   * handles the assigning of labels to the edges after a threshold has been set.
   */
  useEffect(() => {
    if (popupResponse && selectedEdge) {
      console.log("type" + typeof popupResponse);
      let label = "";
      let oppositeLabel = "";

      if (popupResponse.sex !== "") {
        label = popupResponse.sex;
        oppositeLabel = popupResponse.sex === "male" ? "female" : "male";
      } else if (popupResponse.cutoff && !popupResponse.comparisonOperator) {
        label = popupResponse.cutoff;
      } else if (popupResponse.cutoff && popupResponse.comparisonOperator) {
        label = popupResponse.comparisonOperator + popupResponse.cutoff;
        oppositeLabel =
          compareOperatorLookup.get(popupResponse.comparisonOperator) +
          popupResponse.cutoff;
      }
      setEdges((edgs) =>
        edgs.map((edgs2) =>
          edgs2.id === selectedEdge.id ? { ...edgs2, label: `${label}` } : edgs2
        )
      );

      if (selectedEdgeBrother) {
        setEdges((edgs) =>
          edgs.map((edgs2) =>
            edgs2.id === selectedEdgeBrother.id
              ? { ...edgs2, label: oppositeLabel }
              : edgs2
          )
        );
      }
      setSelectedEdge(null);
      setSelectedEdgeBrother(null);
      setPopupResponse(null);
      setA(true);
    }
  }, [popupResponse, selectedEdge, selectedEdgeBrother]);

  /**
   * every time our nodes change, we want to center the graph again
   */
  useEffect(() => {
    fitView({ duration: 400 });
  }, [nodes, fitView]);

  return (
    <div className={styles.container}>
      <div className={styles.topSection}>
        <Sidebar />
        <ReactFlow
          className={styles.reactFlow}
          nodeTypes={nodeTypes}
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onInit={setReactFlowInstance}
          onEdgeClick={onEdgeClick}
          fitView
          onDrop={onDrop}
          onNodeClick={onNodeClick}
          onNodesDelete={onNodesDelete}
          defaultEdgeOptions={defaultEdgeOptions}
        />
        <Suggestionbar suggestionbarData={suggestionbarData} />
      </div>
      <div className={styles.flexBreak}>
        <button className={styles.button} onClick={handleButtonClickNew}>
          New tree
        </button>
        <button
          className={styles.button}
          onClick={() => handleButtonClickLog(true)}
        >
          Log Tree
        </button>
      </div>
      {setSelectedDataRange && (
        <PopupModal
          onSubmit={handlePopupResponse}
          isOpen={isPopupModalOpen}
          onClose={handleClosePopup}
          edgeType={selectedEdgeType}
          dataRange={selectedDataRange}
        />
      )}
      <div ref={ref} className={styles.stripedTable}>
        {showTable && (
          <h1>Athletes: ({queryResultData.length} results available)</h1>
        )}
        {showTable && <QueryResultsTable queryResult={queryResultData} />}
        {!showTable && (
          <h2>Click on a "Results"-node to show the matching athletes here!</h2>
        )}
      </div>
    </div>
  );
}

const ReactFlowWrapper = () => {
  return (
    <ReactFlowProvider>
      <ReactFlowTree />
    </ReactFlowProvider>
  );
};

export default ReactFlowWrapper;
