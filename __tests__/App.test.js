import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../src/App';

// Mock dos componentes para isolar o teste do App
jest.mock('../src/components/StockTicker', () => {
  return function MockStockTicker(props) {
    return <div data-testid="stock-ticker" onClick={() => props.onStockClick('AAPL')}>Stock Ticker</div>;
  };
});

jest.mock('../src/components/SearchBar', () => {
  return function MockSearchBar(props) {
    return (
      <div data-testid="search-bar">
        <input 
          type="text" 
          onChange={(e) => props.onStockSelect(e.target.value)} 
          placeholder="Digite o código da ação"
        />
      </div>
    );
  };
});

jest.mock('../src/components/StockAnalysis', () => {
  return function MockStockAnalysis({ stockSymbol }) {
    return <div data-testid="stock-analysis">Análise para {stockSymbol}</div>;
  };
});

jest.mock('../src/components/MarketDashboard', () => {
  return function MockMarketDashboard(props) {
    return <div data-testid="market-dashboard" onClick={() => props.onStockClick('PETR4')}>Market Dashboard</div>;
  };
});

describe('App Component', () => {
  test('renders StockTicker and MarketDashboard by default', () => {
    render(<App />);
    
    expect(screen.getByTestId('stock-ticker')).toBeInTheDocument();
    expect(screen.getByTestId('market-dashboard')).toBeInTheDocument();
    expect(screen.getByText('Robô das Taxas')).toBeInTheDocument();
  });

  test('shows StockAnalysis when a stock is selected', () => {
    render(<App />);
    
    // Simula seleção de ação via StockTicker
    fireEvent.click(screen.getByTestId('stock-ticker'));
    
    expect(screen.getByTestId('stock-analysis')).toBeInTheDocument();
    expect(screen.queryByTestId('market-dashboard')).not.toBeInTheDocument();
  });

  test('returns to dashboard when header is clicked', () => {
    render(<App />);
    
    // Seleciona uma ação
    fireEvent.click(screen.getByTestId('stock-ticker'));
    expect(screen.getByTestId('stock-analysis')).toBeInTheDocument();
    
    // Volta para o dashboard clicando no título
    fireEvent.click(screen.getByText('Robô das Taxas'));
    expect(screen.getByTestId('market-dashboard')).toBeInTheDocument();
    expect(screen.queryByTestId('stock-analysis')).not.toBeInTheDocument();
  });

  test('handles search input correctly', () => {
    render(<App />);
    
    const searchInput = screen.getByPlaceholderText('Digite o código da ação');
    fireEvent.change(searchInput, { target: { value: 'VALE3' } });
    
    // Verifica se o estado foi atualizado (simulado)
    expect(searchInput.value).toBe('VALE3');
  });
});