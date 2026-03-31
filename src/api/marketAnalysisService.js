import { fetchStockData, fetchQuoteDetails, fetchSingleQuote } from './stockService';
import { fetchInsiderActivity } from './insiderService';
import { fetchRecentNews } from './newsService';

const FALLBACK_INSIDER = {
  status: 'unavailable',
  windowMonths: 6,
  netShares: 0,
  netValue: 0,
  buyShares: 0,
  sellShares: 0,
  buyValue: 0,
  sellValue: 0,
  avgBuyPrice: null,
  avgSellPrice: null,
  signal: 'neutro',
  signalKey: 'neutral',
  score: 50,
  lastReportedDate: null,
  sourceUrl: null,
  rows: [],
  message: 'Dados de insiders indisponíveis.'
};

/**
 * Serviço de análise de mercado avançado
 * Consolida dados reais de mercado, fundamentos e notícias
 */
export const analyzeStock = async (symbol) => {
  // Busca dados básicos da ação (obrigatório)
  const basicData = await fetchStockData(symbol);
  const resolvedSymbol = basicData.symbol || symbol;

  // Busca dados complementares em paralelo com fallbacks
  const [quoteDetails, insiderActivity, recentNews] = await Promise.all([
    fetchQuoteDetails(resolvedSymbol, { fundamental: true })
      .catch(() => fetchQuoteDetails(resolvedSymbol))
      .catch(() => ({})),
    fetchInsiderActivity(resolvedSymbol, { windowMonths: 6 })
      .catch(() => FALLBACK_INSIDER),
    fetchRecentNews({ symbol: resolvedSymbol, companyName: basicData.companyName, limit: 4 })
      .catch(() => [])
  ]);

  const historicalData = normalizeHistoricalData(quoteDetails);
  const technicalAnalysis = calculateTechnicalAnalysis(historicalData, basicData.currentPrice);
  const fundamentalAnalysis = calculateFundamentalAnalysis(quoteDetails);
  const riskAssessment = calculateRiskAssessment(historicalData, fundamentalAnalysis);

  const sectorAnalysis = await calculateSectorAnalysis({
    sectorName: basicData.sector,
    symbol: resolvedSymbol,
    currency: basicData.currency,
    quoteDetails
  }).catch(() => ({
    sector: basicData.sector || 'Diversos',
    sectorPerformance: null,
    sectorTrend: 'indefinido',
    summary: 'Dados setoriais indisponíveis.',
    sourceSymbol: null
  }));

  const buyScoreDetails = calculateBuyScore({
    technicalAnalysis,
    fundamentalAnalysis,
    riskAssessment,
    insiderActivity,
    recentNews,
    sectorAnalysis
  });

  return {
    ...basicData,
    technicalAnalysis,
    fundamentalAnalysis,
    internationalRelations: null,
    sectorAnalysis,
    pricePredictions: null,
    riskAssessment,
    insiderActivity,
    recentNews,
    upcomingEvents: [],
    recommendation: getRecommendationFromScore(buyScoreDetails.score),
    confidenceScore: calculateConfidenceScore({
      fundamentalAnalysis,
      technicalAnalysis,
      riskAssessment,
      insiderActivity,
      recentNews,
      sectorAnalysis
    }),
    buyScore: buyScoreDetails.score,
    buyScoreLabel: buyScoreDetails.label,
    buyScoreBreakdown: buyScoreDetails.breakdown
  };
};
const clampValue = (value, min, max) => Math.min(max, Math.max(min, value));

const parseDateValue = (value) => {
  if (value === null || value === undefined) return null;
  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    return new Date(numeric < 1e12 ? numeric * 1000 : numeric);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const normalizeHistoricalData = (quoteDetails) => {
  const raw = quoteDetails?.historicalDataPrice;
  if (!Array.isArray(raw) || raw.length === 0) return [];

  return raw
    .map((entry) => {
      const close = Number(entry.close ?? entry.adjClose ?? entry.adjclose ?? entry.price ?? entry.value);
      const high = Number(entry.high ?? entry.highPrice);
      const low = Number(entry.low ?? entry.lowPrice);
      const volume = Number(entry.volume ?? entry.volumeTraded);
      const date = parseDateValue(entry.date);

      if (!Number.isFinite(close) || !date) return null;
      return {
        date,
        close,
        high: Number.isFinite(high) ? high : null,
        low: Number.isFinite(low) ? low : null,
        volume: Number.isFinite(volume) ? volume : null
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.date - b.date);
};

const calculateEMA = (values, period) => {
  if (!Array.isArray(values) || values.length < period) return null;
  const k = 2 / (period + 1);
  let ema = values.slice(0, period).reduce((sum, value) => sum + value, 0) / period;
  for (let i = period; i < values.length; i += 1) {
    ema = values[i] * k + ema * (1 - k);
  }
  return ema;
};

const calculateRSI = (values, period = 14) => {
  if (!Array.isArray(values) || values.length <= period) return null;
  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i += 1) {
    const change = values[i] - values[i - 1];
    if (change >= 0) gains += change;
    else losses += Math.abs(change);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < values.length; i += 1) {
    const change = values[i] - values[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
};

const calculateMACD = (values) => {
  const ema12 = calculateEMA(values, 12);
  const ema26 = calculateEMA(values, 26);
  if (!Number.isFinite(ema12) || !Number.isFinite(ema26)) return null;
  return ema12 - ema26;
};

const calculateMovingAverage = (values, period) => {
  if (!Array.isArray(values) || values.length < period) return null;
  const slice = values.slice(-period);
  return slice.reduce((sum, value) => sum + value, 0) / period;
};

const calculateTrendLabel = (price, ma50, ma200) => {
  if (!Number.isFinite(price)) return 'N/A';
  if (Number.isFinite(ma50) && Number.isFinite(ma200)) {
    if (price > ma50 && ma50 > ma200) return 'alta forte';
    if (price > ma50) return 'alta moderada';
    if (price < ma50 && price > ma200) return 'lateralização';
    if (price < ma200 && ma50 < ma200) return 'baixa forte';
    return 'baixa moderada';
  }
  if (Number.isFinite(ma50)) return price > ma50 ? 'alta moderada' : 'baixa moderada';
  if (Number.isFinite(ma200)) return price > ma200 ? 'lateralização' : 'baixa forte';
  return 'N/A';
};

const calculateVolumeTrend = (historicalData) => {
  const volumes = historicalData.map((entry) => entry.volume).filter(Number.isFinite);
  if (volumes.length < 40) return 'neutro';

  const recent = volumes.slice(-20);
  const previous = volumes.slice(-40, -20);
  const avgRecent = recent.reduce((sum, value) => sum + value, 0) / recent.length;
  const avgPrevious = previous.reduce((sum, value) => sum + value, 0) / previous.length;

  if (!Number.isFinite(avgRecent) || !Number.isFinite(avgPrevious) || avgPrevious === 0) return 'neutro';
  const ratio = avgRecent / avgPrevious;

  if (ratio > 1.1) return 'acumulando';
  if (ratio < 0.9) return 'distribuindo';
  return 'neutro';
};

const calculateTechnicalAnalysis = (historicalData, currentPrice) => {
  if (!Array.isArray(historicalData) || historicalData.length === 0) {
    return {
      trend: 'N/A',
      supportLevel: null,
      resistanceLevel: null,
      rsi: null,
      macd: null,
      movingAverages: {
        ma20: null,
        ma50: null,
        ma200: null
      },
      volumeTrend: 'N/A',
      dataPoints: 0
    };
  }

  const closes = historicalData.map((entry) => entry.close).filter(Number.isFinite);
  const lastPrice = Number.isFinite(currentPrice) ? currentPrice : closes[closes.length - 1];
  const ma20 = calculateMovingAverage(closes, 20);
  const ma50 = calculateMovingAverage(closes, 50);
  const ma200 = calculateMovingAverage(closes, 200);
  const recentWindow = historicalData.slice(-20);
  const lows = recentWindow.map((entry) => entry.low).filter(Number.isFinite);
  const highs = recentWindow.map((entry) => entry.high).filter(Number.isFinite);
  const supportLevel = lows.length > 0 ? Math.min(...lows) : null;
  const resistanceLevel = highs.length > 0 ? Math.max(...highs) : null;

  return {
    trend: calculateTrendLabel(lastPrice, ma50, ma200),
    supportLevel,
    resistanceLevel,
    rsi: calculateRSI(closes, 14),
    macd: calculateMACD(closes),
    movingAverages: {
      ma20,
      ma50,
      ma200
    },
    volumeTrend: calculateVolumeTrend(historicalData),
    dataPoints: closes.length
  };
};

const toNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const toPercent = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return num <= 1 ? num * 100 : num;
};

const calculateFundamentalAnalysis = (quoteDetails) => {
  return {
    peRatio: toNumber(quoteDetails?.trailingPE ?? quoteDetails?.priceEarnings ?? quoteDetails?.peRatio),
    pbRatio: toNumber(quoteDetails?.priceToBook ?? quoteDetails?.pbRatio),
    dividendYield: toPercent(quoteDetails?.dividendYield ?? quoteDetails?.trailingAnnualDividendYield),
    debtToEquity: toNumber(quoteDetails?.debtToEquity),
    roe: toPercent(quoteDetails?.returnOnEquity ?? quoteDetails?.roe),
    profitMargin: toPercent(quoteDetails?.profitMargins ?? quoteDetails?.profitMargin),
    revenueGrowth: toPercent(quoteDetails?.revenueGrowth ?? quoteDetails?.revenueGrowthYearly)
  };
};

const calculateRiskAssessment = (historicalData, fundamentalAnalysis) => {
  const closes = historicalData.map((entry) => entry.close).filter(Number.isFinite);
  if (closes.length < 2) {
    return {
      overallRisk: null,
      riskLevel: null,
      factors: [],
      summary: 'Dados insuficientes para calcular risco.'
    };
  }

  const returns = closes.slice(1).map((value, index) => (value - closes[index]) / closes[index]);
  const avgReturn = returns.reduce((sum, value) => sum + value, 0) / returns.length;
  const variance = returns.reduce((sum, value) => sum + Math.pow(value - avgReturn, 2), 0) / returns.length;
  const volatility = Math.sqrt(variance) * Math.sqrt(252);

  let peak = closes[0];
  let maxDrawdown = 0;
  closes.forEach((value) => {
    if (value > peak) peak = value;
    const drawdown = (peak - value) / peak;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  });

  const factors = [];
  const volScore = clampValue((volatility * 100) / 4, 0, 10);
  factors.push({
    factor: `Volatilidade anualizada (${(volatility * 100).toFixed(1)}%)`,
    level: volScore >= 7 ? 'alto' : volScore >= 4 ? 'médio' : 'baixo',
    score: volScore
  });

  const ddScore = clampValue((maxDrawdown * 100) / 5, 0, 10);
  factors.push({
    factor: `Drawdown máximo (${(maxDrawdown * 100).toFixed(1)}%)`,
    level: ddScore >= 7 ? 'alto' : ddScore >= 4 ? 'médio' : 'baixo',
    score: ddScore
  });

  if (Number.isFinite(fundamentalAnalysis?.debtToEquity)) {
    const debtScore = clampValue((fundamentalAnalysis.debtToEquity / 2) * 10, 0, 10);
    factors.push({
      factor: `Endividamento (D/E ${fundamentalAnalysis.debtToEquity.toFixed(2)})`,
      level: debtScore >= 7 ? 'alto' : debtScore >= 4 ? 'médio' : 'baixo',
      score: debtScore
    });
  }

  const availableScores = factors.map((factor) => factor.score).filter(Number.isFinite);
  const overallRisk = availableScores.length > 0
    ? availableScores.reduce((sum, value) => sum + value, 0) / availableScores.length
    : null;
  const riskLevel = overallRisk === null
    ? null
    : overallRisk >= 7
      ? 'alto'
      : overallRisk >= 4
        ? 'médio'
        : 'baixo';

  return {
    overallRisk,
    riskLevel,
    factors,
    summary: overallRisk === null
      ? 'Dados insuficientes para calcular risco.'
      : `O risco geral é considerado ${riskLevel} com base em volatilidade, drawdown e endividamento.`
  };
};

const normalizeSectorName = (value) => {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

const SECTOR_INDEX_MAP = [
  { keywords: ['tecnologia', 'technology', 'tech'], symbol: 'XLK' },
  { keywords: ['financeiro', 'financial', 'banco', 'bank'], symbol: 'XLF' },
  { keywords: ['saude', 'health', 'healthcare'], symbol: 'XLV' },
  { keywords: ['energia', 'energy', 'oil', 'gas'], symbol: 'XLE' },
  { keywords: ['consumo', 'consumer', 'varejo', 'discretionary'], symbol: 'XLY' },
  { keywords: ['basico', 'staples', 'alimentos', 'bebidas'], symbol: 'XLP' },
  { keywords: ['industria', 'industrial'], symbol: 'XLI' },
  { keywords: ['materiais', 'materials', 'mineracao'], symbol: 'XLB' },
  { keywords: ['utilidades', 'utilities'], symbol: 'XLU' },
  { keywords: ['imobiliario', 'real estate'], symbol: 'XLRE' },
  { keywords: ['comunicacao', 'communication', 'media'], symbol: 'XLC' }
];

const getSectorIndexSymbol = (sectorName, currency, symbol) => {
  const normalized = normalizeSectorName(sectorName);
  const isBrazil = currency === 'BRL' || /\d$/.test(symbol || '');

  if (isBrazil) return '^BVSP';

  const match = SECTOR_INDEX_MAP.find((entry) => entry.keywords.some((word) => normalized.includes(word)));
  return match ? match.symbol : '^GSPC';
};

const calculateSectorAnalysis = async ({ sectorName, currency, symbol, quoteDetails }) => {
  const sector = sectorName || quoteDetails?.sector || quoteDetails?.industry || 'Diversos';
  const sourceSymbol = getSectorIndexSymbol(sector, currency, symbol);
  const sourceQuote = sourceSymbol ? await fetchSingleQuote(sourceSymbol) : null;
  const sectorPerformance = sourceQuote && Number.isFinite(sourceQuote.change) ? sourceQuote.change : null;
  const sectorTrend = sectorPerformance === null
    ? 'indefinido'
    : sectorPerformance > 1
      ? 'expansão'
      : sectorPerformance < -1
        ? 'contração'
        : 'estável';
  const summary = sectorPerformance === null
    ? 'Sem dados setoriais disponíveis no momento.'
    : `O setor ${sector} está em ${sectorTrend} (${sectorPerformance.toFixed(2)}% no índice ${sourceSymbol}).`;

  return {
    sector,
    sectorPerformance,
    sectorTrend,
    summary,
    sourceSymbol
  };
};

const getRecommendationFromScore = (score) => {
  if (score >= 80) return 'Compra Forte';
  if (score >= 65) return 'Compra';
  if (score >= 50) return 'Neutro';
  if (score >= 35) return 'Venda';
  return 'Venda Forte';
};

const calculateConfidenceScore = ({
  fundamentalAnalysis,
  technicalAnalysis,
  riskAssessment,
  insiderActivity,
  recentNews,
  sectorAnalysis
}) => {
  const fundamentalsKeys = [
    'peRatio',
    'pbRatio',
    'dividendYield',
    'roe',
    'profitMargin',
    'revenueGrowth',
    'debtToEquity'
  ];
  const fundamentalsCoverage = fundamentalsKeys.filter((key) => Number.isFinite(fundamentalAnalysis?.[key])).length / fundamentalsKeys.length;
  const technicalPoints = technicalAnalysis?.dataPoints || 0;
  const technicalCoverage = technicalPoints >= 200
    ? 1
    : technicalPoints >= 100
      ? 0.8
      : technicalPoints >= 50
        ? 0.6
        : technicalPoints >= 20
          ? 0.3
          : 0;
  const riskCoverage = Number.isFinite(riskAssessment?.overallRisk) ? 1 : 0;
  const insiderCoverage = insiderActivity?.status === 'ok' ? 1 : 0;
  const newsCoverage = Array.isArray(recentNews)
    ? recentNews.length >= 3
      ? 1
      : recentNews.length > 0
        ? 0.6
        : 0
    : 0;
  const sectorCoverage = Number.isFinite(sectorAnalysis?.sectorPerformance)
    ? 1
    : sectorAnalysis?.sector
      ? 0.4
      : 0;

  const weights = {
    fundamentals: 30,
    technical: 20,
    risk: 15,
    insiders: 15,
    news: 10,
    sector: 10
  };

  const total =
    fundamentalsCoverage * weights.fundamentals +
    technicalCoverage * weights.technical +
    riskCoverage * weights.risk +
    insiderCoverage * weights.insiders +
    newsCoverage * weights.news +
    sectorCoverage * weights.sector;

  return Math.round(total);
};

const clampScore = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value));

const scoreLinear = (value, min, max) => {
  if (!Number.isFinite(value) || max === min) return 50;
  return clampScore(((value - min) / (max - min)) * 100);
};

const scoreInverse = (value, min, max) => {
  if (!Number.isFinite(value) || max === min) return 50;
  return clampScore(100 - ((value - min) / (max - min)) * 100);
};

const scoreCentered = (value, center, range) => {
  if (!Number.isFinite(value) || range <= 0) return 50;
  return clampScore(100 - (Math.abs(value - center) / range) * 100);
};

const scoreFundamentals = (fundamentalAnalysis) => {
  if (!fundamentalAnalysis) return 50;

  const peScore = scoreInverse(fundamentalAnalysis.peRatio, 8, 28);
  const pbScore = scoreInverse(fundamentalAnalysis.pbRatio, 1, 4);
  const dividendScore = scoreLinear(fundamentalAnalysis.dividendYield, 0, 6);
  const roeScore = scoreLinear(fundamentalAnalysis.roe, 5, 25);
  const marginScore = scoreLinear(fundamentalAnalysis.profitMargin, 5, 20);
  const growthScore = scoreLinear(fundamentalAnalysis.revenueGrowth, -5, 15);
  const debtScore = scoreInverse(fundamentalAnalysis.debtToEquity, 0.3, 2);

  const weights = {
    pe: 18,
    pb: 12,
    dividend: 12,
    roe: 16,
    margin: 14,
    growth: 16,
    debt: 12
  };

  const total =
    peScore * weights.pe +
    pbScore * weights.pb +
    dividendScore * weights.dividend +
    roeScore * weights.roe +
    marginScore * weights.margin +
    growthScore * weights.growth +
    debtScore * weights.debt;

  return Math.round(total / 100);
};

const scoreTechnical = (technicalAnalysis) => {
  if (!technicalAnalysis) return 50;

  const trendScores = {
    'alta forte': 90,
    'alta moderada': 75,
    'lateralização': 55,
    'baixa moderada': 35,
    'baixa forte': 20
  };

  const volumeScores = {
    acumulando: 75,
    distribuindo: 35,
    neutro: 50
  };

  const trendScore = trendScores[technicalAnalysis.trend] ?? 50;
  const rsiScore = scoreCentered(technicalAnalysis.rsi, 50, 40);
  const macdScore = Number.isFinite(technicalAnalysis.macd)
    ? clampScore((technicalAnalysis.macd + 1) * 50)
    : 50;
  const volumeScore = volumeScores[technicalAnalysis.volumeTrend] ?? 50;

  const total = trendScore * 40 + rsiScore * 20 + macdScore * 25 + volumeScore * 15;
  return Math.round(total / 100);
};

const scoreRisk = (riskAssessment) => {
  if (!riskAssessment || !Number.isFinite(riskAssessment.overallRisk)) return 50;
  return clampScore(100 - riskAssessment.overallRisk * 10);
};

const scoreInsiders = (insiderActivity) => {
  if (!insiderActivity || insiderActivity.status !== 'ok') return 50;
  if (Number.isFinite(insiderActivity.score)) return clampScore(insiderActivity.score);
  if (Number.isFinite(insiderActivity.netValue)) {
    return insiderActivity.netValue > 0 ? 70 : insiderActivity.netValue < 0 ? 30 : 50;
  }
  return 50;
};

const scoreSentiment = (recentNews) => {
  if (!Array.isArray(recentNews) || recentNews.length === 0) return 50;
  const scores = recentNews.map((item) => {
    if (Number.isFinite(item.sentimentScore)) return item.sentimentScore;
    if (item.sentiment === 'positivo') return 1;
    if (item.sentiment === 'negativo') return -1;
    return 0;
  });
  const average = scores.reduce((sum, value) => sum + value, 0) / scores.length;
  return clampScore((average + 1) * 50);
};

const scoreSector = (sectorAnalysis) => {
  if (!sectorAnalysis || !Number.isFinite(sectorAnalysis.sectorPerformance)) return 50;
  return scoreLinear(sectorAnalysis.sectorPerformance, -10, 10);
};

const getBuyScoreLabel = (score) => {
  if (score >= 80) return 'Excelente para compra';
  if (score >= 65) return 'Boa oportunidade';
  if (score >= 50) return 'Neutro';
  if (score >= 35) return 'Cautela';
  return 'Fraco';
};

const calculateBuyScore = ({
  technicalAnalysis,
  fundamentalAnalysis,
  riskAssessment,
  insiderActivity,
  recentNews,
  sectorAnalysis
}) => {
  const fundamentals = scoreFundamentals(fundamentalAnalysis);
  const technical = scoreTechnical(technicalAnalysis);
  const risk = scoreRisk(riskAssessment);
  const insiders = scoreInsiders(insiderActivity);
  const sentiment = scoreSentiment(recentNews);
  const sector = scoreSector(sectorAnalysis);

  const breakdown = [
    { key: 'fundamentos', label: 'Fundamentos', score: fundamentals, weight: 30 },
    { key: 'tecnico', label: 'Técnico', score: technical, weight: 20 },
    { key: 'risco', label: 'Risco', score: risk, weight: 20 },
    { key: 'insiders', label: 'Insiders', score: insiders, weight: 15 },
    { key: 'sentimento', label: 'Sentimento', score: sentiment, weight: 10 },
    { key: 'setor', label: 'Setor', score: sector, weight: 5 }
  ];

  const totalWeight = breakdown.reduce((sum, item) => sum + item.weight, 0);
  const weightedScore = breakdown.reduce((sum, item) => sum + item.score * item.weight, 0) / totalWeight;
  const score = Math.round(clampScore(weightedScore));

  return {
    score,
    label: getBuyScoreLabel(score),
    breakdown
  };
};

