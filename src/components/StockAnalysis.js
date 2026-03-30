import React, { useState, useEffect } from 'react';
import { analyzeStock } from '../api/marketAnalysisService';

const StockAnalysis = ({ stockSymbol }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        const result = await analyzeStock(stockSymbol);
        setData(result);
      } catch (err) {
        setError('Erro ao carregar análise da ação. Tente novamente.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (stockSymbol) {
      fetchData();
    }
  }, [stockSymbol]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Analisando {stockSymbol}... Aguarde a análise expert.</p>
      </div>
    );
  }

  if (error) return <div className="error">{error}</div>;
  if (!data) return <div className="no-data">Nenhum dado disponível para esta ação.</div>;

  const formatNumber = (num, decimals = 2) => {
    if (num === null || num === undefined) return 'N/A';
    return num.toFixed(decimals);
  };

  const changeColor = data.changePercent >= 0 ? 'var(--color-bullish)' : 'var(--color-bearish)';
  const changeSymbol = data.changePercent >= 0 ? '▲' : '▼';

  return (
    <div className="stock-analysis">
      {/* Header */}
      <div className="analysis-header">
        <h2>{data.companyName || stockSymbol}</h2>
        <div className="recommendation-badge">
          <span className={`recommendation ${data.recommendation.toLowerCase().replace(/ /g, '-')}`}>
            {data.recommendation}
          </span>
          <span className="confidence-score">
            🎯 Confiança: {formatNumber(data.confidenceScore, 0)}%
          </span>
        </div>
      </div>

      {/* Price Info */}
      <div className="price-info">
        <p>💰 Preço atual: ${formatNumber(data.currentPrice)}</p>
        <p style={{ color: changeColor }}>
          {changeSymbol} Variação: {formatNumber(data.changePercent)}%
        </p>
      </div>

      {/* Analysis Sections */}
      <div className="analysis-sections">

        {/* Análise Técnica */}
        <section className="technical-analysis">
          <h3><span className="section-icon">📊</span> Análise Técnica</h3>
          <p><strong>Tendência:</strong> {data.technicalAnalysis?.trend || 'N/A'}</p>
          <p><strong>RSI:</strong> <span className="data-value">{formatNumber(data.technicalAnalysis?.rsi, 1)}</span></p>
          <p><strong>MACD:</strong> <span className="data-value">{formatNumber(data.technicalAnalysis?.macd, 3)}</span></p>
          <p><strong>Suporte:</strong> <span className="data-value">${formatNumber(data.technicalAnalysis?.supportLevel)}</span></p>
          <p><strong>Resistência:</strong> <span className="data-value">${formatNumber(data.technicalAnalysis?.resistanceLevel)}</span></p>
          <p><strong>Volume:</strong> {data.technicalAnalysis?.volumeTrend || 'N/A'}</p>
        </section>

        {/* Análise Fundamentalista */}
        <section className="fundamental-analysis">
          <h3><span className="section-icon">📈</span> Análise Fundamentalista</h3>
          <p><strong>P/L:</strong> <span className="data-value">{formatNumber(data.fundamentalAnalysis?.peRatio)}</span></p>
          <p><strong>P/VP:</strong> <span className="data-value">{formatNumber(data.fundamentalAnalysis?.pbRatio)}</span></p>
          <p><strong>Dividend Yield:</strong> <span className="data-value">{formatNumber(data.fundamentalAnalysis?.dividendYield)}%</span></p>
          <p><strong>ROE:</strong> <span className="data-value">{formatNumber(data.fundamentalAnalysis?.roe)}%</span></p>
          <p><strong>Margem Líquida:</strong> <span className="data-value">{formatNumber(data.fundamentalAnalysis?.profitMargin)}%</span></p>
          <p><strong>Cresc. Receita:</strong> <span className="data-value">{formatNumber(data.fundamentalAnalysis?.revenueGrowth)}%</span></p>
        </section>

        {/* Contexto de Mercado */}
        <section className="market-context">
          <h3><span className="section-icon">🌐</span> Contexto de Mercado</h3>
          <p><strong>Setor:</strong> {data.sectorAnalysis?.sector || 'N/A'}</p>
          <p><strong>Perf. Setor:</strong> <span className="data-value">{formatNumber(data.sectorAnalysis?.sectorPerformance)}%</span></p>
          <p><strong>Tendência:</strong> {data.sectorAnalysis?.sectorTrend || 'N/A'}</p>
          <p style={{ fontSize: '0.85rem', lineHeight: '1.6', marginTop: '12px' }}>
            {data.sectorAnalysis?.summary || 'N/A'}
          </p>
        </section>

        {/* Relações Internacionais */}
        <section className="international-relations">
          <h3><span className="section-icon">🌍</span> Relações Internacionais</h3>
          <p><strong>Impacto:</strong> {data.internationalRelations?.impact || 'N/A'}</p>
          <p><strong>Severidade:</strong> <span className="data-value">{formatNumber(data.internationalRelations?.severity, 1)}/10</span></p>
          <p><strong>Fatores:</strong></p>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {data.internationalRelations?.keyFactors?.map((factor, i) => (
              <li key={i} style={{ padding: '4px 0', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                • {factor}
              </li>
            ))}
          </ul>
        </section>

        {/* Previsões de Preço */}
        <section className="price-predictions">
          <h3><span className="section-icon">🔮</span> Previsões de Preço</h3>
          <p><strong>Curto prazo:</strong> <span className="data-value">${formatNumber(data.pricePredictions?.shortTerm?.target)}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '6px' }}>
              ({formatNumber(data.pricePredictions?.shortTerm?.probability, 0)}% prob.)
            </span>
          </p>
          <p><strong>Médio prazo:</strong> <span className="data-value">${formatNumber(data.pricePredictions?.mediumTerm?.target)}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '6px' }}>
              ({formatNumber(data.pricePredictions?.mediumTerm?.probability, 0)}% prob.)
            </span>
          </p>
          <p><strong>Longo prazo:</strong> <span className="data-value">${formatNumber(data.pricePredictions?.longTerm?.target)}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '6px' }}>
              ({formatNumber(data.pricePredictions?.longTerm?.probability, 0)}% prob.)
            </span>
          </p>
          <div className="scenarios">
            <h4>Cenários</h4>
            <div className="scenario-row bullish">
              <span className="scenario-label">🟢 Otimista</span>
              <span className="scenario-value">${formatNumber(data.pricePredictions?.scenarios?.bullish)}</span>
            </div>
            <div className="scenario-row base">
              <span className="scenario-label">🟡 Base</span>
              <span className="scenario-value">${formatNumber(data.pricePredictions?.scenarios?.base)}</span>
            </div>
            <div className="scenario-row bearish">
              <span className="scenario-label">🔴 Pessimista</span>
              <span className="scenario-value">${formatNumber(data.pricePredictions?.scenarios?.bearish)}</span>
            </div>
          </div>
        </section>

        {/* Avaliação de Risco */}
        <section className="risk-assessment">
          <h3><span className="section-icon">⚡</span> Avaliação de Risco</h3>
          <p><strong>Risco Geral:</strong> 
            <span className={`risk-level-badge ${data.riskAssessment?.riskLevel}`} style={{ marginLeft: '8px' }}>
              {data.riskAssessment?.riskLevel || 'N/A'} ({formatNumber(data.riskAssessment?.overallRisk, 1)}/10)
            </span>
          </p>
          <div className="risk-factors">
            <h4>Fatores de Risco</h4>
            <ul>
              {data.riskAssessment?.factors?.map((factor, index) => (
                <li key={index}>
                  <span><strong>{factor.factor}</strong></span>
                  <span className={`risk-level-badge ${factor.level}`}>
                    {factor.level} ({factor.score.toFixed(1)})
                  </span>
                </li>
              )) || []}
            </ul>
          </div>
        </section>

        {/* Notícias e Eventos */}
        <section className="news-events">
          <h3><span className="section-icon">📰</span> Notícias Recentes</h3>
          <ul>
            {data.recentNews?.map((news, index) => (
              <a
                key={index}
                href={news.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`news-item ${news.sentiment}`}
                title="Clique para ver notícia completa"
              >
                <div className="news-item-header">
                  <span className="news-item-title">{news.title}</span>
                  <span className="news-link-icon">🔗</span>
                </div>
                <div className="news-item-meta">
                  <span className="news-date">{news.source} • {news.date}</span>
                  <span className={`sentiment ${news.sentiment}`}>{news.sentiment}</span>
                </div>
              </a>
            )) || []}
          </ul>
          
          <h4 style={{ marginTop: '24px' }}>📅 Próximos Eventos Importantes</h4>
          <ul className="events-list">
            {data.upcomingEvents?.map((event, index) => (
              <li key={index} className="event-item">
                <span className="event-icon">📌</span>
                <div className="event-details">
                  <span className="event-name">{event.event}</span>
                  <span className="event-date">{event.date}</span>
                </div>
              </li>
            )) || []}
          </ul>
        </section>

      </div>
    </div>
  );
};

export default StockAnalysis;