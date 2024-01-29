//Suggestionbar.tsx
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import {DragEvent, useEffect, useState} from "react";

import styles from "./styles.module.css";

export const fetchSuggestionbarData = async () => {
    try {
        const response = await fetch('http://localhost:3001/currentsuggestion');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching sidebar data:', error);
        return null;
    }
};
function Suggestionbar({ suggestionbarData }) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // const [suggestionbarData, setSuggestionbarData] = useState([]);
    // Fetch sidebar data from the backend

    const onDragStart = (event: DragEvent, nodeType: string, nodeLabel: string, nodeData: string) => {
        const draggedData = {nodeType, nodeLabel, nodeData};
        event.dataTransfer.setData("application/reactflow", JSON.stringify(draggedData));
        event.dataTransfer.effectAllowed = "move";
    };
    // @ts-expect-error
    // @ts-ignore
    if (!suggestionbarData || suggestionbarData.every(item => Object.keys(item).length === 0)) {
        return (
            <div className={styles.suggestionbar}>
                <div className={styles.sidebarLabel}>
                    Commonly used elements:
                </div>
                <div className={styles.noDataMessage}>
                    No data available.
                </div>
            </div>
        );
    }
    return (
        <div className={styles.suggestionbar}>
            <div className={styles.sidebarLabel}>
                Commonly used elements:
            </div>
            <div>
                <div>
                    {suggestionbarData.map((item, index) => (
                        <div key={index}>
                            {Object.values(item).map((node, innerIndex) => (
                                <div key={innerIndex}
                                     className={styles.sidebarNode}
                                     onDragStart={(event) =>
                                         onDragStart(
                                             event,
                                             "custom",
                                             node.content,
                                             node.data || "empty")}
                                     draggable>
                                    {node.content}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
export default Suggestionbar;
