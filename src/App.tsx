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
//import { fetchQueryResult } from "./queryResult";
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
  /*useEffect(() => {
        //console.log('suggestionbarData changed:', suggestionbarData);
    }, [suggestionbarData]); */

  //Only called for very first node
  //to do: error when nodes.length != 1
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
  // this function adds a new node and connects it to the source node
  // todo: add the custom api data to the nodes, to have access to them later.
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
      labelStyle: {
        backgroundColor: "#5f5d72",
        color: "white",
        borderColor: "black",
      },
      labelBgStyle: {
        backgroundColor: "#5f5d72",
        color: "white",
        borderColor: "black",
      },
      labelShowBg: true,
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

  // this function is called once the node from the sidebar is dropped onto a node in the current graph
  const onDrop: DragEventHandler = async (evt: DragEvent<HTMLDivElement>) => {
    // make sure that the event target is a DOM element
    if (evt.target instanceof Element) {
      // log the current version of the tree for tree reconstruction steps
      // from the target element search for the node wrapper element which has the node id as attribute
      const targetId = evt.target
        .closest(".react-flow__node")
        ?.getAttribute("data-id");
      //only allows drop on node with no children
      if (targetId && !edges.map((edge) => edge.source).includes(targetId)) {
        // now we can create a connection to the drop target node
        const data: string = evt.dataTransfer.getData("application/reactflow");
        //check for initialisation state
        if (init) {
          createConnection(targetId, data);
        } else {
          createFirstNode(data);
        }
        const dataJSON = JSON.parse(data);
        setNodesWithData((prev) => [...prev, dataJSON]);
        await fetch("http://localhost:3001/sendlastnode", {
          method: "POST",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(dataJSON),
        });
        await fetchSuggestionbarData()
          .then((data) => setSuggestionbarData([data]))
          .catch((error) =>
            console.error("Error updating suggestion bar data:", error)
          );
      }
    }
    handleButtonClickLog();
  };
  useEffect(() => {
    //console.log("nodesWithData (after state update):", nodesWithData);
  }, [nodesWithData]);

  const findLeaves = () => {
    const result: Node<NodeData>[] = [];
    nodes.forEach((node) => {
      const outgoingEdges = edges.filter((edge) => edge.source === node.id);
      if (outgoingEdges.length === 0) {
        // This is a leaf node
        result.push(node);
      }
    });
    return result;
  };
  //load query results from backend + db
  const fetchQueryResult = async (flow: JSON, clickedNode: Node) => {
    try {
      const response = await fetch("http://localhost:3001/flow", {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(flow),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();

      setQueryResultData(result);
      //find leaves
      const leaves = findLeaves();
      console.log(leaves.length);
      leaves.sort((a, b) => parseFloat(a.id) - parseFloat(b.id));
      //const clickedIndex = leaves.indexOf(clickedNode);
      const clickedIndex = leaves.findIndex(
        (node) => node.id == clickedNode.id
      );

      console.log("search", clickedIndex, result[clickedIndex]);
      return result[clickedIndex];
    } catch (error) {
      // Handle any errors that occurred during the fetch
      console.error("Error during fetch:", error);
    }
  };
  const onNodeClick: NodeMouseHandler = async (
    _: MouseEvent,
    node: Node<NodeData>
  ) => {
    if (node.data.label === "Results") {
      const flow: JSON = reactFlowInstance?.toObject();
      const queryResult: Node[] = await fetchQueryResult(flow, node);
      ref.current?.scrollIntoView({ behavior: "smooth" });
      setQueryResultData(() => queryResult);
      setShowTable(true);
    } else {
    }
  };

  //Create Initial Node if all nodes are deleted
  const onNodesDelete: OnNodesDelete = (delNodes: Node[]) => {
    if (nodes.length == 1) {
      setNodes(initialElements.nodes);
      setEdges(initialElements.edges);
      setInit(false);
      setSuggestionbarData([]);
    }
  };

  const onNodesChange: OnNodesChange = (changes: NodeChange[]) => {
    setNodes((nodes) => applyNodeChanges(changes, nodes));
  };

  const onEdgesChange: OnEdgesChange = (changes: EdgeChange[]) => {
    setEdges((edges) => applyEdgeChanges(changes, edges));
  };

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
    console.log()
    setPopupResponse(data);
    handleClosePopup();
  };
  const handleButtonClickNew = () => {
    handleButtonClickLog();
    setNodes(initialElements.nodes);
    setEdges(initialElements.edges);
    setInit(false);
    setSuggestionbarData([]);
    setShowTable(false);
    setNextId(0);
  };
  const onEdgeClick = useCallback(
    (event: React.SyntheticEvent<HTMLFormElement>, edge: Edge) => {
      const source = edge.source;
      const target = edge.target;
      // The "brother" edge will have the same source but different target. At EOF no brother edge exists.
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
        oppositeLabel =
          popupResponse.sex === "männlich" ? "weiblich" : "männlich";
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

  // every time our nodes change, we want to center the graph again
  useEffect(() => {
    fitView({ duration: 400 });
  }, [nodes, fitView]);

  return (
    <div className={styles.container}>
      <div className={styles.topSection}>
        <Sidebar />
        <ReactFlow
          className={styles.reactFlow}
          //proOptions={proOptions}
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
          // newly added edges get these options automatically
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
        <button className={styles.button} onClick={handleOpenPopup}>
          Open Popup
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
        {showTable && <h1>Athletes</h1>}
        {showTable && <QueryResultsTable queryResult={queryResultData} />}
        {!showTable && (
          <h1>Click on a "Results"-node to show the matching athletes here!</h1>
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
