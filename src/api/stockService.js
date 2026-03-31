import axios from 'axios';

const BRAPI_TOKEN = 'hxjPRfTojZgRQhaWe32eDe';
const BASE_URL = 'https://brapi.dev/api/quote/';

// Mapeamento de ações globais para BDRs na B3
const globalToBdrMap = {
  'AAPL': 'AAPL34',
  'MSFT': 'MSFT34',
  'GOOGL': 'GOGL34',
  'AMZN': 'AMZO34',
  'TSLA': 'TSLA34',
  'META': 'M1TA34',
  'NVDA': 'NVDC34',
  // Os índices abaixo são suportados diretamente com o prefixo '^'
  // Não mapeamos mais ^BVSP para IBOV pois IBOV retorna 404 na Brapi
};

const companyDatabase = {
  'AAPL34': { name: 'Apple Inc.', sector: 'Tecnologia' },
  'GOGL34': { name: 'Alphabet Inc.', sector: 'Tecnologia' },
  'MSFT34': { name: 'Microsoft Corp.', sector: 'Tecnologia' },
  'AMZO34': { name: 'Amazon.com Inc.', sector: 'Consumo' },
  'TSLA34': { name: 'Tesla Inc.', sector: 'Automotivo' },
  'M1TA34': { name: 'Meta Platforms Inc.', sector: 'Tecnologia' },
  'NVDC34': { name: 'NVIDIA Corp.', sector: 'Tecnologia' },
  'PETR4': { name: 'Petrobras', sector: 'Energia' },
  'VALE3': { name: 'Vale', sector: 'Mineração' },
  'ITUB4': { name: 'Itaú Unibanco', sector: 'Financeiro' },
  'BBDC4': { name: 'Bradesco', sector: 'Financeiro' },
  'ABEV3': { name: 'Ambev', sector: 'Bebidas' },
  'WEGE3': { name: 'WEG', sector: 'Industrial' },
  'BBAS3': { name: 'Banco do Brasil', sector: 'Financeiro' },
};

// Preços de referência estáticos (usados APENAS se a API falhar)
const staticFallbackPrices = {
  'AAPL': { price: 178.50, change: 0.85 },
  'MSFT': { price: 415.20, change: 2.18 },
  'GOOGL': { price: 141.80, change: -0.85 },
  'AMZN': { price: 185.68, change: 1.75 },
  'NVDA': { price: 875.40, change: 4.30 },
  'TSLA': { price: 245.30, change: -2.15 },
  'META': { price: 505.75, change: 3.42 },
  'PETR4': { price: 38.50, change: 1.20 },
  'VALE3': { price: 67.20, change: -0.45 },
  'ITUB4': { price: 34.10, change: 0.90 },
  'BBAS3': { price: 58.20, change: 1.50 },
  '^BVSP': { price: 182500, change: 0.53 },
  '^GSPC': { price: 6343, change: -0.39 },
  '^IXIC': { price: 20794, change: -0.73 },
  '^DJI':  { price: 45216, change: 0.11 },
  '^FTSE': { price: 10127, change: 1.61 },
  'BRL=X': { price: 5.26, change: -0.30 },
};

const formatSymbolForApi = (symbol) => {
  if (!symbol) return '';
  let upper = String(symbol).toUpperCase().trim().replace('.SA', '');
  return globalToBdrMap[upper] || upper;
};

const formatSymbolForDisplay = (apiSymbol) => {
  const upper = String(apiSymbol).replace('.SA', '');
  const originalGlobal = Object.keys(globalToBdrMap).find(k => globalToBdrMap[k] === upper);
  return originalGlobal || upper;
};

// Delay helper
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Busca dados de UM único ativo usando a Brapi
const fetchSingleQuote = async (displaySymbol) => {
  const apiSymbol = formatSymbolForApi(displaySymbol);
  
  // Câmbio e outros não suportados pela Brapi: usa fallback fixo
  // Exceção: ^BVSP é mapeado para IBOV e suportado. ^GSPC, ^IXIC, ^DJI e ^FTSE também são suportados.
  const unsupportedFallback = ['BRL=X'];
  if (unsupportedFallback.includes(displaySymbol)) {
    const fb = staticFallbackPrices[displaySymbol];
    return fb ? { price: fb.price, change: fb.change } : null;
  }

  try {
    const response = await axios.get(`${BASE_URL}${apiSymbol}?token=${BRAPI_TOKEN}`, {
      timeout: 8000,
    });

    if (response.data?.results?.length > 0) {
      const item = response.data.results[0];
      const resultData = {
        price: item.regularMarketPrice || 0,
        change: item.regularMarketChangePercent || 0,
        isCached: false
      };
      
      // Salva no localStorage a última atualização real
      try {
        localStorage.setItem(`brapi_cache_${displaySymbol}`, JSON.stringify({
          ...resultData,
          timestamp: Date.now()
        }));
      } catch (e) {}
      
      return resultData;
    }
    throw new Error('Sem resultados');
  } catch (err) {
    let errorType = 'UNKNOWN';
    if (!navigator.onLine) {
      errorType = 'OFFLINE';
    } else if (err.response) {
      // O servidor respondeu com um erro (4xx, 5xx)
      errorType = err.response.status === 429 ? 'RATE_LIMIT' : 'API_ERROR';
    } else if (err.request) {
      // A requisição foi feita mas não houve resposta (timeout/conexão)
      errorType = 'NETWORK_ERROR';
    }

    console.warn(`[stockService] Falha ao buscar ${apiSymbol} (${errorType}):`, err.message);
    
    // Tenta pegar último valor do cache
    try {
      const cached = localStorage.getItem(`brapi_cache_${displaySymbol}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        return { 
          price: parsed.price, 
          change: parsed.change, 
          isCached: true, 
          errorType,
          timestamp: parsed.timestamp 
        };
      }
    } catch (e) {}

    return { isCached: true, errorType, price: 0, change: 0 };
  }
};

// Busca dados completos de um ativo para a tela de análise
export const fetchStockData = async (symbol) => {
  const apiSymbol = formatSymbolForApi(symbol);
  const knownInfo = companyDatabase[apiSymbol] || {};

  try {
    const response = await axios.get(`${BASE_URL}${apiSymbol}?token=${BRAPI_TOKEN}`, {
      timeout: 8000,
    });

    if (response.data?.results?.length > 0) {
      const item = response.data.results[0];
      return {
        symbol: formatSymbolForDisplay(item.symbol || apiSymbol),
        companyName: item.shortName || knownInfo.name || `${formatSymbolForDisplay(apiSymbol)} Corp.`,
        currentPrice: item.regularMarketPrice || 0,
        changePercent: item.regularMarketChangePercent || 0,
        sector: knownInfo.sector || 'Diversos',
        currency: item.currency || 'BRL',
        realTime: true,
      };
    }
    throw new Error('Sem resultados');
  } catch (error) {
    console.warn(`[stockService] fetchStockData fallback para ${symbol}`);
    const fb = staticFallbackPrices[symbol] || { price: 50, change: 0 };
    return {
      symbol: formatSymbolForDisplay(apiSymbol),
      companyName: knownInfo.name || `${formatSymbolForDisplay(apiSymbol)} Corp.`,
      currentPrice: fb.price,
      changePercent: fb.change,
      sector: knownInfo.sector || 'Diversos',
      currency: 'BRL',
      realTime: false,
    };
  }
};

// Busca dados do painel: um ativo de cada vez com delay de 300ms entre cada
// Isso respeita o Rate Limit do plano gratuito da Brapi (1 símbolo por request)
export const fetchMarketOverview = async (symbolsArray) => {
  const overviewData = {};

  for (const sym of symbolsArray) {
    const data = await fetchSingleQuote(sym);
    if (data && data.price > 0) {
      overviewData[sym] = data;
    } else {
      // Usa fallback fixo APENAS se a API falhou e o usuário NUNCA acessou antes (sem cache)
      const fb = staticFallbackPrices[sym];
      if (fb) {
        overviewData[sym] = { price: fb.price, change: fb.change, isCached: true };
      }
    }
    // 300ms de pausa entre cada request para não estourar o limite
    await delay(300);
  }

  return overviewData;
};