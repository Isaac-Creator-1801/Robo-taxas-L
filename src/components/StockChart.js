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

      // 1. LIMPEZA E FORMATAÇÃO DE DADOS (Bloomberg Style)
      const rows = [['Data', 'Preço']];
      const locale = 'pt-BR';
      const dateOptions = range === '1d' 
        ? { hour: '2-digit', minute: '2-digit' } 
        : { day: '2-digit', month: '2-digit' };
      
      // Filtrar e ordenar dados históricos
      const validHistoricalData = (data.historicalDataPrice || [])
        .filter(point => point && point.date && point.close !== null)
        .map(point => ({
          ...point,
          dateObj: new Date(point.date * 1000)
        }))
        .filter(point => !isNaN(point.dateObj.getTime()))
        .sort((a, b) => a.dateObj - b.dateObj);
      
      // Garantir que o último ponto seja o valor atual
      if (validHistoricalData.length > 0 && Number.isFinite(data.regularMarketPrice)) {
        const lastPoint = validHistoricalData[validHistoricalData.length - 1];
        lastPoint.close = data.regularMarketPrice;
      }
      
      validHistoricalData.forEach(point => {
        const label = new Intl.DateTimeFormat(locale, dateOptions).format(point.dateObj);
        rows.push([label, Number(point.close.toFixed(2))]);
      });

      if (rows.length <= 1) throw new Error('Histórico insuficiente');

      setChartData(rows);
      setStats({
        currency: data.currency || 'BRL',
        prevClose: data.regularMarketPreviousClose || rows[1]?.[1],
        currentPrice: data.regularMarketPrice
      });
        setStats({
          currency: data.currency || 'BRL',
          prevClose: data.regularMarketPreviousClose || rows[1][1]
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
    colors: ['#00ff88'], // Cor Verde Neon Bloomberg
    areaOpacity: 0.1,
    hAxis: {
      textStyle: { color: '#666', fontSize: 10, fontFamily: 'Inter' },
      gridlines: { color: 'transparent' },
      baselineColor: 'transparent',
    },
    vAxis: {
      textStyle: { color: '#666', fontSize: 10, fontFamily: 'Inter' },
      gridlines: { color: 'rgba(255,255,255,0.03)' },
      baselineColor: 'transparent',
      format: 'short'
    },
    chartArea: { width: '95%', height: '80%', top: 20, bottom: 40 },
    legend: { position: 'none' },
    focusTarget: 'category', // CRÍTICO: Tooltip segue o mouse horizontalmente
    tooltip: { 
      trigger: 'both',
      isHtml: true,
      textStyle: { color: '#fff', fontSize: 12 }
    },
    crosshair: { 
      trigger: 'both', 
      orientation: 'vertical',
      color: '#00ff88', 
      opacity: 0.4 
    },
    animation: { startup: true, duration: 600, easing: 'out' }
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
          {stats.currentPrice && (
            <span className="current-price">Atual: {stats.currency} {stats.currentPrice.toFixed(2)}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default StockChart;
