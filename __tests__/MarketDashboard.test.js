import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import MarketDashboard from '../src/components/MarketDashboard';

// Mock do serviço de ações
jest.mock('../src/api/stockService', () => ({
  fetchMarketOverview: jest.fn()
}));

describe('MarketDashboard Component', () => {
  const mockOnStockClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders section titles correctly', () => {
    render(<MarketDashboard onStockClick={mockOnStockClick} />);
    
    expect(screen.getByText('Indicadores de Mercado')).toBeInTheDocument();
    expect(screen.getByText('Ativos em Tempo Real')).toBeInTheDocument();
    expect(screen.getByText('Maiores Altas (Hoje)')).toBeInTheDocument();
    expect(screen.getByText('Maiores Baixas (Hoje)')).toBeInTheDocument();
    expect(screen.getByText('O que nossa análise oferece')).toBeInTheDocument();
  });

  test('displays loading state initially', () => {
    render(<MarketDashboard onStockClick={mockOnStockClick} />);
    
    expect(screen.getByText('CARREGANDO...')).toBeInTheDocument();
  });

  test('displays market indices after loading', async () => {
    const fetchMarketOverview = require('../src/api/stockService').fetchMarketOverview;
    fetchMarketOverview.mockResolvedValue({
      '^BVSP': { price: 182500, change: 0.53 },
      '^GSPC': { price: 6343, change: -0.39 },
      '^IXIC': { price: 20794, change: -0.73 },
      '^DJI':  { price: 45216, change: 0.11 },
      '^FTSE': { price: 10127, change: 1.61 },
      'BRL=X': { price: 5.26, change: -0.30 },
      'AAPL': { price: 178.50, change: 0.85 },
      'PETR4': { price: 38.50, change: 1.20 },
      'VALE3': { price: 67.20, change: -0.45 },
      'NVDA': { price: 875.40, change: 4.30 },
      'ITUB4': { price: 34.10, change: 0.90 },
      'MSFT': { price: 415.20, change: 2.18 },
      'TSLA': { price: 245.30, change: -2.15 },
      'BBAS3': { price: 58.20, change: 1.50 },
    });
    
    render(<MarketDashboard onStockClick={mockOnStockClick} />);
    
    await waitFor(() => {
      expect(screen.getByText('IBOVESPA')).toBeInTheDocument();
      expect(screen.getByText('S&P 500')).toBeInTheDocument();
      expect(screen.getByText('NASDAQ')).toBeInTheDocument();
      expect(screen.getByText('DOW JONES')).toBeInTheDocument();
      expect(screen.getByText('FTSE 100')).toBeInTheDocument();
      expect(screen.getByText('Dólar/Real')).toBeInTheDocument();
      
      // Verifica valores e mudanças
      expect(screen.getByText('182500.00')).toBeInTheDocument();
      expect(screen.getByText('▲ 0.53%')).toBeInTheDocument(); // IBOV positive
      expect(screen.getByText('▼ 0.39%')).toBeInTheDocument();  // S&P negative
    });
  });

  test('displays popular stocks after loading', async () => {
    const fetchMarketOverview = require('../src/api/stockService').fetchMarketOverview;
    fetchMarketOverview.mockResolvedValue({
      'AAPL': { price: 178.50, change: 0.85 },
      'PETR4': { price: 38.50, change: 1.20 },
      'VALE3': { price: 67.20, change: -0.45 },
      'NVDA': { price: 875.40, change: 4.30 },
      'ITUB4': { price: 34.10, change: 0.90 },
      'MSFT': { price: 415.20, change: 2.18 },
      'TSLA': { price: 245.30, change: -2.15 },
      'BBAS3': { price: 58.20, change: 1.50 },
    });
    
    render(<MarketDashboard onStockClick={mockOnStockClick} />);
    
    await waitFor(() => {
      // Verifica se as ações populares estão sendo exibidas
      expect(screen.getByText('AAPL')).toBeInTheDocument();
      expect(screen.getByText('PETR4')).toBeInTheDocument();
      expect(screen.getByText('VALE3')).toBeInTheDocument();
      expect(screen.getByText('NVDA')).toBeInTheDocument();
      expect(screen.getByText('ITUB4')).toBeInTheDocument();
      expect(screen.getByText('MSFT')).toBeInTheDocument();
      expect(screen.getByText('TSLA')).toBeInTheDocument();
      expect(screen.getByText('BBAS3')).toBeInTheDocument();
      
      // Verifica preços
      expect(screen.getByText('$178.50')).toBeInTheDocument();
      expect(screen.getByText('$38.50')).toBeInTheDocument();
      
      // Verifica mudanças
      expect(screen.getByText('▲ 0.85%')).toBeInTheDocument(); // AAPL positive
      expect(screen.getByText('▼ 0.45%')).toBeInTheDocument(); // VALE3 negative
    });
  });

  test('displays gainers and losers after loading', async () => {
    const fetchMarketOverview = require('../src/api/stockService').fetchMarketOverview;
    fetchMarketOverview.mockResolvedValue({
      'AAPL': { price: 178.50, change: 0.85 },
      'PETR4': { price: 38.50, change: 1.20 },
      'VALE3': { price: 67.20, change: -0.45 },
      'NVDA': { price: 875.40, change: 4.30 },
      'ITUB4': { price: 34.10, change: 0.90 },
      'MSFT': { price: 415.20, change: 2.18 },
      'TSLA': { price: 245.30, change: -2.15 },
      'BBAS3': { price: 58.20, change: 1.50 },
    });
    
    render(<MarketDashboard onStockClick={mockOnStockClick} />);
    
    await waitFor(() => {
      // Verifica se os painéis de maiores altas/baixas estão presentes
      expect(screen.getByText('Maiores Altas (Hoje)')).toBeInTheDocument();
      expect(screen.getByText('Maiores Baixas (Hoje)')).toBeInTheDocument();
      
      // Verifica posições #1 nos rankings (com base nos dados mockados)
      expect(screen.getByText('#1')).toBeInTheDocument();
    });
  });

  test('calls onStockClick when stock card is clicked', async () => {
    const fetchMarketOverview = require('../src/api/stockService').fetchMarketOverview;
    fetchMarketOverview.mockResolvedValue({
      'AAPL': { price: 178.50, change: 0.85 },
    });
    
    render(<MarketDashboard onStockClick={mockOnStockClick} />);
    
    await waitFor(() => {
      const appleCard = screen.getByText('AAPL').closest('.popular-card');
      fireEvent.click(appleCard);
      
      expect(mockOnStockClick).toHaveBeenCalledWith('AAPL');
    });
  });

  test('calls onStockClick when mover item is clicked', async () => {
    const fetchMarketOverview = require('../src/api/stockService').fetchMarketOverview;
    fetchMarketOverview.mockResolvedValue({
      'NVDA': { price: 875.40, change: 4.30 },
    });
    
    render(<MarketDashboard onStockClick={mockOnStockClick} />);
    
    await waitFor(() => {
      const nvdaMover = screen.getByText('NVDA').closest('.mover-item');
      fireEvent.click(nvdaMover);
      
      expect(mockOnStockClick).toHaveBeenCalledWith('NVDA');
    });
  });

  test('displays features section correctly', () => {
    render(<MarketDashboard onStockClick={mockOnStockClick} />);
    
    expect(screen.getByText('Análise Técnica')).toBeInTheDocument();
    expect(screen.getByText('Análise Fundamentalista')).toBeInTheDocument();
    expect(screen.getByText('Score de Compra')).toBeInTheDocument();
    expect(screen.getByText('Movimentação de Insiders')).toBeInTheDocument();
    expect(screen.getByText('Avaliação de Risco')).toBeInTheDocument();
    expect(screen.getByText('Notícias em Tempo Real')).toBeInTheDocument();
  });

  test('displays disclaimer correctly', () => {
    render(<MarketDashboard onStockClick={mockOnStockClick} />);
    
    expect(screen.getByText(/Aviso Legal:/)).toBeInTheDocument();
    expect(screen.getByText(/cotações são baseadas em dados de mercado reais/)).toBeInTheDocument();
  });

  test('shows cache warning when using cached data', async () => {
    const fetchMarketOverview = require('../src/api/stockService').fetchMarketOverview;
    fetchMarketOverview.mockResolvedValue({
      '^BVSP': { price: 182500, change: 0.53, isCached: true, errorType: 'NETWORK_ERROR' },
    });
    
    render(<MarketDashboard onStockClick={mockOnStockClick} />);
    
    await waitFor(() => {
      expect(screen.getByText(/Diagnóstico de Conexão:/)).toBeInTheDocument();
      expect(screen.getByText(/Houve um erro de rede ou o servidor não respondeu./)).toBeInTheDocument();
    });
  });
});
