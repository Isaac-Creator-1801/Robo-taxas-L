import React, { useState, useEffect } from 'react';
import { Chart } from 'react-google-charts';
import { fetchChartData } from '../api/stockService';

const ranges = [
  { label: '1D', value: '1d', interval: '5m' },
  { label: '5D', value: '5d', interval: '15m' },
  { label: '1M', value: '1mo', interval: '1d' },
  { label: '6M', value: '6mo', interval: '1d' },
  { label: 'YTD', value: 'ytd', interval: '1d' },
  { label: '1Y', value: '1y', interval: '1d' },
  { label: '5Y', value: '5y', interval: '1wk' },
  { label: 'Max', value: 'max', interval: '1mo' },
];

const StockChart = ({ symbol }) => {
  const [range, setRange] = useState('1mo');
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const currentRangeConfigs = ranges.find(r => r.value === range);
        const data = await fetchChartData(symbol, range, currentRangeConfigs.interval);
        
        if (!isMounted) return;

        if (!data.historicalDataPrice || data.historicalDataPrice.length === 0) {
          throw new Error('Dados históricos não disponíveis para este período.');
        }

        // Formatar dados para o Google Charts usando Objetos Date para melhor escala
        const formatted = [[{ type: 'date', label: 'Data' }, 'Preço']];
        
        data.historicalDataPrice.forEach(point => {
          const date = new Date(point.date * 1000);
          formatted.push([date, point.close]);
        });

        setChartData(formatted);
        setStats({
          price: data.regularMarketPrice,
          prevClose: data.regularMarketPreviousClose,
          currency: data.currency
        });
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (symbol) {
      loadData();
    }
    return () => { isMounted = false; };
  }, [symbol, range]);

  const options = {
    backgroundColor: 'transparent',
    colors: ['#10b981'],
    areaOpacity: 0.15,
    hAxis: {
      textStyle: { color: '#888', fontSize: 10 },
      gridlines: { color: 'transparent' },
      baselineColor: 'transparent',
      format: range === '1d' ? 'HH:mm' : range === '5d' ? 'dd/MM HH:mm' : 'dd/MM/yy',
    },
    vAxis: {
      textStyle: { color: '#888', fontSize: 10 },
      gridlines: { color: 'rgba(255,255,255,0.05)' },
      baselineColor: 'rgba(255,255,255,0.1)',
      format: 'currency',
    },
    chartArea: { width: '90%', height: '80%', top: 20, bottom: 40 },
    legend: { position: 'none' },
    tooltip: { 
      isHtml: true,
      trigger: 'both'
    },
    crosshair: {
      trigger: 'both',
      orientation: 'vertical',
      color: '#888',
      opacity: 0.5
    },
    explorer: {
      actions: ['dragToZoom', 'rightClickToReset'],
      axis: 'horizontal',
      keepInBounds: true,
      maxZoomIn: 4.0
    }
  };

  return (
    <div className="stock-chart-container">
      <div className="chart-header">
        <div className="chart-range-selector">
          {ranges.map(r => (
            <button 
              key={r.value}
              className={`range-btn ${range === r.value ? 'active' : ''}`}
              onClick={() => setRange(r.value)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="chart-wrapper">
        {loading ? (
          <div className="chart-loader">
            <div className="spinner-small"></div>
            <span>Carregando dados...</span>
          </div>
        ) : error ? (
          <div className="chart-error">
            <span>⚠️ {error}</span>
            <button onClick={() => setRange('1mo')} className="retry-btn">Ver 1 Mês</button>
          </div>
        ) : (
          <Chart
            key={`${symbol}-${range}`} // Forçar re-montagem ao trocar períodos
            chartType="AreaChart"
            width="100%"
            height="350px"
            data={chartData}
            options={options}
            loader={<div className="chart-loader"><div className="spinner-small"></div></div>}
          />
        )}
      </div>

      {stats && !loading && !error && (
        <div className="chart-footer">
          <span className="prev-close">Fechamento anterior: {stats.currency} {stats.prevClose?.toFixed(2)}</span>
        </div>
      )}
    </div>
  );
};

export default StockChart;
