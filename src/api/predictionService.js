/**
 * Serviço de Previsão de Preços (Statistical Forecasting)
 * Calcula faixas de preço baseadas em volatilidade histórica e análise técnica.
 */

export const calculatePricePredictions = (historicalData, currentPrice, technicalAnalysis) => {
  if (!Array.isArray(historicalData) || historicalData.length < 20 || !currentPrice) {
    return {
      status: 'insufficient_data',
      range: null,
      confidence: 0,
      trend: 'indefinido'
    };
  }

  const closes = historicalData.map(d => d.close).filter(Number.isFinite);
  
  // 1. Cálculo de Volatilidade (Desvio Padrão dos retornos)
  const returns = closes.slice(1).map((val, i) => (val - closes[i]) / closes[i]);
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, b) => a + Math.pow(b - avgReturn, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance); // Volatilidade diária

  // 2. Projeção para 30 dias (Raiz do tempo)
  const vol30d = stdDev * Math.sqrt(21); // ~21 dias úteis em um mês

  // 3. Ajuste de Tendência baseado no Técnico (RSI e Médias)
  let trendBias = 0;
  if (technicalAnalysis?.trend?.includes('alta')) trendBias = 0.02; // +2% bias
  if (technicalAnalysis?.trend?.includes('baixa')) trendBias = -0.02; // -2% bias

  // 4. Definição da Faixa (1 Desvio Padrão = ~68% de probabilidade)
  const lowTarget = currentPrice * (1 + trendBias - vol30d);
  const highTarget = currentPrice * (1 + trendBias + vol30d);

  // 5. Nível de Confiança (Baseado no tempo de histórico disponível)
  const confidence = Math.min(95, Math.round((closes.length / 252) * 100));

  return {
    status: 'ok',
    low: lowTarget,
    high: highTarget,
    rangeLabel: `R$ ${lowTarget.toFixed(2)} - R$ ${highTarget.toFixed(2)}`,
    timeframe: 'Próximos 30 dias',
    confidence,
    trend: technicalAnalysis?.trend || 'neutro'
  };
};
