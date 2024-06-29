import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import CircularProgress from '@mui/material/CircularProgress';

interface StockData {
  ticker: string;
  histories: {
    date: string;
    dollar: number;
    yen: number;
    exchange_rate: number;
  }[];
}

const Chart: React.FC = () => {
  const [dataKey, setDataKey] = useState<'dollar' | 'yen'>('yen');
  const [selectedTicker, setSelectedTicker] = useState<'spyd' | 'hdv'>('spyd');
  const [stockData, setStockData] = useState<Record<string, StockData> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:8000/stock-data');
        setStockData(response.data);
      } catch (error) {
        console.error('Error fetching stock data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCurrencyChange = (_event: React.MouseEvent<HTMLElement>, newDataKey: 'dollar' | 'yen') => {
    if (newDataKey !== null) {
      setDataKey(newDataKey);
    }
  };

  const handleTickerChange = (event: SelectChangeEvent<'spyd' | 'hdv'>) => {
    setSelectedTicker(event.target.value as 'spyd' | 'hdv');
  };

  if (loading) {
    return <CircularProgress />;
  }

  if (!stockData) {
    return <div>No data available</div>;
  }

  return (
    <>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <FormControl variant="outlined" style={{ minWidth: 120 }}>
          <InputLabel id="ticker-select-label">Ticker</InputLabel>
          <Select labelId="ticker-select-label" id="ticker-select" value={selectedTicker} onChange={handleTickerChange} label="Ticker">
            <MenuItem value="spyd">SPYD</MenuItem>
            <MenuItem value="hdv">HDV</MenuItem>
          </Select>
        </FormControl>
        <ToggleButtonGroup color="primary" value={dataKey} exclusive onChange={handleCurrencyChange} aria-label="currency">
          <ToggleButton value="yen">円</ToggleButton>
          <ToggleButton value="dollar">ドル</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <LineChart
        width={1000}
        height={500}
        data={stockData[selectedTicker].histories}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="linear" dataKey={dataKey} stroke="#8884d8" activeDot={{ r: 8 }} animationDuration={300} />
      </LineChart>
    </>
  );
};

export default Chart;
