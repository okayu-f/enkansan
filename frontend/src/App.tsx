import type React from 'react';
import Chart from './Chart';
import './App.css';

const App: React.FC = () => {
  return (
    <>
      <h1>円換算だといくらなのツール</h1>
      <Chart />
    </>
  );
};

export default App;
