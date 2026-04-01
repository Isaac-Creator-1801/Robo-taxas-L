import { supabase } from './supabaseClient';

/**
 * Registra a pesquisa de um ticker no banco de dados.
 */
export const logSearch = async (symbol) => {
  if (!supabase) return;
  if (!symbol || typeof symbol !== 'string') return;
  
  const cleanSymbol = symbol.toUpperCase().trim();
  if (!cleanSymbol) return;

  try {
    const { error } = await supabase
      .from('search_logs')
      .insert([{ symbol: cleanSymbol }]);
      
    if (error) {
      console.warn('Falha silenciosa ao registrar log:', error.message);
    }
  } catch (err) {
    // Falha silenciosa para não quebrar a experiência do usuário se o banco estiver fora
    console.debug('Erro de conexão Supabase:', err);
  }
};

/**
 * Busca os tickers mais pesquisados (Top 5).
 */
export const getTopSearches = async (limit = 5) => {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('search_logs')
      .select('symbol')
      .order('created_at', { ascending: false })
      .limit(100); // Amostragem dos últimos 100 registros
      
    if (error) throw error;
    
    if (!data || data.length === 0) return [];

    // Agrupar e contar frequências
    const counts = data.reduce((acc, curr) => {
      acc[curr.symbol] = (acc[curr.symbol] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(counts)
      .map(([symbol, count]) => ({ symbol, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  } catch (err) {
    console.error('Erro ao buscar estatísticas:', err);
    return [];
  }
};
