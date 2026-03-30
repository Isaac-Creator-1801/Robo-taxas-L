import React from 'react';

const tickerStocks = [
  { symbol: 'AAPL', name: 'Apple', price: 178.50, change: +1.25 },
  { symbol: 'MSFT', name: 'Microsoft', price: 415.20, change: +2.10 },
  { symbol: 'GOOGL', name: 'Alphabet', price: 141.80, change: -0.85 },
  { symbol: 'AMZN', name: 'Amazon', price: 185.60, change: +1.75 },
  { symbol: 'NVDA', name: 'NVIDIA', price: 875.40, change: +4.30 },
  { symbol: 'TSLA', name: 'Tesla', price: 245.30, change: -2.15 },
  { symbol: 'META', name: 'Meta', price: 505.75, change: +3.42 },
  { symbol: 'JPM', name: 'JPMorgan', price: 198.90, change: +0.68 },
  { symbol: 'PETR4', name: 'Petrobras', price: 38.50, change: +0.95 },
  { symbol: 'VALE3', name: 'Vale', price: 67.20, change: -1.30 },
  { symbol: 'ITUB4', name: 'Itaú', price: 32.80, change: +0.45 },
  { symbol: 'BBAS3', name: 'Banco Brasil', price: 56.70, change: +0.82 },
  { symbol: 'WEGE3', name: 'WEG', price: 35.40, change: +1.10 },
  { symbol: 'ABEV3', name: 'Ambev', price: 13.20, change: -0.22 },
  { symbol: 'JNJ', name: 'J&J', price: 156.20, change: +0.35 },
  { symbol: 'PG', name: 'P&G', price: 162.80, change: +0.55 },
];

const StockTicker = ({ onStockClick }) => {
  // Duplica a lista para o scroll infinito
  const doubledStocks = [...tickerStocks, ...tickerStocks];

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
            <span className="ticker-price">${stock.price.toFixed(2)}</span>
            <span className={`ticker-change ${stock.change >= 0 ? 'positive' : 'negative'}`}>
              {stock.change >= 0 ? '▲' : '▼'} {Math.abs(stock.change).toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StockTicker;
