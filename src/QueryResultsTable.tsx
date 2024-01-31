// @ts-nocheck
import React from "react";
import { Node } from "reactflow";

interface QueryResultsTableProps {
  queryResult: Node[];
}

//load query results from backend + db
export const fetchQueryResult = async (
  flow: JSON,
  clickedNode: Node,
  QueryResultData,
  setQueryResultData,
  nodes,
  edges
) => {
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
    const leaves = findLeaves(nodes, edges);
    console.log(leaves.length);
    leaves.sort((a, b) => parseFloat(a.id) - parseFloat(b.id));
    //const clickedIndex = leaves.indexOf(clickedNode);
    const clickedIndex = leaves.findIndex(
      (node: Node) => node.id == clickedNode.id
    );

    console.log("search", clickedIndex, result[clickedIndex]);
    return result[clickedIndex];
  } catch (error) {
    // Handle any errors that occurred during the fetch
    console.error("Error during fetch:", error);
  }
};

const findLeaves = (nodes, edges) => {
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

function QueryResultsTable({ queryResult }: QueryResultsTableProps) {
  // Check if there is no queryResult
  if (queryResult.length === 0) {
    return <div>No query Result available</div>;
  }

  let columns = Object.keys(queryResult[0]);
  columns.shift();

  return (
    <table>
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column}>{column.toUpperCase()}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {queryResult.map((node) => (
          <tr key={node.id}>
            {columns.map((column) => (
              <td key={column}>{node[column]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default QueryResultsTable;
