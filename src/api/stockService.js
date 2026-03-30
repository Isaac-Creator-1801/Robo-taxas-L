import axios from 'axios';

/**
 * Serviço de dados de ações conectado em TEMPO REAL à API Gratuita (Yahoo Finance) via Proxy CORS.
 */

// Formata tickers brasileiros para o formato reconhecido pelo Yahoo Finance (.SA)
const formatSymbolForApi = (symbol) => {
  const upper = symbol.toUpperCase().trim();
  // Se for uma string de 4 letras seguida de 1 ou 2 números (ex: PETR4, ITUB4, TAEE11), adiciona .SA
  if (/^[A-Z]{4}\d{1,2}$/.test(upper)) {
    return `${upper}.SA`;
  }
  return upper;
};

// Formata o ticker de volta para exibição sem .SA
const formatSymbolForDisplay = (symbol) => {
  return symbol.replace('.SA', '');
};

// Alguns dados estáticos de setor/nome porque a API básica de cotação não retorna isso
const companyDatabase = {
  'AAPL': { name: 'Apple Inc.', sector: 'Tecnologia' },
  'GOOGL': { name: 'Alphabet Inc.', sector: 'Tecnologia' },
  'MSFT': { name: 'Microsoft Corp.', sector: 'Tecnologia' },
  'AMZN': { name: 'Amazon.com Inc.', sector: 'Consumo' },
  'TSLA': { name: 'Tesla Inc.', sector: 'Automotivo' },
  'META': { name: 'Meta Platforms Inc.', sector: 'Tecnologia' },
  'NVDA': { name: 'NVIDIA Corp.', sector: 'Tecnologia' },
  'JPM': { name: 'JPMorgan Chase', sector: 'Financeiro' },
  'PETR4.SA': { name: 'Petrobras', sector: 'Energia' },
  'VALE3.SA': { name: 'Vale', sector: 'Mineração' },
  'ITUB4.SA': { name: 'Itaú Unibanco', sector: 'Financeiro' },
  'BBDC4.SA': { name: 'Bradesco', sector: 'Financeiro' },
  'ABEV3.SA': { name: 'Ambev', sector: 'Bebidas' },
  'WEGE3.SA': { name: 'WEG', sector: 'Industrial' },
  'BBAS3.SA': { name: 'Banco do Brasil', sector: 'Financeiro' },
};

export const fetchStockData = async (symbol) => {
  const apiSymbol = formatSymbolForApi(symbol);
  
  // Usamos um Proxy CORS gratuito e universal para contornar bloqueios do Yahoo
  // A URL real do Yahoo é passada dentro dele.
  const targetUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${apiSymbol}`;
  const proxyUrl = `https://corsproxy.io/?url=${encodeURIComponent(targetUrl)}`;

  try {
    const response = await axios.get(proxyUrl);
    
    if (!response.data || !response.data.chart || !response.data.chart.result || response.data.chart.result.length === 0) {
      throw new Error(`Dados não encontrados para o ticker ${apiSymbol}. Verifique se a ação existe.`);
    }

    const result = response.data.chart.result[0];
    const meta = result.meta;
    
    const currentPrice = meta.regularMarketPrice;
    const prevClose = meta.previousClose;
    let changePercent = 0;
    
    if (prevClose && prevClose > 0) {
      changePercent = ((currentPrice - prevClose) / prevClose) * 100;
    }

    const knownInfo = companyDatabase[apiSymbol];

    // Cria o objeto com DADOS REAIS da bolsa
    const realTimeData = {
      symbol: formatSymbolForDisplay(meta.symbol),
      companyName: knownInfo ? knownInfo.name : formatSymbolForDisplay(meta.symbol),
      currentPrice: currentPrice,
      changePercent: changePercent,
      sector: knownInfo ? knownInfo.sector : 'Bolsa de Valores',
      currency: meta.currency || 'USD',
      realTime: true // FLAG indicando que agora é tempo real
    };

    return realTimeData;

  } catch (error) {
    console.error('Erro ao buscar dados na bolsa em tempo real:', error);
    // Erro comum de símbolo não encontrado.
    if (error.response && error.response.status === 404) {
      throw new Error(`Ação '${symbol}' não encontrada no mercado global.`);
    }
    throw new Error('Falha ao conectar na Bolsa em Tempo Real. Verifique sua conexão.');
  }
};

// Nova função para buscar múltiplos tickets de uma vez (ideal para o Dashboard)
export const fetchMarketOverview = async (symbolsArray) => {
  const apiSymbols = symbolsArray.map(s => formatSymbolForApi(s)).join(',');
  const targetUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${apiSymbols}`;
  const proxyUrl = `https://corsproxy.io/?url=${encodeURIComponent(targetUrl)}`;

  try {
    const response = await axios.get(proxyUrl);
    const results = response.data.quoteResponse.result;
    
    // Converte o array em um mapa (objeto) chaveado pelo símbolo original
    const overviewData = {};
    results.forEach(item => {
      // Revertendo .SA para achar a chave original
      let originalSymbol = item.symbol;
      if (originalSymbol.endsWith('.SA')) {
        originalSymbol = originalSymbol.replace('.SA', '');
      }
      
      overviewData[originalSymbol] = {
        price: item.regularMarketPrice,
        change: item.regularMarketChangePercent
      };
    });
    
    return overviewData;
  } catch (error) {
    console.error('Erro ao buscar Market Overview:', error);
    return null; // Falha silenciosa para o dashboard não quebrar
  }
};