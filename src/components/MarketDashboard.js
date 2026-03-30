import React from 'react';

const marketIndices = [
  { name: 'IBOVESPA', value: '128.453', change: +1.24, icon: '🇧🇷' },
  { name: 'S&P 500', value: '5.234', change: +0.67, icon: '🇺🇸' },
  { name: 'NASDAQ', value: '16.892', change: +1.05, icon: '💻' },
  { name: 'DOW JONES', value: '39.475', change: -0.32, icon: '🏛️' },
  { name: 'FTSE 100', value: '7.935', change: +0.18, icon: '🇬🇧' },
  { name: 'Dólar/Real', value: 'R$ 5.12', change: -0.45, icon: '💵' },
];

const popularStocks = [
  { symbol: 'AAPL', name: 'Apple', price: 178.50, change: +1.25, sector: 'Tecnologia' },
  { symbol: 'PETR4', name: 'Petrobras', price: 38.50, change: +0.95, sector: 'Energia' },
  { symbol: 'VALE3', name: 'Vale', price: 67.20, change: -1.30, sector: 'Mineração' },
  { symbol: 'NVDA', name: 'NVIDIA', price: 875.40, change: +4.30, sector: 'Tecnologia' },
  { symbol: 'ITUB4', name: 'Itaú', price: 32.80, change: +0.45, sector: 'Financeiro' },
  { symbol: 'MSFT', name: 'Microsoft', price: 415.20, change: +2.10, sector: 'Tecnologia' },
  { symbol: 'TSLA', name: 'Tesla', price: 245.30, change: -2.15, sector: 'Automotivo' },
  { symbol: 'BBAS3', name: 'Banco do Brasil', price: 56.70, change: +0.82, sector: 'Financeiro' },
];

const topGainers = [
  { symbol: 'NVDA', name: 'NVIDIA', change: +4.30 },
  { symbol: 'MSFT', name: 'Microsoft', change: +2.10 },
  { symbol: 'WEGE3', name: 'WEG', change: +1.10 },
  { symbol: 'AAPL', name: 'Apple', change: +1.25 },
  { symbol: 'PETR4', name: 'Petrobras', change: +0.95 },
];

const topLosers = [
  { symbol: 'TSLA', name: 'Tesla', change: -2.15 },
  { symbol: 'VALE3', name: 'Vale', change: -1.30 },
  { symbol: 'GOOGL', name: 'Alphabet', change: -0.85 },
  { symbol: 'ABEV3', name: 'Ambev', change: -0.22 },
  { symbol: 'MGLU3', name: 'Magazine Luiza', change: -3.40 },
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
  return (
    <div className="market-dashboard">

      {/* Índices de Mercado */}
      <section className="dashboard-section indices-section">
        <h3 className="dashboard-section-title">
          <span className="section-title-icon">🏛️</span>
          Indicadores de Mercado
          <span className="live-badge">● LIVE</span>
        </h3>
        <div className="indices-grid">
          {marketIndices.map((idx) => (
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
          Ações Populares
          <span className="section-subtitle">Clique para analisar</span>
        </h3>
        <div className="popular-grid">
          {popularStocks.map((stock) => (
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
      <div className="movers-row">
        <section className="dashboard-section movers-section gainers">
          <h3 className="dashboard-section-title">
            <span className="section-title-icon">🚀</span>
            Maiores Altas
          </h3>
          <ul className="movers-list">
            {topGainers.map((stock, i) => (
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
            Maiores Baixas
          </h3>
          <ul className="movers-list">
            {topLosers.map((stock, i) => (
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
        <p>⚠️ <strong>Aviso Legal:</strong> Esta plataforma é para fins educacionais e informativos. 
        As análises e previsões são simuladas e não constituem aconselhamento financeiro. 
        Sempre consulte um profissional qualificado antes de investir.</p>
      </div>
    </div>
  );
};

export default MarketDashboard;
