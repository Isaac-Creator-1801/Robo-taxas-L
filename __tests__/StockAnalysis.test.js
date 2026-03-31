import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import StockAnalysis from '../src/components/StockAnalysis';

// Mock do serviço de análise
jest.mock('../src/api/marketAnalysisService', () => ({
  analyzeStock: jest.fn()
}));

// Mock do componente ValuationCalculator
jest.mock('../src/components/ValuationCalculator', () => {
  return function MockValuationCalculator() {
    return <div data-testid="valuation-calculator">Calculadora de Valuation</div>;
  };
});

const mockAnalysisData = {
  symbol: 'AAPL',
  companyName: 'Apple Inc.',
  currentPrice: 178.50,
  changePercent: 1.25,
  sector: 'Tecnologia',
  recommendation: 'Compra Forte',
  confidenceScore: 85,
  buyScore: 78,
  buyScoreLabel: 'Boa oportunidade',
  buyScoreBreakdown: [
    { key: 'fundamentos', label: 'Fundamentos', score: 82, weight: 30 },
    { key: 'tecnico', label: 'Técnico', score: 74, weight: 20 },
    { key: 'risco', label: 'Risco', score: 65, weight: 20 },
    { key: 'insiders', label: 'Insiders', score: 70, weight: 15 },
    { key: 'sentimento', label: 'Sentimento', score: 60, weight: 10 },
    { key: 'setor', label: 'Setor', score: 68, weight: 5 }
  ],
  technicalAnalysis: {
    trend: 'alta forte',
    rsi: 65.3,
    macd: 0.75,
    supportLevel: 172.00,
    resistanceLevel: 185.00,
    volumeTrend: 'acumulando'
  },
  fundamentalAnalysis: {
    peRatio: 28.5,
    pbRatio: 35.2,
    dividendYield: 0.6,
    roe: 145.8,
    profitMargin: 25.3,
    revenueGrowth: 8.2
  },
  internationalRelations: {
    impact: 'positivo',
    severity: 7.2,
    keyFactors: ['Taxas de juros nos EUA', 'Câmbio dólar/real']
  },
  sectorAnalysis: {
    sector: 'Tecnologia',
    sectorPerformance: 5.8,
    sectorTrend: 'expansão',
    summary: 'Setor de Tecnologia em expansão.'
  },
  pricePredictions: {
    shortTerm: { target: 185.00, probability: 75 },
    mediumTerm: { target: 195.00, probability: 68 },
    longTerm: { target: 210.00, probability: 62 },
    scenarios: {
      bullish: 220.00,
      base: 195.00,
      bearish: 170.00
    }
  },
  riskAssessment: {
    overallRisk: 4.2,
    riskLevel: 'médio',
    factors: [
      { factor: 'Volatilidade do mercado', level: 'médio', score: 5.1 },
      { factor: 'Risco setorial', level: 'baixo', score: 3.2 }
    ]
  },
  insiderActivity: {
    status: 'ok',
    windowMonths: 6,
    netShares: 1200,
    netValue: 58000,
    buyShares: 1500,
    sellShares: 300,
    buyValue: 75000,
    sellValue: 17000,
    avgBuyPrice: 60.2,
    avgSellPrice: 56.8,
    signal: 'acumulação',
    signalKey: 'positive',
    score: 72,
    lastReportedDate: '01/02/2026',
    sourceUrl: 'https://www.fundamentus.com.br/insiders.php?papel=AAPL34&tipo=1',
    rows: []
  },
  recentNews: [
    {
      title: 'Apple anuncia novos resultados trimestrais',
      source: 'InfoMoney',
      date: '10/04/2023',
      sentiment: 'positivo',
      url: 'https://www.infomoney.com.br'
    }
  ],
  upcomingEvents: [
    { event: 'Divulgação de resultados', date: '15/04/2023' }
  ]
};

describe('StockAnalysis Component', () => {
  beforeEach(() => {
    // Limpa todos os mocks antes de cada teste
    jest.clearAllMocks();
  });

  test('displays loading state initially', () => {
    const analyzeStock = require('../src/api/marketAnalysisService').analyzeStock;
    analyzeStock.mockResolvedValue(mockAnalysisData);
    
    render(<StockAnalysis stockSymbol="AAPL" />);
    
    expect(screen.getByText(/Analisando AAPL... Aguarde a análise expert./)).toBeInTheDocument();
  });

  test('displays analysis data after loading', async () => {
    const analyzeStock = require('../src/api/marketAnalysisService').analyzeStock;
    analyzeStock.mockResolvedValue(mockAnalysisData);
    
    render(<StockAnalysis stockSymbol="AAPL" />);
    
    // Aguarda o carregamento dos dados
    await waitFor(() => {
      expect(screen.getByText('Apple Inc.')).toBeInTheDocument();
    });
    
    // Verifica exibição dos dados principais
    expect(screen.getByText('Compra Forte')).toBeInTheDocument();
    expect(screen.getByText('💰 Preço atual: $178.50')).toBeInTheDocument();
    expect(screen.getByText('▲ Variação: 1.25%')).toBeInTheDocument();
    
    // Verifica se a calculadora de valuation foi renderizada
    expect(screen.getByTestId('valuation-calculator')).toBeInTheDocument();
  });

  test('displays error message when API call fails', async () => {
    const analyzeStock = require('../src/api/marketAnalysisService').analyzeStock;
    analyzeStock.mockRejectedValue(new Error('API Error'));
    
    render(<StockAnalysis stockSymbol="INVALID" />);
    
    // Aguarda o carregamento e verificação de erro
    await waitFor(() => {
      expect(screen.getByText('Erro ao carregar análise da ação. Tente novamente.')).toBeInTheDocument();
    });
  });

  test('displays no data message when no data is returned', async () => {
    const analyzeStock = require('../src/api/marketAnalysisService').analyzeStock;
    analyzeStock.mockResolvedValue(null);
    
    render(<StockAnalysis stockSymbol="NONE" />);
    
    // Aguarda o carregamento e verificação de dados ausentes
    await waitFor(() => {
      expect(screen.getByText('Nenhum dado disponível para esta ação.')).toBeInTheDocument();
    });
  });

  test('formats numbers correctly', async () => {
    const analyzeStock = require('../src/api/marketAnalysisService').analyzeStock;
    analyzeStock.mockResolvedValue(mockAnalysisData);
    
    render(<StockAnalysis stockSymbol="AAPL" />);
    
    await waitFor(() => {
      expect(screen.getByText('🎯 Confiança: 85%')).toBeInTheDocument();
    });
    
    // Verifica valores formatados
    expect(screen.getByText('RSI: 65.3')).toBeInTheDocument();
    expect(screen.getByText('MACD: 0.750')).toBeInTheDocument();
    expect(screen.getByText('P/L: 28.50')).toBeInTheDocument();
    expect(screen.getByText('Dividend Yield: 0.60%')).toBeInTheDocument();
  });
});
