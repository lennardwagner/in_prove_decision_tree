/*export const fetchQueryResult = async (flow) => {
  fetch("http://localhost:3001/flow", {
    method: "POST",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(flow),
  });
  try {
    const response = await fetch("http://localhost:3001/flow", {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const query_result = await response.json();
    return query_result;
  } catch (error) {
    console.error("Error fetching query_result:", error);
    return null;
  }
};*/
