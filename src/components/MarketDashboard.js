import React, { useState, useEffect } from 'react';
import { fetchMarketOverview } from '../api/stockService';

const fallbackIndices = [
  { symbol: '^BVSP', name: 'IBOVESPA', value: '...', change: 0, icon: '🇧🇷' },
  { symbol: '^GSPC', name: 'S&P 500', value: '...', change: 0, icon: '🇺🇸' },
  { symbol: '^IXIC', name: 'NASDAQ', value: '...', change: 0, icon: '💻' },
  { symbol: '^DJI', name: 'DOW JONES', value: '...', change: 0, icon: '🏛️' },
  { symbol: '^FTSE', name: 'FTSE 100', value: '...', change: 0, icon: '🇬🇧' },
  { symbol: 'BRL=X', name: 'Dólar/Real', value: 'R$ ...', change: 0, icon: '💵' },
];

const fallbackPopularStocks = [
  { symbol: 'AAPL', name: 'Apple', price: 0, change: 0, sector: 'Tecnologia' },
  { symbol: 'PETR4', name: 'Petrobras', price: 0, change: 0, sector: 'Energia' },
  { symbol: 'VALE3', name: 'Vale', price: 0, change: 0, sector: 'Mineração' },
  { symbol: 'NVDA', name: 'NVIDIA', price: 0, change: 0, sector: 'Tecnologia' },
  { symbol: 'ITUB4', name: 'Itaú', price: 0, change: 0, sector: 'Financeiro' },
  { symbol: 'MSFT', name: 'Microsoft', price: 0, change: 0, sector: 'Tecnologia' },
  { symbol: 'TSLA', name: 'Tesla', price: 0, change: 0, sector: 'Automotivo' },
  { symbol: 'BBAS3', name: 'Banco do Brasil', price: 0, change: 0, sector: 'Financeiro' },
];

const features = [
  {
    icon: '📊',
    title: 'Análise Técnica',
    desc: 'RSI, MACD, Médias Móveis e tendências em tempo real'
  },
  {
    icon: '📈',
    title: 'Análise Fundamentalista',
    desc: 'P/L, P/VP, ROE, Dividend Yield e margens de lucro'
  },
  {
    icon: '🔮',
    title: 'Previsões de Preço',
    desc: 'Cenários otimista, base e pessimista para curto/médio/longo prazo'
  },
  {
    icon: '🌍',
    title: 'Contexto Global',
    desc: 'Impacto de relações internacionais e fatores macroeconômicos'
  },
  {
    icon: '⚡',
    title: 'Avaliação de Risco',
    desc: 'Score de risco detalhado baseado em 6 fatores-chave'
  },
  {
    icon: '📰',
    title: 'Notícias em Tempo Real',
    desc: 'Notícias recentes clicáveis com análise de sentimento'
  },
];

const MarketDashboard = ({ onStockClick }) => {
  const [indices, setIndices] = useState(fallbackIndices);
  const [popular, setPopular] = useState(fallbackPopularStocks);
  const [gainers, setGainers] = useState([]);
  const [losers, setLosers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadRealtimeDashboard = async () => {
      // 1. Busca os índices (BRL=X, ^BVSP...)
      const idxSymbols = fallbackIndices.map(i => i.symbol);
      const popSymbols = fallbackPopularStocks.map(p => p.symbol);
      const allSymbols = [...idxSymbols, ...popSymbols];

      const realData = await fetchMarketOverview(allSymbols);

      if (realData && active) {
        // Atualiza os índices de mercado
        setIndices(fallbackIndices.map(idx => {
          const data = realData[idx.symbol];
          if (data) {
            let valStr = data.price.toFixed(2);
            if (idx.symbol === 'BRL=X') valStr = `R$ ${valStr}`;
            return { ...idx, value: valStr, change: data.change };
          }
          return idx;
        }));

        // Atualiza ações populares
        const updatedPopular = fallbackPopularStocks.map(stock => {
          const data = realData[stock.symbol];
          if (data) {
            return { ...stock, price: data.price, change: data.change };
          }
          return stock;
        });
        
        setPopular(updatedPopular);

        // Sort para gainers/losers baseado na list popular (top 5 de cada)
        const sortedDesc = [...updatedPopular].sort((a,b) => b.change - a.change);
        setGainers(sortedDesc.slice(0, 5));
        
        const sortedAsc = [...updatedPopular].sort((a,b) => a.change - b.change);
        setLosers(sortedAsc.slice(0, 5));
      }

      if (active) setLoading(false);
    };

    loadRealtimeDashboard();
    
    // Atualiza a cada 5 minutos
    const intervalId = setInterval(loadRealtimeDashboard, 5 * 60 * 1000);

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, []);

  return (
    <div className={`market-dashboard ${loading ? 'opacity-50' : ''}`}>

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
              <div className={`index-change ${idx.change >= 0 ? 'positive' : 'negative'}`}>
                {idx.change >= 0 ? '▲' : '▼'} {Math.abs(idx.change).toFixed(2)}%
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
                <span className={`popular-change ${stock.change >= 0 ? 'positive' : 'negative'}`}>
                  {stock.change >= 0 ? '▲' : '▼'} {Math.abs(stock.change).toFixed(2)}%
                </span>
              </div>
              <div className="popular-name">{stock.name}</div>
              <div className="popular-price">${stock.price.toFixed(2)}</div>
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
        <p>⚠️ <strong>Aviso Legal:</strong> As cotações são baseadas em dados de mercado reais (atraso de até 15 min), mas as análises técnicas e previsões do Robô das Taxas são algorítmicas e apenas para fins informativos. Não constituem aconselhamento ou recomendação oficial de investimento.</p>
      </div>
    </div>
  );
};

export default MarketDashboard;
