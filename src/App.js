import React, { useState } from 'react';
import StockTicker from './components/StockTicker';
import SearchBar from './components/SearchBar';
import StockAnalysis from './components/StockAnalysis';
import MarketDashboard from './components/MarketDashboard';
import { logSearch } from './api/searchHistoryService';


function App() {
  const [selectedStock, setSelectedStock] = useState('');

  const handleStockSelect = (symbol) => {
    setSelectedStock(symbol);
    // Registrar a pesquisa no Supabase
    logSearch(symbol);
    // Scroll suave para o topo da análise
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  return (
    <div className="App">
      <StockTicker onStockClick={handleStockSelect} />
      <header>
        <h1 
          onClick={() => setSelectedStock('')} 
          style={{ cursor: 'pointer', display: 'inline-block' }}
          title="Voltar para o Início"
        >
          Robô das Taxas
        </h1>
        <p className="subtitle">Sua plataforma expert de análise financeira com inteligência de mercado</p>
      </header>
      <main>
        <SearchBar onStockSelect={handleStockSelect} />
        {selectedStock ? (
          <StockAnalysis stockSymbol={selectedStock} />
        ) : (
          <MarketDashboard onStockClick={handleStockSelect} />
        )}
      </main>
    </div>
  );
}

export default App;