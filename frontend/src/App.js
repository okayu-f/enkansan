import React, { useState, useEffect } from "react";
import axios from "axios";

function App() {
  const [stockData, setStockData] = useState(null);

  useEffect(() => {
    axios
      .get("http://localhost:8000/stock-data")
      .then((response) => {
        setStockData(response.data);
      })
      .catch((error) => {
        console.error("Error fetching stock data:", error);
      });
  }, []);

  return (
    <div>
      <h1>Stock Data</h1>
      {stockData ? <pre>{JSON.stringify(stockData, null, 2)}</pre> : <p>Loading...</p>}
    </div>
  );
}

export default App;
