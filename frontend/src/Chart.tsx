import type React from 'react';
import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select, { type SelectChangeEvent } from '@mui/material/Select';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { data } from './data';

const Chart: React.FC = () => {
  const [dataKey, setDataKey] = useState<'dollar' | 'yen'>('yen');
  const [selectedTicker, setSelectedTicker] = useState<'spyd' | 'hdv'>('spyd');

  const handleCurrencyChange = (_event: React.MouseEvent<HTMLElement>, newDataKey: 'dollar' | 'yen') => {
    if (newDataKey !== null) {
      setDataKey(newDataKey);
    }
  };

  const handleTickerChange = (event: SelectChangeEvent<'spyd' | 'hdv'>) => {
    setSelectedTicker(event.target.value as 'spyd' | 'hdv');
  };

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
        data={data[selectedTicker].histories}
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
