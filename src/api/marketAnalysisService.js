import { fetchStockData } from './stockService';

/**
 * Serviço de análise de mercado avançado
 * Simula a expertise de um analista com 50+ anos de experiência
 */
export const analyzeStock = async (symbol) => {
  try {
    // Busca dados básicos da ação
    const basicData = await fetchStockData(symbol);
    
    // Gera análise avançada usando o preço real retornado
    const currentPrice = basicData.currentPrice;
    
    const analysis = {
      ...basicData,
      technicalAnalysis: generateTechnicalAnalysis(symbol, currentPrice),
      fundamentalAnalysis: generateFundamentalAnalysis(symbol),
      internationalRelations: analyzeInternationalRelations(symbol),
      sectorAnalysis: analyzeSectorPerformance(symbol, basicData.sector),
      pricePredictions: generatePricePredictions(symbol, currentPrice),
      riskAssessment: assessInvestmentRisk(symbol),
      recentNews: fetchRecentNews(symbol),
      upcomingEvents: getUpcomingEvents(symbol),
      recommendation: generateRecommendation(symbol),
      confidenceScore: calculateConfidenceScore(symbol)
    };
    
    return analysis;
  } catch (error) {
    console.error('Erro na análise avançada:', error);
    throw error;
  }
};

/**
 * Gera análise técnica simulada
 */
const generateTechnicalAnalysis = (symbol, currentPrice) => {
  const trends = ['alta forte', 'alta moderada', 'lateralização', 'baixa moderada', 'baixa forte'];
  const trend = trends[Math.floor(Math.random() * trends.length)];
  
  const price = currentPrice || 100;
  
  return {
    trend: trend,
    supportLevel: price * 0.95,
    resistanceLevel: price * 1.08,
    rsi: 30 + Math.random() * 40,
    macd: (Math.random() - 0.5) * 2,
    movingAverages: {
      ma20: price * (0.97 + Math.random() * 0.06),
      ma50: price * (0.95 + Math.random() * 0.1),
      ma200: price * (0.9 + Math.random() * 0.2)
    },
    volumeTrend: ['acumulando', 'distribuindo', 'neutro'][Math.floor(Math.random() * 3)]
  };
};

/**
 * Gera análise fundamentalista simulada
 */
const generateFundamentalAnalysis = (symbol) => {
  return {
    peRatio: 10 + Math.random() * 20,
    pbRatio: 1 + Math.random() * 5,
    dividendYield: Math.random() * 5,
    debtToEquity: Math.random() * 2,
    roe: Math.random() * 30,
    profitMargin: Math.random() * 20,
    revenueGrowth: (Math.random() - 0.5) * 20,
    earningsQuality: ['excelente', 'bom', 'regular', 'ruim'][Math.floor(Math.random() * 4)]
  };
};

/**
 * Analisa relações internacionais que afetam a ação
 */
const analyzeInternationalRelations = (symbol) => {
  const internationalFactors = [
    'Taxas de juros nos EUA',
    'Câmbio dólar/real',
    'Preço das commodities',
    'Tensões geopolíticas',
    'Acordos comerciais',
    'Políticas monetárias globais'
  ];
  
  const selectedFactors = internationalFactors
    .sort(() => 0.5 - Math.random())
    .slice(0, 3);
    
  return {
    keyFactors: selectedFactors,
    impact: ['positivo', 'neutro', 'negativo'][Math.floor(Math.random() * 3)],
    severity: Math.random() * 10,
    summary: `As relações internacionais estão influenciando ${symbol} principalmente através de ${selectedFactors.join(', ')}.`
  };
};

/**
 * Analisa performance do setor
 */
const analyzeSectorPerformance = (symbol, sectorFromData) => {
  const sectors = {
    'AAPL': 'Tecnologia',
    'MSFT': 'Tecnologia',
    'GOOGL': 'Tecnologia',
    'META': 'Tecnologia',
    'NVDA': 'Tecnologia',
    'AMZN': 'Consumo Discretionário',
    'TSLA': 'Automotivo',
    'JPM': 'Financeiro',
    'JNJ': 'Saúde',
    'PG': 'Bens de Consumo',
    'PETR4': 'Energia',
    'VALE3': 'Mineração',
    'ITUB4': 'Financeiro',
    'BBDC4': 'Financeiro',
    'BBAS3': 'Financeiro',
    'ABEV3': 'Bebidas',
    'WEGE3': 'Industrial',
    'MGLU3': 'Varejo',
  };
  
  const sector = sectors[symbol] || sectorFromData || 'Diversificado';
  const perfValue = (Math.random() - 0.5) * 20;
  const trendOptions = ['expansão', 'contração', 'estável'];
  const sectorTrend = trendOptions[Math.floor(Math.random() * 3)];
  
  return {
    sector: sector,
    sectorPerformance: perfValue,
    sectorTrend: sectorTrend,
    peersComparison: {
      outperforming: Math.random() > 0.5,
      relativeStrength: Math.random() * 100
    },
    summary: `O setor ${sector} está mostrando tendência de ${sectorTrend} com performance relativa de ${perfValue.toFixed(1)}% este mês.`
  };
};

/**
 * Gera previsões de preço baseadas no preço atual real
 */
const generatePricePredictions = (symbol, currentPrice) => {
  const price = currentPrice || 100;
  
  return {
    shortTerm: {
      target: price * (1 + (Math.random() - 0.5) * 0.1),
      probability: 60 + Math.random() * 30
    },
    mediumTerm: {
      target: price * (1 + (Math.random() - 0.5) * 0.3),
      probability: 50 + Math.random() * 40
    },
    longTerm: {
      target: price * (1 + (Math.random() - 0.5) * 0.5),
      probability: 40 + Math.random() * 50
    },
    scenarios: {
      bullish: price * (1 + Math.random() * 0.5),
      base: price * (1 + (Math.random() - 0.5) * 0.2),
      bearish: price * (1 - Math.random() * 0.3)
    }
  };
};

/**
 * Avalia risco de investimento
 */
const assessInvestmentRisk = (symbol) => {
  const riskFactors = [
    'Volatilidade do mercado',
    'Risco setorial',
    'Risco company-specific',
    'Risco macroeconômico',
    'Risco de liquidez',
    'Risco regulatório'
  ];
  
  const risks = riskFactors.map(factor => ({
    factor: factor,
    level: ['baixo', 'médio', 'alto'][Math.floor(Math.random() * 3)],
    score: Math.random() * 10
  }));
  
  const overallRisk = risks.reduce((sum, r) => sum + r.score, 0) / risks.length;
  
  return {
    overallRisk: overallRisk,
    riskLevel: overallRisk > 6 ? 'alto' : overallRisk > 3 ? 'médio' : 'baixo',
    factors: risks,
    summary: `O risco geral de investimento em ${symbol} é considerado ${overallRisk > 6 ? 'alto' : overallRisk > 3 ? 'médio' : 'baixo'} baseado em análise de ${riskFactors.length} fatores de risco.`
  };
};

/**
 * Simula busca de notícias recentes
 */
const fetchRecentNews = (symbol) => {
  const newsTemplates = [
    {
      title: `${symbol} anuncia novos resultados trimestrais acima das expectativas`,
      source: 'InfoMoney',
      url: `https://www.google.com/search?q=${symbol}+resultados+trimestrais&tbm=nws`
    },
    {
      title: `Analistas revisam projeções para ${symbol} após recente desenvolvimento`,
      source: 'Valor Econômico',
      url: `https://www.google.com/search?q=${symbol}+projeções+analistas&tbm=nws`
    },
    {
      title: `${symbol} enfrenta desafios regulatórios em mercado-chave`,
      source: 'Reuters',
      url: `https://www.google.com/search?q=${symbol}+regulatorio&tbm=nws`
    },
    {
      title: `Nova parceria estratégica anunciada para ${symbol}`,
      source: 'Bloomberg',
      url: `https://www.google.com/search?q=${symbol}+parceria+estratégica&tbm=nws`
    },
    {
      title: `${symbol} investe pesado em P&D e inovação`,
      source: 'Exame',
      url: `https://www.google.com/search?q=${symbol}+investimento+inovação&tbm=nws`
    },
    {
      title: `Preocupações com cadeia de suprimentos afetam ${symbol}`,
      source: 'Financial Times',
      url: `https://www.google.com/search?q=${symbol}+cadeia+suprimentos&tbm=nws`
    },
    {
      title: `${symbol} anuncia programa de recompra de ações`,
      source: 'Investing.com',
      url: `https://www.google.com/search?q=${symbol}+recompra+ações&tbm=nws`
    },
    {
      title: `Liderança de ${symbol} passa por reestruturação`,
      source: 'CNBC',
      url: `https://www.google.com/search?q=${symbol}+reestruturação+liderança&tbm=nws`
    }
  ];
  
  return newsTemplates
    .sort(() => 0.5 - Math.random())
    .slice(0, 4)
    .map(news => ({
      ...news,
      date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
      sentiment: ['positivo', 'negativo', 'neutro'][Math.floor(Math.random() * 3)]
    }));
};

/**
 * Simula eventos futuros importantes
 */
const getUpcomingEvents = (symbol) => {
  const events = [
    { event: 'Divulgação de resultados trimestrais', days: 30 + Math.random() * 60 },
    { event: 'Reunião anual de acionistas', days: 60 + Math.random() * 90 },
    { event: 'Lançamento de novo produto/serviço', days: 15 + Math.random() * 45 },
    { event: 'Assembleia geral', days: 20 + Math.random() * 50 },
    { event: 'Data ex-dividendos', days: 10 + Math.random() * 30 }
  ];
  
  return events
    .sort(() => 0.5 - Math.random())
    .slice(0, 2)
    .map(event => ({
      ...event,
      date: new Date(Date.now() + event.days * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')
    }));
};

/**
 * Gera recomendação de investimento
 */
const generateRecommendation = (symbol) => {
  const recommendations = ['Compra Forte', 'Compra', 'Neutro', 'Venda', 'Venda Forte'];
  const index = Math.floor(Math.random() * recommendations.length);
  return recommendations[index];
};

/**
 * Calcula score de confiança na análise
 */
const calculateConfidenceScore = (symbol) => {
  return 60 + Math.random() * 35;
};