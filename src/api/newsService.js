import axios from 'axios';

/**
 * Serviço de Notícias que utiliza o Jina AI Reader para buscar manchetes recentes
 * Isso evita bloqueios de CORS e problemas com APIs de notícias limitadas ou RSS instáveis.
 */

const JINA_PREFIX = 'https://r.jina.ai/';
const SEARCH_URL = 'https://www.google.com/search?q=noticias+hoje+mercado+financeiro+';

const POSITIVE_WORDS = ['alta', 'ganho', 'lucro', 'recorde', 'cresce', 'avanca', 'forte', 'otimo', 'positivo', 'recompra', 'upgrade', 'compra', 'supera'];
const NEGATIVE_WORDS = ['queda', 'perda', 'prejuizo', 'cai', 'rebaixa', 'downgrade', 'fraude', 'multa', 'risco', 'alerta', 'negativo', 'recua', 'despenca', 'crise'];

const normalizeText = (text) => String(text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const scoreSentiment = (text) => {
  const normalized = normalizeText(text);
  let pos = 0, neg = 0;
  POSITIVE_WORDS.forEach(w => { if (normalized.includes(w)) pos++; });
  NEGATIVE_WORDS.forEach(w => { if (normalized.includes(w)) neg++; });
  const total = pos + neg;
  const score = total > 0 ? (pos - neg) / total : 0;
  return score > 0.1 ? 'positivo' : score < -0.1 ? 'negativo' : 'neutro';
};

export const fetchRecentNews = async ({ symbol, companyName, limit = 5 }) => {
  const cleanSymbol = symbol.split('.')[0].toUpperCase();
  const cleanCompany = companyName ? companyName.split(' ')[0] : '';
  
  // Usamos uma busca no Google filtrada para pegar notícias reais de portais financeiros
  const query = encodeURIComponent(`${cleanSymbol} ${cleanCompany} notícias hoje infomoney moneytimes valor`);
  const url = `${JINA_PREFIX}https://www.google.com/search?q=${query}`;

  try {
    const response = await axios.get(url, { 
      timeout: 15000,
      headers: { 'Accept': 'text/event-stream' }
    });
    const markdown = response.data;

    const newsItems = [];
    const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g;

    // Palavras que indicam links inúteis/genéricos
    const blackList = ['calculadora', 'simulador', 'renda fixa', 'inflação', 'promoção', 'indique', 'login', 'assine'];

    let match;
    while ((match = linkRegex.exec(markdown)) !== null && newsItems.length < limit) {
      let title = match[1].trim();
      const newsUrl = match[2];

      const isIrrelevant = blackList.some(word => title.toLowerCase().includes(word));

      if (
        title.length > 20 && 
        !isIrrelevant &&
        (newsUrl.includes('infomoney.com.br') || newsUrl.includes('moneytimes.com.br') || newsUrl.includes('valor.globo.com') || newsUrl.includes('estadao.com.br')) &&
        !newsItems.some(item => item.title === title)
      ) {
        let cleanTitle = title.split(' - ')[0].split(' | ')[0];
        newsItems.push({
          title: cleanTitle,
          url: newsUrl,
          source: new URL(newsUrl).hostname.replace('www.', '').split('.')[0].toUpperCase(),
          date: 'Hoje',
          sentiment: scoreSentiment(cleanTitle)
        });
      }
    }

    return newsItems;
  } catch (error) {
    console.warn('[newsService] Erro ao buscar noticias filtradas:', error.message);
    return [];
  }
};
