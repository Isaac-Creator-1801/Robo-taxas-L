import React, { useEffect, useState } from 'react';
import { fetchMarketOverview } from '../api/stockService';

const tickerStocks = [
  { symbol: 'AAPL', name: 'Apple' },
  { symbol: 'MSFT', name: 'Microsoft' },
  { symbol: 'GOOGL', name: 'Alphabet' },
  { symbol: 'AMZN', name: 'Amazon' },
  { symbol: 'NVDA', name: 'NVIDIA' },
  { symbol: 'TSLA', name: 'Tesla' },
  { symbol: 'META', name: 'Meta' },
  { symbol: 'JPM', name: 'JPMorgan' },
  { symbol: 'PETR4', name: 'Petrobras' },
  { symbol: 'VALE3', name: 'Vale' },
  { symbol: 'ITUB4', name: 'Itaú' },
  { symbol: 'BBAS3', name: 'Banco Brasil' },
  { symbol: 'WEGE3', name: 'WEG' },
  { symbol: 'ABEV3', name: 'Ambev' },
  { symbol: 'JNJ', name: 'J&J' },
  { symbol: 'PG', name: 'P&G' }
];

const StockTicker = ({ onStockClick }) => {
  const [stocks, setStocks] = useState(
    tickerStocks.map((stock) => ({ ...stock, price: null, change: null }))
  );

  useEffect(() => {
    let active = true;

    const loadTickerData = async () => {
      const symbols = tickerStocks.map((stock) => stock.symbol);
      const data = await fetchMarketOverview(symbols);

      if (!active) return;

      const updated = tickerStocks.map((stock) => {
        const live = data[stock.symbol];
        if (live) {
          return { ...stock, price: live.price, change: live.change };
        }
        return { ...stock, price: null, change: null };
      });

      setStocks(updated);
    };

    loadTickerData();
    const intervalId = setInterval(loadTickerData, 3 * 60 * 1000);

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, []);

  // Duplica a lista para o scroll infinito
  const doubledStocks = [...stocks, ...stocks];

  return (
    <div className="stock-ticker-wrapper">
      <div className="stock-ticker">
        {doubledStocks.map((stock, index) => (
          <div
            key={`${stock.symbol}-${index}`}
            className="ticker-item"
            onClick={() => onStockClick && onStockClick(stock.symbol)}
            title={`Clique para analisar ${stock.name} (${stock.symbol})`}
          >
            <span className="ticker-symbol">{stock.symbol}</span>
            <span className="ticker-price">
              {Number.isFinite(stock.price) ? `$${stock.price.toFixed(2)}` : '—'}
            </span>
            <span className={`ticker-change ${Number.isFinite(stock.change) ? (stock.change >= 0 ? 'positive' : 'negative') : 'neutral'}`}>
              {Number.isFinite(stock.change)
                ? `${stock.change >= 0 ? '▲' : '▼'} ${Math.abs(stock.change).toFixed(2)}%`
                : '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StockTicker;
