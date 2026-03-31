import React, { useState, useEffect } from 'react';
import { fetchMarketOverview } from '../api/stockService';
import { getTopSearches } from '../api/searchHistoryService';

const fallbackIndices = [
  { symbol: '^BVSP', name: 'IBOVESPA', value: '...', change: null, icon: '🇧🇷' },
  { symbol: '^GSPC', name: 'S&P 500', value: '...', change: null, icon: '🇺🇸' },
  { symbol: '^IXIC', name: 'NASDAQ', value: '...', change: null, icon: '💻' },
  { symbol: '^DJI', name: 'DOW JONES', value: '...', change: null, icon: '🏛️' },
  { symbol: '^FTSE', name: 'FTSE 100', value: '...', change: null, icon: '🇬🇧' },
  { symbol: 'BRL=X', name: 'Dólar/Real', value: 'R$ ...', change: null, icon: '💵' },
];

const fallbackPopularStocks = [
  { symbol: 'AAPL', name: 'Apple', price: null, change: null, sector: 'Tecnologia' },
  { symbol: 'PETR4', name: 'Petrobras', price: null, change: null, sector: 'Energia' },
  { symbol: 'VALE3', name: 'Vale', price: null, change: null, sector: 'Mineração' },
  { symbol: 'NVDA', name: 'NVIDIA', price: null, change: null, sector: 'Tecnologia' },
  { symbol: 'ITUB4', name: 'Itaú', price: null, change: null, sector: 'Financeiro' },
  { symbol: 'MSFT', name: 'Microsoft', price: null, change: null, sector: 'Tecnologia' },
  { symbol: 'TSLA', name: 'Tesla', price: null, change: null, sector: 'Automotivo' },
  { symbol: 'BBAS3', name: 'Banco do Brasil', price: null, change: null, sector: 'Financeiro' },
];

const features = [
  {
    icon: '📊',
    title: 'Análise Técnica',
    desc: 'RSI, MACD, médias móveis e tendências com dados históricos reais'
  },
  {
    icon: '📈',
    title: 'Análise Fundamentalista',
    desc: 'P/L, P/VP, ROE, Dividend Yield e margens com fontes públicas'
  },
  {
    icon: '🎯',
    title: 'Score de Compra',
    desc: 'Score 0-100 baseado em fundamentos, técnico, risco, insiders e sentimento'
  },
  {
    icon: '🧭',
    title: 'Movimentação de Insiders',
    desc: 'Compras e vendas oficiais com preço médio e saldo líquido'
  },
  {
    icon: '⚡',
    title: 'Avaliação de Risco',
    desc: 'Risco baseado em volatilidade, drawdown e endividamento real'
  },
  {
    icon: '📰',
    title: 'Notícias em Tempo Real',
    desc: 'Notícias recentes com sentimento calculado automaticamente'
  },
];

const MarketDashboard = ({ onStockClick }) => {
  const [indices, setIndices] = useState(fallbackIndices);
  const [popular, setPopular] = useState(fallbackPopularStocks);
  const [gainers, setGainers] = useState([]);
  const [losers, setLosers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUsingCache, setIsUsingCache] = useState(false);
  const [lastUpdateDate, setLastUpdateDate] = useState(null);
  const [errorDetails, setErrorDetails] = useState({ type: null, failedAssets: [] });
  const [topSearches, setTopSearches] = useState([]);

  useEffect(() => {
    let active = true;

    const loadRealtimeDashboard = async () => {
      const idxSymbols = fallbackIndices.map(i => i.symbol);
      const popSymbols = fallbackPopularStocks.map(p => p.symbol);
      const allSymbols = [...idxSymbols, ...popSymbols];

      const realData = await fetchMarketOverview(allSymbols);

      if (realData && active) {
        let cachedUsed = false;
        let oldestTimestamp = null;
        let failedList = [];
        let errorType = null;

        setIndices(fallbackIndices.map(idx => {
          const data = realData[idx.symbol];
          if (data) {
            if (data.isCached) {
               cachedUsed = true;
               failedList.push(idx.name);
               errorType = data.errorType;
               if (data.timestamp && (!oldestTimestamp || data.timestamp < oldestTimestamp)) {
                 oldestTimestamp = data.timestamp;
               }
            }
            let valStr = data.price.toFixed(2);
            if (idx.symbol === 'BRL=X') valStr = `R$ ${valStr}`;
            return { ...idx, value: valStr, change: data.change };
          }
          return idx;
        }));

        const updatedPopular = fallbackPopularStocks.map(stock => {
          const data = realData[stock.symbol];
          if (data) {
            if (data.isCached) {
               cachedUsed = true;
               failedList.push(stock.symbol);
               errorType = data.errorType;
               if (data.timestamp && (!oldestTimestamp || data.timestamp < oldestTimestamp)) {
                 oldestTimestamp = data.timestamp;
               }
            }
            return { ...stock, price: data.price, change: data.change };
          }
          return stock;
        });
        
        setIsUsingCache(cachedUsed);
        setErrorDetails({ type: errorType, failedAssets: [...new Set(failedList)] });
        if (oldestTimestamp) {
          setLastUpdateDate(new Date(oldestTimestamp).toLocaleString('pt-BR'));
        }

        setPopular(updatedPopular);

        const filteredByChange = updatedPopular.filter((item) => Number.isFinite(item.change));
        const sortedDesc = [...filteredByChange].sort((a, b) => b.change - a.change);
        setGainers(sortedDesc.slice(0, 5));
        
        const sortedAsc = [...filteredByChange].sort((a, b) => a.change - b.change);
        setLosers(sortedAsc.slice(0, 5));
      }

      if (active) setLoading(false);
    };

    const loadTrends = async () => {
      const trends = await getTopSearches(5);
      if (active) setTopSearches(trends);
    };

    loadRealtimeDashboard();
    loadTrends();
    
    const intervalId = setInterval(() => {
      loadRealtimeDashboard();
      loadTrends();
    }, 5 * 60 * 1000);

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, []);

  const getErrorMessage = () => {
    switch (errorDetails.type) {
      case 'OFFLINE': return 'Você parece estar sem conexão com a internet.';
      case 'RATE_LIMIT': return 'A API de cotações atingiu o limite público de consultas.';
      case 'NETWORK_ERROR': return 'Houve um erro de rede ou o servidor não respondeu.';
      case 'API_ERROR': return 'A API de cotações retornou um erro interno (Serviço Instável).';
      default: return 'Não foi possível sincronizar todos os dados em tempo real.';
    }
  };

  return (
    <div className={`market-dashboard ${loading ? 'opacity-50' : ''}`}>

      {isUsingCache && !loading && (
        <div style={{
          backgroundColor: 'rgba(217, 119, 6, 0.15)',
          color: '#fcd34d',
          padding: '16px 20px',
          borderRadius: '12px',
          marginBottom: '28px',
          border: '1px solid rgba(217, 119, 6, 0.4)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          fontSize: '0.9rem',
          backdropFilter: 'blur(8px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.4rem' }}>⚠️</span>
            <strong style={{ fontSize: '1.0rem' }}>Diagnóstico de Conexão:</strong> 
          </div>
          <div style={{ marginLeft: '32px' }}>
            <p style={{ marginBottom: '6px', opacity: 0.9 }}>{getErrorMessage()}</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <strong>Buscando do Cache Para:</strong> {errorDetails.failedAssets.join(', ') || 'Todo o mercado'}.
            </p>
            {lastUpdateDate ? (
              <p style={{ fontSize: '0.8rem', marginTop: '6px', color: 'var(--accent-gold)' }}>
                 🕒 Última sincronização completa: {lastUpdateDate}
              </p>
            ) : (
              <p style={{ fontSize: '0.8rem', marginTop: '6px', fontStyle: 'italic' }}>
                * Sem dados anteriores no cache deste dispositivo.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Top Pesquisas (Trendings) */}
      {topSearches.length > 0 && (
        <section className="dashboard-section trends-section">
          <h3 className="dashboard-section-title">
            <span className="section-title-icon">🔥</span>
            Tendências da Comunidade
            <span className="section-subtitle">Ações mais investigadas hoje</span>
          </h3>
          <div className="trends-grid">
            {topSearches.map((item, index) => (
              <div 
                key={item.symbol} 
                className="trend-tag"
                onClick={() => onStockClick(item.symbol)}
              >
                <span className="trend-rank">#{index + 1}</span>
                <span className="trend-symbol">{item.symbol}</span>
                <span className="trend-count">{item.count} buscas</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Índices de Mercado */}
      <section className="dashboard-section indices-section">
        <h3 className="dashboard-section-title">
          <span className="section-title-icon">🏛️</span>
          Indicadores de Mercado
          {loading ? (
             <span className="live-badge" style={{background: 'gray', color: '#fff'}}>CARREGANDO...</span>
          ) : (
             <span className="live-badge">● LIVE</span>
          )}
        </h3>
        <div className="indices-grid">
          {indices.map((idx) => (
            <div key={idx.name} className="index-card">
              <div className="index-header">
                <span className="index-icon">{idx.icon}</span>
                <span className="index-name">{idx.name}</span>
              </div>
              <div className="index-value">{idx.value}</div>
              <div className={`index-change ${Number.isFinite(idx.change) ? (idx.change >= 0 ? 'positive' : 'negative') : 'neutral'}`}>
                {Number.isFinite(idx.change)
                  ? `${idx.change >= 0 ? '▲' : '▼'} ${Math.abs(idx.change).toFixed(2)}%`
                  : '—'}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Ações Populares */}
      <section className="dashboard-section popular-section">
        <h3 className="dashboard-section-title">
          <span className="section-title-icon">🔥</span>
          Ativos em Tempo Real
          <span className="section-subtitle">Clique para analisar</span>
        </h3>
        <div className="popular-grid">
          {popular.map((stock) => (
            <div
              key={stock.symbol}
              className="popular-card"
              onClick={() => onStockClick(stock.symbol)}
            >
              <div className="popular-card-top">
                <div className="popular-symbol">{stock.symbol}</div>
                <span className={`popular-change ${Number.isFinite(stock.change) ? (stock.change >= 0 ? 'positive' : 'negative') : 'neutral'}`}>
                  {Number.isFinite(stock.change)
                    ? `${stock.change >= 0 ? '▲' : '▼'} ${Math.abs(stock.change).toFixed(2)}%`
                    : '—'}
                </span>
              </div>
              <div className="popular-name">{stock.name}</div>
              <div className="popular-price">
                {Number.isFinite(stock.price) ? `$${stock.price.toFixed(2)}` : '—'}
              </div>
              <div className="popular-sector">{stock.sector}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Maiores Altas / Baixas */}
      {(!loading && gainers.length > 0) && (
        <div className="movers-row">
          <section className="dashboard-section movers-section gainers">
            <h3 className="dashboard-section-title">
              <span className="section-title-icon">🚀</span>
              Maiores Altas (Hoje)
            </h3>
            <ul className="movers-list">
              {gainers.map((stock, i) => (
                <li
                  key={stock.symbol}
                  className="mover-item"
                  onClick={() => onStockClick(stock.symbol)}
                >
                  <span className="mover-rank">#{i + 1}</span>
                  <div className="mover-info">
                    <span className="mover-symbol">{stock.symbol}</span>
                    <span className="mover-name">{stock.name}</span>
                  </div>
                  <span className="mover-change positive">+{stock.change.toFixed(2)}%</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="dashboard-section movers-section losers">
            <h3 className="dashboard-section-title">
              <span className="section-title-icon">📉</span>
              Maiores Baixas (Hoje)
            </h3>
            <ul className="movers-list">
              {losers.map((stock, i) => (
                <li
                  key={stock.symbol}
                  className="mover-item"
                  onClick={() => onStockClick(stock.symbol)}
                >
                  <span className="mover-rank">#{i + 1}</span>
                  <div className="mover-info">
                    <span className="mover-symbol">{stock.symbol}</span>
                    <span className="mover-name">{stock.name}</span>
                  </div>
                  <span className="mover-change negative">{stock.change.toFixed(2)}%</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}

      {/* Features da plataforma */}
      <section className="dashboard-section features-section">
        <h3 className="dashboard-section-title">
          <span className="section-title-icon">✨</span>
          O que nossa análise oferece
        </h3>
        <div className="features-grid">
          {features.map((feat) => (
            <div key={feat.title} className="feature-card">
              <span className="feature-icon">{feat.icon}</span>
              <h4 className="feature-title">{feat.title}</h4>
              <p className="feature-desc">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Disclaimer */}
      <div className="dashboard-disclaimer">
        <p>⚠️ <strong>Aviso Legal:</strong> As cotações são baseadas em dados de mercado reais (atraso de até 15 min), e as análises são calculadas a partir de fontes públicas gratuitas e dados históricos. Não constituem aconselhamento ou recomendação oficial de investimento.</p>
      </div>
    </div>
  );
};

export default MarketDashboard;
