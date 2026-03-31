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
const FX_URL = 'https://economia.awesomeapi.com.br/json/last/USD-BRL';

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

const fetchBrapiQuote = async (apiSymbol, params = '') => {
  const url = params ? `${BASE_URL}${apiSymbol}?${params}` : `${BASE_URL}${apiSymbol}?token=${BRAPI_TOKEN}`;
  const response = await axios.get(url, { timeout: 8000 });
  if (response.data?.results?.length > 0) {
    return response.data.results[0];
  }
  throw new Error('Sem resultados');
};

const getCachedQuote = (displaySymbol, errorType) => {
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
  return null;
};

// Busca dados de UM único ativo usando a Brapi
export const fetchSingleQuote = async (displaySymbol) => {
  const apiSymbol = formatSymbolForApi(displaySymbol);

  try {
    if (displaySymbol === 'BRL=X') {
      const fxResponse = await axios.get(FX_URL, { timeout: 8000 });
      const fx = fxResponse.data?.USDBRL;
      const price = Number(fx?.bid);
      const change = Number(fx?.pctChange);
      if (Number.isFinite(price)) {
        const resultData = {
          price,
          change: Number.isFinite(change) ? change : 0,
          isCached: false,
          source: 'awesomeapi'
        };
        try {
          localStorage.setItem(`brapi_cache_${displaySymbol}`, JSON.stringify({
            ...resultData,
            timestamp: Date.now()
          }));
        } catch (e) {}
        return resultData;
      }
      throw new Error('Sem resultados');
    }

    const item = await fetchBrapiQuote(apiSymbol);
    const resultData = {
      price: item.regularMarketPrice,
      change: item.regularMarketChangePercent,
      isCached: false
    };

    if (Number.isFinite(resultData.price)) {
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
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      errorType = 'OFFLINE';
    } else if (err.response) {
      // O servidor respondeu com um erro (4xx, 5xx)
      errorType = err.response.status === 429 ? 'RATE_LIMIT' : 'API_ERROR';
    } else if (err.request) {
      // A requisição foi feita mas não houve resposta (timeout/conexão)
      errorType = 'NETWORK_ERROR';
    }

    console.warn(`[stockService] Falha ao buscar ${apiSymbol} (${errorType}):`, err.message);
    
    const cached = getCachedQuote(displaySymbol, errorType);
    if (cached) return cached;

    return null;
  }
};

export const fetchQuoteDetails = async (symbol, options = {}) => {
  const apiSymbol = formatSymbolForApi(symbol);
  const params = new URLSearchParams({ token: BRAPI_TOKEN });
  
  // Parâmetros básicos que funcionam no plano gratuito
  if (options.fundamental) params.append('fundamental', 'true');
  
  // Tentar com parâmetros primeiro
  try {
    return await fetchBrapiQuote(apiSymbol, params.toString());
  } catch (error) {
    // Se falhar, tentar sem parâmetros extras (plano gratuito básico)
    if (error.response?.status === 400) {
      console.warn(`[stockService] Parâmetros extras rejeitados para ${apiSymbol}, usando plano básico`);
      return await fetchBrapiQuote(apiSymbol);
    }
    throw error;
  }
};

// Busca dados completos de um ativo para a tela de análise
export const fetchStockData = async (symbol) => {
  const apiSymbol = formatSymbolForApi(symbol);
  const knownInfo = companyDatabase[apiSymbol] || {};

  // Tentar múltiplas abordagens para buscar dados
  const attempts = [
    () => fetchQuoteDetails(symbol, { fundamental: true }),
    () => fetchQuoteDetails(symbol),
    () => fetchBrapiQuote(apiSymbol)
  ];

  for (const attempt of attempts) {
    try {
      const item = await attempt();
      if (item && (item.regularMarketPrice || item.regularMarketPrice === 0)) {
        return {
          symbol: formatSymbolForDisplay(item.symbol || apiSymbol),
          companyName: item.shortName || knownInfo.name || `${formatSymbolForDisplay(apiSymbol)} Corp.`,
          currentPrice: item.regularMarketPrice,
          changePercent: item.regularMarketChangePercent || 0,
          sector: item.sector || knownInfo.sector || 'Diversos',
          currency: item.currency || 'BRL',
          realTime: true,
        };
      }
    } catch (error) {
      // Continuar para próxima tentativa
      continue;
    }
  }

  console.warn(`[stockService] fetchStockData erro para ${symbol}: todas as tentativas falharam`);
  throw new Error(`Não foi possível buscar dados para ${symbol}`);
};

// Busca dados do painel: um ativo de cada vez com delay de 300ms entre cada
// Isso respeita o limite público da Brapi (1 símbolo por request)
export const fetchMarketOverview = async (symbolsArray) => {
  const overviewData = {};

  for (const sym of symbolsArray) {
    const data = await fetchSingleQuote(sym);
    if (data && data.price > 0) {
      overviewData[sym] = data;
    }
    // 300ms de pausa entre cada request para não estourar o limite
    await delay(300);
  }

  return overviewData;
};
