// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { DragEvent, useEffect, useState } from "react";

import styles from "./styles.module.css";

function Sidebar() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [sidebarData, setSidebarData] = useState([]);
  const [expandedSections, setExpandedSections] = useState({});
  useEffect(() => {
    // Fetch sidebar data from the backend
    const fetchData = async () => {
      try {
        console.log("Fetching sidebar info");
        const response = await fetch("http://localhost:3001/sidebar");
        const data = await response.json();
        const dataArray = [data];
        const nodeArray = dataArray.map((Data, Index) =>
          Object.entries(Data).map(([nodeName, node]) => node)
        );
        setSidebarData(nodeArray[0]);
      } catch (error) {
        console.error("Error fetching sidebar data:", error);
      }
    };
    fetchData();
  }, []); // Empty dependency array ensures useEffect runs only once, similar to componentDidMount

  const onDragStart = (
    event: DragEvent,
    nodeType: string,
    nodeLabel: string,
    nodeData: string
  ) => {
    const draggedData = { nodeType, nodeLabel, nodeData };
    event.dataTransfer.setData(
      "application/reactflow",
      JSON.stringify(draggedData)
    );
    event.dataTransfer.effectAllowed = "move";
    // //console.log(nodeType);//console.log(nodeLabel);//console.log("Node Data is:" + JSON.stringify(nodeData))
  };
  /*const onDragStart = (nodeData: any) => (event: DragEvent) => {
    const dataString = JSON.stringify(nodeData);
    event.dataTransfer.setData("application/reactflow", dataString);
    //console.log(nodeData);
    //console.log("Geschriebene daten: " + dataString);
  };*/

  // @ts-expect-error
  const toggleSection = (sectionIndex) => {
    setExpandedSections((prevExpandedSections) => ({
      ...prevExpandedSections,
      [sectionIndex]: !prevExpandedSections[sectionIndex],
    }));
  };
  const sectionTitles = ["physiology", "training", "cognition", "functional"];

  // Group nodes by category
  const groupedNodes = sidebarData.reduce((acc, node) => {
    if (!acc[node.category]) {
      acc[node.category] = [];
    }
    acc[node.category].push(node);
    //console.log(acc);
    return acc;
  }, {});

  return (
    <div className={styles.sidebar}>
      {sectionTitles.map((title, sectionIndex) => (
        <div key={sectionIndex}>
          <div
            className={styles.sidebarLabel}
            onClick={() => toggleSection(sectionIndex)}
            style={{ cursor: "pointer" }}
          >
            {title.charAt(0).toUpperCase() + title.slice(1)}
          </div>
          {expandedSections[sectionIndex] && (
            <div>
              {groupedNodes[title]?.map((node, nodeIndex) => (
                <div
                  key={nodeIndex}
                  className={styles.sidebarNode}
                  onDragStart={(event) =>
                    onDragStart(
                      event,
                      "custom",
                      node.content,
                      node.data || "empty"
                    )
                  }
                  draggable
                >
                  {node.content}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default Sidebar;
