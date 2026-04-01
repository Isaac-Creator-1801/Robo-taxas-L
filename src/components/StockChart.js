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
        
        const currentRangeData = ranges.find(r => r.value === range);
        const data = await fetchChartData(symbol, range, currentRangeData.interval);
        
        if (!isMounted) return;

        if (!data.historicalDataPrice || data.historicalDataPrice.length === 0) {
          throw new Error('Sem histórico disponível.');
        }

        // Formatar dados (FORMATO SIMPLIFICADO: APENAS STRINGS E NÚMEROS)
        const rows = [['Data', 'Preço']];
        
        data.historicalDataPrice.forEach(point => {
          if (!point || point.date === null || point.close === null) return;
          
          try {
            const d = new Date(point.date * 1000);
            if (isNaN(d.getTime())) return;

            let label = '';
            if (range === '1d') {
              label = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
            } else if (range === '5d' || range === '1mo') {
              label = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
            } else {
              label = `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear().toString().slice(-2)}`;
            }
            
            rows.push([label, Number(point.close.toFixed(2))]);
          } catch (e) {
            console.warn('[StockChart] Ponto ignorado');
          }
        });

        if (rows.length <= 1) throw new Error('Dados indisponíveis');

        setChartData(rows);
        setStats({
          currency: data.currency || 'BRL',
          prevClose: data.regularMarketPreviousClose || (rows.length > 1 ? rows[1][1] : 0)
        });
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (symbol) loadData();
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
      textPosition: 'out'
    },
    vAxis: {
      textStyle: { color: '#888', fontSize: 10 },
      gridlines: { color: 'rgba(255,255,255,0.05)' },
      baselineColor: 'rgba(255,255,255,0.1)',
      format: 'decimal'
    },
    chartArea: { width: '90%', height: '80%', top: 20, bottom: 40 },
    legend: { position: 'none' },
    focusTarget: 'category', // FAZ O TOOLTIP SEGUIR O MOUSE HORIZONTALMENTE
    tooltip: { 
      trigger: 'both',
      isHtml: true
    },
    crosshair: { 
      trigger: 'both', 
      orientation: 'vertical',
      color: '#10b981', 
      opacity: 0.5 
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
            <span>Carregando...</span>
          </div>
        ) : error ? (
          <div className="chart-error">
            <span>⚠️ {error}</span>
          </div>
        ) : (
          <Chart
            key={`chart-${symbol}-${range}-${chartData.length}`}
            chartType="AreaChart"
            width="100%"
            height="350px"
            data={chartData}
            options={options}
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
