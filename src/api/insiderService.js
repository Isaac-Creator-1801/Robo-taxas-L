import axios from 'axios';

const FUNDAMENTUS_HOST = 'https://www.fundamentus.com.br';
const FUNDAMENTUS_PROXY_HOST = 'https://r.jina.ai/http://www.fundamentus.com.br';
const DEFAULT_WINDOW_MONTHS = 6;

const normalizeSymbol = (symbol) => {
  if (!symbol) return '';
  return String(symbol).toUpperCase().trim().replace('.SA', '');
};

const parsePtNumber = (value) => {
  if (value === null || value === undefined) return 0;
  const cleaned = String(value).replace(/[^0-9,-]/g, '');
  if (!cleaned) return 0;
  const normalized = cleaned.replace(/\./g, '').replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const parseDate = (value) => {
  const [day, month, year] = String(value).split('/');
  return new Date(Number(year), Number(month) - 1, Number(day));
};

const parseInsiderRows = (text) => {
  if (!text) return [];
  const rows = [];
  const rowRegex = /^\|\s(\d{2}\/\d{2}\/\d{4})\s\|\s([-\d.,]+)\s\|\s([-\d.,]+)\s\|\s([-\d.,]+)\s\|\s\[Download\]\(([^)]+)\)\s\|/gm;
  let match;

  while ((match = rowRegex.exec(text)) !== null) {
    const date = match[1];
    const quantity = parsePtNumber(match[2]);
    const value = parsePtNumber(match[3]);
    const avgPrice = parsePtNumber(match[4]);
    const formUrl = match[5];

    rows.push({
      date,
      dateValue: parseDate(date),
      quantity,
      value,
      avgPrice,
      formUrl,
      direction: quantity > 0 ? 'compra' : quantity < 0 ? 'venda' : 'neutro'
    });
  }

  return rows.sort((a, b) => b.dateValue - a.dateValue);
};

const buildSummary = (rows, windowMonths) => {
  const windowRows = rows.slice(0, windowMonths);
  const buyRows = windowRows.filter((row) => row.quantity > 0);
  const sellRows = windowRows.filter((row) => row.quantity < 0);

  const buyShares = buyRows.reduce((sum, row) => sum + row.quantity, 0);
  const sellShares = sellRows.reduce((sum, row) => sum + Math.abs(row.quantity), 0);
  const buyValue = buyRows.reduce((sum, row) => sum + row.value, 0);
  const sellValue = sellRows.reduce((sum, row) => sum + Math.abs(row.value), 0);

  const netShares = buyShares - sellShares;
  const netValue = buyValue - sellValue;
  const avgBuyPrice = buyShares > 0 ? buyValue / buyShares : null;
  const avgSellPrice = sellShares > 0 ? sellValue / sellShares : null;

  const totalAbsValue = buyValue + sellValue;
  const imbalance = totalAbsValue > 0 ? (buyValue - sellValue) / totalAbsValue : 0;
  const score = Math.round((imbalance + 1) * 50);

  const signal = netValue > 0 ? 'acumulação' : netValue < 0 ? 'distribuição' : 'neutro';
  const signalKey = netValue > 0 ? 'positive' : netValue < 0 ? 'negative' : 'neutral';
  const lastReportedDate = windowRows[0]?.date || rows[0]?.date || null;

  return {
    windowMonths,
    rows: windowRows,
    buyShares,
    sellShares,
    buyValue,
    sellValue,
    netShares,
    netValue,
    avgBuyPrice,
    avgSellPrice,
    signal,
    signalKey,
    score,
    lastReportedDate
  };
};

export const fetchInsiderActivity = async (symbol, options = {}) => {
  const normalizedSymbol = normalizeSymbol(symbol);
  const windowMonths = Number.isFinite(options.windowMonths) && options.windowMonths > 0
    ? Math.floor(options.windowMonths)
    : DEFAULT_WINDOW_MONTHS;
  const sourceUrl = `${FUNDAMENTUS_HOST}/insiders.php?papel=${encodeURIComponent(normalizedSymbol)}&tipo=1`;
  const proxyUrl = `${FUNDAMENTUS_PROXY_HOST}/insiders.php?papel=${encodeURIComponent(normalizedSymbol)}&tipo=1`;

  if (!normalizedSymbol) {
    return {
      status: 'unavailable',
      symbol: '',
      source: 'CVM (via Fundamentus)',
      sourceUrl,
      windowMonths,
      rows: [],
      message: 'Símbolo inválido para consulta de insiders.'
    };
  }

  try {
    const response = await axios.get(proxyUrl, { timeout: 10000, responseType: 'text' });
    const rows = parseInsiderRows(response.data);

    if (rows.length === 0) {
      return {
        status: 'unavailable',
        symbol: normalizedSymbol,
        source: 'CVM (via Fundamentus)',
        sourceUrl,
        windowMonths,
        rows: [],
        message: 'Sem dados de insiders para este ativo.'
      };
    }

    return {
      status: 'ok',
      symbol: normalizedSymbol,
      source: 'CVM (via Fundamentus)',
      sourceUrl,
      ...buildSummary(rows, windowMonths)
    };
  } catch (error) {
    return {
      status: 'unavailable',
      symbol: normalizedSymbol,
      source: 'CVM (via Fundamentus)',
      sourceUrl,
      windowMonths,
      rows: [],
      message: 'Falha ao buscar dados de insiders no momento.'
    };
  }
};
