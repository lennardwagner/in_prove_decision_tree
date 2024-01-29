import React from "react";
import { Node } from "reactflow";

interface QueryResultsTableProps {
  queryResult: Node[];
}

const QueryResultsTable: React.FC<QueryResultsTableProps> = ({
  queryResult,
}) => {
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
};

export default QueryResultsTable;
