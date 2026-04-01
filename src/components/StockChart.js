import React, { useState, useEffect } from 'react';
import { Chart } from 'react-google-charts';
import { fetchChartData } from '../api/stockService';

const StockChart = ({ symbol }) => {
  const [range, setRange] = useState('1mo');
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

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

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const currentRange = ranges.find(r => r.value === range);
        const data = await fetchChartData(symbol, range, currentRange.interval);
        
        if (!data.historicalDataPrice || data.historicalDataPrice.length === 0) {
          throw new Error('Histórico indisponível para este período.');
        }

        // Formatar dados para o Google Charts
        // [ ["Label", "Preço"], ["Time", Val], ... ]
        const formatted = [['Tempo', 'Preço']];
        
        data.historicalDataPrice.forEach(point => {
          const date = new Date(point.date * 1000);
          let label = '';
          
          if (range === '1d') {
            label = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          } else if (range === '5d') {
             label = `${date.getDate()}/${date.getMonth()+1} ${date.getHours()}:00`;
          } else {
            label = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
          }
          
          formatted.push([label, point.close]);
        });

        setChartData(formatted);
        setStats({
          price: data.regularMarketPrice,
          prevClose: data.regularMarketPreviousClose,
          currency: data.currency
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (symbol) {
      loadData();
    }
  }, [symbol, range]);

  const options = {
    backgroundColor: 'transparent',
    colors: ['#10b981'],
    areaOpacity: 0.1,
    hAxis: {
      textStyle: { color: '#888', fontSize: 10 },
      gridlines: { color: 'transparent' },
      baselineColor: 'transparent',
    },
    vAxis: {
      textStyle: { color: '#888', fontSize: 10 },
      gridlines: { color: 'rgba(255,255,255,0.05)' },
      baselineColor: 'rgba(255,255,255,0.1)',
      format: 'decimal',
    },
    chartArea: { width: '90%', height: '80%' },
    legend: { position: 'none' },
    tooltip: { 
      isHtml: true,
      trigger: 'both',
      textStyle: { color: '#fff' }
    },
    crosshair: {
      trigger: 'both',
      orientation: 'vertical',
      color: '#888',
      opacity: 0.5
    }
  };

  if (error && range !== '1mo') {
     // Se der erro em um range específico, tentamos voltar pro 1M automático? 
     // Por enquanto só exibe o erro
  }

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
            <span>Carregando gráfico...</span>
          </div>
        ) : error ? (
          <div className="chart-error">
            <span>⚠️ {error}</span>
            <button onClick={() => setRange('1mo')} className="retry-btn">Ver 1 Mês</button>
          </div>
        ) : (
          <Chart
            chartType="AreaChart"
            width="100%"
            height="320px"
            data={chartData}
            options={options}
            loader={<div>Carregando...</div>}
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
