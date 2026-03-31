import { analyzeStock } from '../src/api/marketAnalysisService';
import { fetchStockData, fetchQuoteDetails, fetchSingleQuote } from '../src/api/stockService';
import { fetchInsiderActivity } from '../src/api/insiderService';
import { fetchRecentNews } from '../src/api/newsService';

jest.mock('../src/api/stockService', () => ({
  fetchStockData: jest.fn(),
  fetchQuoteDetails: jest.fn(),
  fetchSingleQuote: jest.fn()
}));

jest.mock('../src/api/insiderService', () => ({
  fetchInsiderActivity: jest.fn()
}));

jest.mock('../src/api/newsService', () => ({
  fetchRecentNews: jest.fn()
}));

const buildHistoricalData = (days = 60) => {
  const start = Math.floor(Date.now() / 1000) - days * 24 * 60 * 60;
  return Array.from({ length: days }, (_, index) => ({
    date: start + index * 24 * 60 * 60,
    close: 100 + index,
    high: 101 + index,
    low: 99 + index,
    volume: 1000000 + index * 1000
  }));
};

describe('marketAnalysisService', () => {
  const mockBasicData = {
    symbol: 'AAPL',
    companyName: 'Apple Inc.',
    currentPrice: 178.50,
    changePercent: 1.25,
    sector: 'Tecnologia',
    currency: 'USD',
    realTime: true
  };

  const mockQuoteDetails = {
    trailingPE: 22.4,
    priceToBook: 7.8,
    dividendYield: 0.006,
    returnOnEquity: 0.21,
    profitMargins: 0.22,
    revenueGrowth: 0.08,
    debtToEquity: 0.65,
    historicalDataPrice: buildHistoricalData(80)
  };

  const mockNews = [
    {
      title: 'Apple supera expectativas e reforca guidance',
      source: 'InfoMoney',
      url: 'https://www.infomoney.com.br',
      date: '10/04/2023',
      sentiment: 'positivo',
      sentimentScore: 0.6
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('analyzes stock with real data inputs', async () => {
    fetchStockData.mockResolvedValue(mockBasicData);
    fetchQuoteDetails.mockResolvedValue(mockQuoteDetails);
    fetchSingleQuote.mockResolvedValue({ change: 1.4 });
    fetchInsiderActivity.mockResolvedValue({ status: 'ok', score: 70, netValue: 10000, rows: [] });
    fetchRecentNews.mockResolvedValue(mockNews);

    const result = await analyzeStock('AAPL');

    expect(fetchStockData).toHaveBeenCalledWith('AAPL');
    expect(fetchQuoteDetails).toHaveBeenCalledWith('AAPL', { range: '1y', interval: '1d', fundamental: true });
    expect(fetchInsiderActivity).toHaveBeenCalledWith('AAPL', { windowMonths: 6 });
    expect(fetchRecentNews).toHaveBeenCalledWith({ symbol: 'AAPL', companyName: 'Apple Inc.', limit: 4 });

    expect(result).toHaveProperty('technicalAnalysis');
    expect(result).toHaveProperty('fundamentalAnalysis');
    expect(result).toHaveProperty('riskAssessment');
    expect(result).toHaveProperty('sectorAnalysis');
    expect(result).toHaveProperty('insiderActivity');
    expect(result).toHaveProperty('recentNews');
    expect(result).toHaveProperty('buyScore');
    expect(result).toHaveProperty('buyScoreBreakdown');

    expect(result.buyScore).toBeGreaterThanOrEqual(0);
    expect(result.buyScore).toBeLessThanOrEqual(100);
    expect(result.pricePredictions).toBeNull();
    expect(result.internationalRelations).toBeNull();
    expect(Array.isArray(result.upcomingEvents)).toBe(true);
    expect(result.upcomingEvents.length).toBe(0);
  });

  test('computes technical analysis from historical data', async () => {
    fetchStockData.mockResolvedValue(mockBasicData);
    fetchQuoteDetails.mockResolvedValue(mockQuoteDetails);
    fetchSingleQuote.mockResolvedValue({ change: 0.8 });
    fetchInsiderActivity.mockResolvedValue({ status: 'ok', score: 65, netValue: 5000, rows: [] });
    fetchRecentNews.mockResolvedValue(mockNews);

    const result = await analyzeStock('AAPL');
    const tech = result.technicalAnalysis;

    expect(tech.dataPoints).toBeGreaterThanOrEqual(50);
    expect(tech.rsi).toBeGreaterThanOrEqual(0);
    expect(tech.rsi).toBeLessThanOrEqual(100);
    expect(typeof tech.macd).toBe('number');
    expect(tech.supportLevel).toBeLessThanOrEqual(tech.resistanceLevel);
  });

  test('handles API error gracefully', async () => {
    fetchStockData.mockRejectedValue(new Error('API Error'));

    await expect(analyzeStock('INVALID'))
      .rejects
      .toThrow('API Error');
  });
});
