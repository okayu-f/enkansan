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

const API_URL = import.meta.env.VITE_API_URL || '';

interface StockData {
  ticker: string;
  histories: {
    date: string;
    dollar: number;
    yen: number;
    exchange_rate: number;
  }[];
}

type TimeRange = '1M' | '3M' | '6M' | '1Y' | '3Y';

const Chart: React.FC = () => {
  const [dataKey, setDataKey] = useState<'dollar' | 'yen'>('yen');
  const [selectedTicker, setSelectedTicker] = useState<'spyd' | 'hdv'>('spyd');
  const [stockData, setStockData] = useState<Record<string, StockData> | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('1Y');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/api/stock-data`);
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

  const handleTimeRangeChange = (_event: React.MouseEvent<HTMLElement>, newTimeRange: TimeRange) => {
    if (newTimeRange !== null) {
      setTimeRange(newTimeRange);
    }
  };

  const filterDataByTimeRange = (data: StockData['histories']) => {
    const now = new Date();
    const startDate = new Date(now);
    switch (timeRange) {
      case '1M':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case '3M':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case '6M':
        startDate.setMonth(now.getMonth() - 6);
        break;
      case '1Y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case '3Y':
        startDate.setFullYear(now.getFullYear() - 3);
        break;
    }
    return data.filter((item) => new Date(item.date) >= startDate);
  };

  const calculateYAxisDomain = (data: StockData['histories'], key: 'dollar' | 'yen'): [number, number] => {
    if (data.length === 0) return [0, 0];

    const values = data.map((item) => item[key]);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    // 適切な刻み幅を決定
    const range = maxValue - minValue;
    let step = range / 4; // 4段階に分割

    // stepを丸める
    const power = Math.pow(10, Math.floor(Math.log10(step)));
    step = Math.ceil(step / power) * power;

    // 最小値と最大値を調整
    const minDomain = Math.floor(minValue / step) * step;
    const maxDomain = Math.ceil(maxValue / step) * step;

    return [minDomain, maxDomain];
  };

  const getYAxisTicks = (domain: [number, number]) => {
    const [min, max] = domain;
    const step = (max - min) / 5; // 5分割を想定
    const ticks = [];
    for (let i = min; i <= max + step / 2; i += step) {
      ticks.push(Number(i.toFixed(2))); // 小数点2桁まで考慮
    }
    return ticks;
  };

  if (loading) {
    return <CircularProgress />;
  }

  if (!stockData) {
    return <div>No data available</div>;
  }

  const filteredData = filterDataByTimeRange(stockData[selectedTicker].histories);
  const yAxisDomain = calculateYAxisDomain(filteredData, dataKey);
  const yAxisTicks = getYAxisTicks(yAxisDomain);

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
        <ToggleButtonGroup color="primary" value={timeRange} exclusive onChange={handleTimeRangeChange} aria-label="time range">
          <ToggleButton value="1M">1M</ToggleButton>
          <ToggleButton value="3M">3M</ToggleButton>
          <ToggleButton value="6M">6M</ToggleButton>
          <ToggleButton value="1Y">1Y</ToggleButton>
          <ToggleButton value="3Y">3Y</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <LineChart
        width={1000}
        height={500}
        data={filteredData}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis
          domain={yAxisDomain}
          ticks={yAxisTicks}
          tickFormatter={(value) => {
            if (dataKey === 'yen') {
              return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(value);
            } else {
              return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
            }
          }}
        />
        <Tooltip />
        <Legend />
        <Line type="linear" dataKey={dataKey} stroke="#8884d8" activeDot={{ r: 8 }} animationDuration={300} />
      </LineChart>
    </>
  );
};

export default Chart;
