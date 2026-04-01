import { fetchSingleQuote } from './stockService';

/**
 * Serviço para buscar dados macroeconômicos globais que afetam o mercado brasileiro.
 */
export const fetchInternationalMarketData = async () => {
  try {
    // Buscamos o S&P 500 (Termômetro global) e o Dólar (Impacto em exportadoras/inflação)
    const [sp500, usdbrl] = await Promise.all([
      fetchSingleQuote('^GSPC').catch(() => null),
      fetchSingleQuote('USDBRL=X').catch(() => null)
    ]);

    const data = {
      sp500: sp500 ? {
        price: sp500.price,
        change: sp500.change,
        changePercent: sp500.changePercent,
        signal: sp500.changePercent > 0.5 ? 'positivo' : sp500.changePercent < -0.5 ? 'negativo' : 'neutro'
      } : null,
      dollar: usdbrl ? {
        price: usdbrl.price,
        change: usdbrl.change,
        changePercent: usdbrl.changePercent,
        signal: usdbrl.changePercent > 0.3 ? 'pressão altista' : usdbrl.changePercent < -0.3 ? 'alívio cambial' : 'estável'
      } : null,
      sentiment: 'neutro'
    };

    // Cálculo do sentimento global
    if (data.sp500 && data.dollar) {
      if (data.sp500.changePercent > 0 && data.dollar.changePercent < 0) {
        data.sentiment = 'Apetite ao Risco (Risk-On)';
      } else if (data.sp500.changePercent < 0 && data.dollar.changePercent > 0) {
        data.sentiment = 'Aversão ao Risco (Risk-Off)';
      } else {
        data.sentiment = 'Cenário Misto';
      }
    }

    return {
      status: 'ok',
      ...data,
      summary: data.sentiment !== 'neutro' 
        ? `Cenário global: ${data.sentiment}. S&P 500 em ${data.sp500?.changePercent > 0 ? 'alta' : 'baixa'} e Dólar ${data.dollar?.changePercent > 0 ? 'subindo' : 'caindo'}.`
        : 'Dados macroeconômicos internacionais indisponíveis.'
    };
  } catch (error) {
    console.error('Erro ao buscar dados internacionais:', error);
    return { status: 'error', message: 'Erro na conexão com dados globais.' };
  }
};
