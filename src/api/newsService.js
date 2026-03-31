import axios from 'axios';

const NEWS_PROXY_BASE = 'https://r.jina.ai/http://news.google.com/rss/search';

const POSITIVE_WORDS = [
  'alta',
  'ganho',
  'lucro',
  'recorde',
  'cresce',
  'crescimento',
  'avanca',
  'forte',
  'otimo',
  'positivo',
  'melhora',
  'expande',
  'acelera',
  'recompra',
  'upgrade',
  'compra',
  'supera',
  'solido',
  'robusto',
  'recupera',
  'aprovado',
  'aprovacao',
  'record',
  'beats',
  'surge'
];

const NEGATIVE_WORDS = [
  'queda',
  'perda',
  'prejuizo',
  'cai',
  'rebaixa',
  'downgrade',
  'fraude',
  'investigacao',
  'multa',
  'processo',
  'risco',
  'alerta',
  'negativo',
  'recua',
  'despenca',
  'incerteza',
  'volatilidade',
  'crise',
  'pressao',
  'baixa',
  'suspenso',
  'retira',
  'cortes',
  'misses',
  'slump'
];

const normalizeText = (value) => {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

const decodeHtmlEntities = (value) => {
  const text = String(value || '');
  if (typeof document !== 'undefined') {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  }
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
};

const extractTagValue = (item, tagName) => {
  const regex = new RegExp(`<${tagName}>([\s\S]*?)<\/${tagName}>`, 'i');
  const match = item.match(regex);
  return match ? decodeHtmlEntities(match[1].trim()) : '';
};

const parseRssItems = (xml) => {
  if (!xml) return [];
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = extractTagValue(block, 'title');
    const link = extractTagValue(block, 'link');
    const pubDate = extractTagValue(block, 'pubDate');
    const source = extractTagValue(block, 'source') || '';

    items.push({
      title,
      link,
      pubDate,
      source
    });
  }

  return items;
};

const scoreSentiment = (text) => {
  const normalized = normalizeText(text);
  let positiveHits = 0;
  let negativeHits = 0;

  POSITIVE_WORDS.forEach((word) => {
    const regex = new RegExp(`\\b${word}\\b`, 'g');
    const matches = normalized.match(regex);
    if (matches) positiveHits += matches.length;
  });

  NEGATIVE_WORDS.forEach((word) => {
    const regex = new RegExp(`\\b${word}\\b`, 'g');
    const matches = normalized.match(regex);
    if (matches) negativeHits += matches.length;
  });

  const total = positiveHits + negativeHits;
  const score = total > 0 ? (positiveHits - negativeHits) / total : 0;

  if (score > 0.2) return { label: 'positivo', score };
  if (score < -0.2) return { label: 'negativo', score };
  return { label: 'neutro', score };
};

const formatNewsDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('pt-BR');
};

const buildQuery = (symbol, companyName) => {
  const pieces = [symbol, companyName].filter(Boolean);
  return pieces.join(' ');
};

export const fetchRecentNews = async ({ symbol, companyName, limit = 4 }) => {
  const query = buildQuery(symbol, companyName);
  const url = `${NEWS_PROXY_BASE}?q=${encodeURIComponent(query)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;

  try {
    const response = await axios.get(url, { timeout: 10000, responseType: 'text' });
    const items = parseRssItems(response.data)
      .filter((item) => item.title && item.link)
      .slice(0, limit);

    return items.map((item) => {
      const sentiment = scoreSentiment(item.title);
      const source = item.source || (item.title.includes(' - ') ? item.title.split(' - ').pop() : 'Google News');

      return {
        title: item.title,
        source,
        url: item.link,
        date: formatNewsDate(item.pubDate),
        sentiment: sentiment.label,
        sentimentScore: sentiment.score
      };
    });
  } catch (error) {
    console.warn('[newsService] Falha ao buscar noticias:', error.message);
    return [];
  }
};
