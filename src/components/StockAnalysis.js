import React, { useState, useEffect } from 'react';
import { analyzeStock } from '../api/marketAnalysisService';
import ValuationCalculator from './ValuationCalculator';
import StockChart from './StockChart';
import '../styles/fundamentals.css';

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
    if (num === null || num === undefined || Number.isNaN(num)) return 'Não encontrado';
    return num.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  const formatInteger = (num) => {
    if (num === null || num === undefined || Number.isNaN(num)) return 'Não encontrado';
    return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(num);
  };

  const formatSignedInteger = (num) => {
    if (num === null || num === undefined || Number.isNaN(num)) return 'N/A';
    if (num === 0) return '0';
    const formatted = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(Math.abs(num));
    return `${num < 0 ? '-' : '+'}${formatted}`;
  };

  const formatCurrency = (num, currency = 'BRL') => {
    if (num === null || num === undefined || Number.isNaN(num)) return 'Não encontrado';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(num);
  };

  const formatSignedCurrency = (num, currency = 'BRL') => {
    if (num === null || num === undefined || Number.isNaN(num)) return 'N/A';
    if (num === 0) return formatCurrency(0, currency);
    const formatted = formatCurrency(Math.abs(num), currency);
    return `${num < 0 ? '-' : '+'}${formatted}`;
  };

  const getPolarityClass = (value) => {
    if (value > 0) return 'positive';
    if (value < 0) return 'negative';
    return 'neutral';
  };

  const getScoreTier = (value) => {
    if (value >= 80) return 'excellent';
    if (value >= 65) return 'good';
    if (value >= 50) return 'neutral';
    if (value >= 35) return 'caution';
    return 'weak';
  };

  const changeColor = data.changePercent >= 0 ? 'var(--color-bullish)' : 'var(--color-bearish)';
  const changeSymbol = data.changePercent >= 0 ? '▲' : '▼';
  const insiderActivity = data.insiderActivity || {
    status: 'unavailable',
    message: 'Dados de insiders indisponíveis para este ativo.'
  };
  const insiderPolarity = getPolarityClass(insiderActivity?.netValue || 0);
  const buyScoreValue = Number.isFinite(data.buyScore) ? data.buyScore : null;
  const buyScoreTier = buyScoreValue !== null ? getScoreTier(buyScoreValue) : 'neutral';
  const buyScoreDisplay = buyScoreValue !== null ? formatNumber(buyScoreValue, 0) : 'N/A';
  const buyScoreFill = buyScoreValue !== null ? Math.min(100, Math.max(0, buyScoreValue)) : 0;
  const buyScoreBreakdown = Array.isArray(data.buyScoreBreakdown) ? data.buyScoreBreakdown : [];

  const isSurvivalMode = data.source === 'cache';

  return (
    <div className="stock-analysis">
      {/* Survival Mode Alert */}
      {isSurvivalMode && (
        <div style={{
          background: 'rgba(255, 152, 0, 0.1)',
          border: '1px solid #FF9800',
          color: '#FF9800',
          padding: '12px 20px',
          borderRadius: '12px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          backdropFilter: 'blur(8px)',
          fontSize: '0.9rem'
        }}>
          <span style={{ fontSize: '1.2rem' }}>⚠️</span>
          <div>
            <strong style={{ display: 'block', marginBottom: '2px' }}>Modo de Sobrevivência Ativado</strong>
            <span style={{ opacity: 0.8 }}>Limite de API atingido. Exibindo dados salvos em cache.</span>
          </div>
        </div>
      )}

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
        {/* Banner de Status de API (Modo Sobrevivência) */}
        {(data.source === 'cache' || data.isCached) && (
          <div className="resilience-banner" style={{ 
            backgroundColor: '#fffbeb', 
            borderLeft: '4px solid #f59e0b', 
            padding: '10px', 
            marginBottom: '15px', 
            borderRadius: '4px',
            fontSize: '13px',
            color: '#b45309',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>💾</span>
            <span><strong>Modo de Sobrevivência:</strong> Exibindo dados salvos em cache (Limite de API atingido).</span>
          </div>
        )}
        <p>💰 Preço atual: ${formatNumber(data.currentPrice)}</p>
        <p style={{ color: changeColor }}>
          {changeSymbol} Variação: {formatNumber(data.changePercent)}%
        </p>
      </div>

      {/* Gráfico Estilo Google Finance */}
      <StockChart symbol={data.symbol || stockSymbol} />

      {/* Calculadora de Valuation Mágica */}
      <ValuationCalculator 
        key={data.symbol || stockSymbol}
        currentPrice={data.currentPrice} 
        symbol={data.symbol || stockSymbol} 
        fundamentalData={data.fundamentalAnalysis}
      />

      {/* Analysis Sections */}
      <div className="analysis-sections">

        {/* Score de Compra */}
        <section className="buy-score">
          <h3><span className="section-icon">🎯</span> Score de Compra</h3>
          <div className="buy-score-main">
            <div className="buy-score-value">
              <span className="buy-score-number">{buyScoreDisplay}</span>
              {buyScoreValue !== null ? (
                <span className="buy-score-scale">/100</span>
              ) : null}
            </div>
            <span className={`buy-score-label ${buyScoreTier}`}>
              {data.buyScoreLabel || 'Em calibração'}
            </span>
          </div>
          <div className="buy-score-bar">
            <div className={`buy-score-fill ${buyScoreTier}`} style={{ width: `${buyScoreFill}%` }}></div>
          </div>
          {buyScoreBreakdown.length > 0 ? (
            <div className="buy-score-breakdown">
              {buyScoreBreakdown.map((item) => (
                <div key={item.key || item.label} className="buy-score-item">
                  <span className="buy-score-item-label">{item.label}</span>
                  <span className="buy-score-item-score">{formatNumber(item.score, 0)}</span>
                  <span className="buy-score-item-weight">{item.weight}%</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="buy-score-empty">Detalhamento do score indisponível.</p>
          )}
        </section>

        {/* Análise Técnica */}
        <section className="technical-analysis">
          <h3><span className="section-icon">📊</span> Análise Técnica</h3>
          <p><strong>Tendência:</strong> <span className={`data-value ${getPolarityClass(data.technicalAnalysis?.trend.includes('alta') ? 1 : data.technicalAnalysis?.trend.includes('baixa') ? -1 : 0)}`}>{data.technicalAnalysis?.trend || 'N/A'}</span></p>
          <p><strong>RSI:</strong> <span className={`data-value ${data.technicalAnalysis?.rsi > 70 ? 'negative' : data.technicalAnalysis?.rsi < 30 ? 'positive' : 'neutral'}`}>{formatNumber(data.technicalAnalysis?.rsi, 1)}</span></p>
          <p><strong>MACD:</strong> <span className={`data-value ${getPolarityClass(data.technicalAnalysis?.macd)}`}>{formatNumber(data.technicalAnalysis?.macd, 3)}</span></p>
          <p><strong>Suporte:</strong> <span className="data-value">${formatNumber(data.technicalAnalysis?.supportLevel)}</span></p>
          <p><strong>Resistência:</strong> <span className="data-value">${formatNumber(data.technicalAnalysis?.resistanceLevel)}</span></p>
          <p><strong>Volume:</strong> <span className={`data-value ${data.technicalAnalysis?.volumeTrend === 'acumulando' ? 'positive' : data.technicalAnalysis?.volumeTrend === 'distribuindo' ? 'negative' : 'neutral'}`}>{data.technicalAnalysis?.volumeTrend || 'N/A'}</span></p>
        </section>

        {/* Análise Fundamentalista */}
        <section className="fundamental-analysis">
          <h3><span className="section-icon">📈</span> Análise Fundamentalista</h3>
          <div className="fundamental-grid-header">
             <span>Indicador</span>
             <span>Atual</span>
             <span className="media-label">Média (5a)</span>
          </div>
          <div className="fundamental-row">
            <span className="label">P/L:</span>
            <span className="data-value">{formatNumber(data.fundamentalAnalysis?.peRatio)}</span>
            <span className="media-value">{data.fundamentalAnalysis?.averages?.avgPe ? formatNumber(data.fundamentalAnalysis.averages.avgPe) : 'Não encontrado'}</span>
          </div>
          <div className="fundamental-row">
            <span className="label">P/VP:</span>
            <span className="data-value">{formatNumber(data.fundamentalAnalysis?.pbRatio)}</span>
            <span className="media-value">{data.fundamentalAnalysis?.averages?.avgPb ? formatNumber(data.fundamentalAnalysis.averages.avgPb) : 'Não encontrado'}</span>
          </div>
          <div className="fundamental-row">
            <span className="label">Div. Yield:</span>
            <span className="data-value">{data.fundamentalAnalysis?.dividendYield ? `${formatNumber(data.fundamentalAnalysis.dividendYield * 100, 2)}%` : 'Não encontrado'}</span>
            <span className="media-value">{data.fundamentalAnalysis?.averages?.avgDy ? `${formatNumber(data.fundamentalAnalysis.averages.avgDy * 100, 2)}%` : 'Não encontrado'}</span>
          </div>
          <div className="fundamental-row">
            <span className="label">ROE:</span>
            <span className="data-value">{data.fundamentalAnalysis?.roe ? `${formatNumber(data.fundamentalAnalysis.roe * 100, 2)}%` : 'Não encontrado'}</span>
            <span className="media-value">{data.fundamentalAnalysis?.averages?.avgRoe ? `${formatNumber(data.fundamentalAnalysis.averages.avgRoe * 100, 2)}%` : 'Não encontrado'}</span>
          </div>
          <div className="fundamental-row-simple">
            <span className="label">Margem Líquida:</span>
            <span className="data-value">{formatNumber(data.fundamentalAnalysis?.profitMargin)}%</span>
          </div>
          <div className="fundamental-row-simple">
            <span className="label">Cresc. Receita:</span>
            <span className="data-value">{formatNumber(data.fundamentalAnalysis?.revenueGrowth)}%</span>
          </div>
        </section>

        {/* Movimento de Insiders */}
        <section className="insider-activity">
          <h3><span className="section-icon">🧭</span> Movimentação de Insiders</h3>
          {insiderActivity.status !== 'ok' ? (
            <p className="insider-empty">{insiderActivity.message || 'Dados de insiders indisponíveis para este ativo.'}</p>
          ) : (
            <>
              <div className="insider-kpis">
                <div className="insider-kpi">
                  <span className="insider-kpi-label">Saldo líquido ({insiderActivity.windowMonths}m)</span>
                  <span className={`insider-kpi-value ${insiderPolarity}`}>
                    {formatSignedInteger(insiderActivity.netShares)} ações
                  </span>
                  <span className={`insider-kpi-subvalue ${insiderPolarity}`}>
                    {formatSignedCurrency(insiderActivity.netValue, 'BRL')}
                  </span>
                </div>
                <div className="insider-kpi">
                  <span className="insider-kpi-label">Compras vs. Vendas</span>
                  <span className="insider-kpi-value">
                    {formatInteger(insiderActivity.buyShares)} / {formatInteger(insiderActivity.sellShares)} ações
                  </span>
                  <span className="insider-kpi-subvalue">
                    {formatCurrency(insiderActivity.buyValue, 'BRL')} / {formatCurrency(insiderActivity.sellValue, 'BRL')}
                  </span>
                </div>
                <div className="insider-kpi">
                  <span className="insider-kpi-label">Sinal</span>
                  <span className={`insider-signal ${insiderActivity.signalKey || insiderPolarity}`}>
                    {insiderActivity.signal || 'neutro'}
                  </span>
                  <span className="insider-kpi-subvalue">
                    Score insiders: {formatNumber(insiderActivity.score || 0, 0)}/100
                  </span>
                </div>
              </div>
              <p className="insider-avg-price">
                Preço médio na janela: Compra {formatCurrency(insiderActivity.avgBuyPrice, 'BRL')} | Venda {formatCurrency(insiderActivity.avgSellPrice, 'BRL')}
              </p>
              <div className="insider-meta-row">
                <span>Última divulgação: {insiderActivity.lastReportedDate || 'N/A'}</span>
                {insiderActivity.sourceUrl ? (
                  <a
                    href={insiderActivity.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="insider-source-link"
                  >
                    Fonte CVM/Fundamentus
                  </a>
                ) : null}
              </div>
              <ul className="insider-rows">
                {insiderActivity.rows?.slice(0, 6).map((row, index) => (
                  <li key={index} className={`insider-row ${getPolarityClass(row.quantity)}`}>
                    <div className="insider-row-main">
                      <span className="insider-row-date">{row.date}</span>
                      <span className={`insider-row-qty ${getPolarityClass(row.quantity)}`}>
                        {formatSignedInteger(row.quantity)} ações
                      </span>
                    </div>
                    <div className="insider-row-meta">
                      <span className="insider-row-price">Preço médio: {formatCurrency(row.avgPrice, 'BRL')}</span>
                      {row.formUrl ? (
                        <a
                          href={row.formUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="insider-row-link"
                        >
                          Formulário CVM
                        </a>
                      ) : null}
                    </div>
                  </li>
                )) || []}
              </ul>
              <p className="insider-footnote">Divulgações podem ter atraso regulatório de 1-2 meses.</p>
            </>
          )}
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

        {/* Price Predictions */}

        {/* Previsões de Preço */}
        <section className="price-predictions">
          <h3><span className="section-icon">🔮</span> Previsões de Preço</h3>
          {!data.pricePredictions || data.pricePredictions.status !== 'ok' ? (
            <p className="section-empty">Projeções desativadas até haver dados reais suficientes.</p>
          ) : (
            <div className="prediction-content-box">
              <div className="prediction-main">
                <span className="prediction-label">Faixa Estimada (30 dias):</span>
                <span className="prediction-range-value highlighting">
                  {data.pricePredictions.rangeLabel}
                </span>
              </div>
              <div className="prediction-details-grid">
                <div className="prediction-detail">
                  <span className="detail-label">Confiança:</span>
                  <span className="detail-value">{data.pricePredictions.confidence}%</span>
                </div>
                <div className="prediction-detail">
                  <span className="detail-label">Viés de Tendência:</span>
                  <span className={`detail-value trend-${data.pricePredictions.trend.replace(' ', '-')}`}>
                    {data.pricePredictions.trend}
                  </span>
                </div>
              </div>
              <p className="prediction-disclaimer">
                * Estimativa baseada em volatilidade histórica (1 DP) e tendências técnicas atuais.
              </p>
            </div>
          )}
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

        {/* Relações Internacionais */}
        <section className="international-relations">
          <h3><span className="section-icon">🌎</span> Relações Internacionais</h3>
          {!data.internationalRelations || data.internationalRelations.status !== 'ok' ? (
            <p className="section-empty">Dados macro internacionais indisponíveis no momento.</p>
          ) : (
            <div className="macro-container">
              <div className="macro-grid">
                <div className="macro-card">
                  <div className="macro-header">
                    <span className="macro-icon">🇺🇸</span>
                    <span className="macro-label">S&P 500 (EUA)</span>
                  </div>
                  <div className="macro-content">
                    <span className={`macro-value ${data.internationalRelations.sp500?.changePercent >= 0 ? 'bullish' : 'bearish'}`}>
                      {data.internationalRelations.sp500?.price?.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                    </span>
                    <span className={`macro-badge ${data.internationalRelations.sp500?.changePercent >= 0 ? 'up' : 'down'}`}>
                      {data.internationalRelations.sp500?.changePercent >= 0 ? '▲' : '▼'} {Math.abs(data.internationalRelations.sp500?.changePercent || 0).toFixed(2)}%
                    </span>
                  </div>
                </div>
                <div className="macro-card">
                  <div className="macro-header">
                    <span className="macro-icon">💵</span>
                    <span className="macro-label">Dólar (USD/BRL)</span>
                  </div>
                  <div className="macro-content">
                    <span className={`macro-value ${data.internationalRelations.dollar?.changePercent > 0 ? 'bearish' : 'bullish'}`}>
                      R$ {data.internationalRelations.dollar?.price?.toFixed(2)}
                    </span>
                    <span className={`macro-badge ${data.internationalRelations.dollar?.changePercent > 0 ? 'up-danger' : 'down-success'}`}>
                      {data.internationalRelations.dollar?.changePercent > 0 ? '▲' : '▼'} {Math.abs(data.internationalRelations.dollar?.changePercent || 0).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
              <div className="macro-summary-box">
                <p>{data.internationalRelations.summary}</p>
              </div>
            </div>
          )}
        </section>

        {/* Notícias e Eventos */}
        <section className="news-events">
          <h3><span className="section-icon">📰</span> Notícias Recentes</h3>
          {data.recentNews && data.recentNews.length > 0 ? (
            <div className="news-list">
              {data.recentNews.map((news, index) => (
                <a
                  key={index}
                  href={news.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="news-card"
                >
                  <div className="news-content">
                    <h4 className="news-title">{news.title}</h4>
                    <div className="news-meta">
                      <span className="news-source-tag"><span className="dot"></span> {news.source}</span>
                      <span className="news-time">{news.date}</span>
                      <span className={`news-sentiment-pill ${news.sentiment}`}>
                        {news.sentiment === 'positivo' ? '↑ Positivo' : news.sentiment === 'negativo' ? '↓ Negativo' : '• Neutro'}
                      </span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <p className="section-empty">Sem notícias recentes encontradas para este ativo.</p>
          )}
          
        </section>

      </div>
    </div>
  );
};

export default StockAnalysis;
