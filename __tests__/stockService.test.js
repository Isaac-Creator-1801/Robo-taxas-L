import { fetchStockData, fetchMarketOverview } from '../src/api/stockService';

// Mock do axios
jest.mock('axios', () => ({
  get: jest.fn()
}));

describe('stockService', () => {
  const axios = require('axios');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchStockData', () => {
    test('fetches stock data successfully', async () => {
      const mockResponse = {
        data: {
          results: [
            {
              symbol: 'AAPL',
              shortName: 'Apple Inc.',
              regularMarketPrice: 178.50,
              regularMarketChangePercent: 1.25,
              currency: 'USD'
            }
          ]
        }
      };
      
      axios.get.mockResolvedValue(mockResponse);
      
      const result = await fetchStockData('AAPL');
      
      expect(axios.get).toHaveBeenCalledWith(
        'https://brapi.dev/api/quote/AAPL34?token=hxjPRfTojZgRQhaWe32eDe',
        { timeout: 8000 }
      );
      
      expect(result).toEqual({
        symbol: 'AAPL',
        companyName: 'Apple Inc.',
        currentPrice: 178.50,
        changePercent: 1.25,
        sector: 'Tecnologia',
        currency: 'USD',
        realTime: true,
      });
    });

    test('throws when API call fails', async () => {
      axios.get.mockRejectedValue(new Error('Network Error'));

      await expect(fetchStockData('AAPL')).rejects.toThrow('Network Error');
    });

    test('throws for unknown stock symbol', async () => {
      axios.get.mockResolvedValue({ data: { results: [] } });

      await expect(fetchStockData('UNKNOWN')).rejects.toThrow('Sem resultados');
    });
  });

  describe('fetchMarketOverview', () => {
    test('fetches market overview for multiple symbols', async () => {
      const mockResponses = [
        { data: { results: [{ symbol: 'AAPL', regularMarketPrice: 178.50, regularMarketChangePercent: 1.25 }] } },
        { data: { results: [{ symbol: 'PETR4', regularMarketPrice: 38.50, regularMarketChangePercent: -0.45 }] } },
        { data: { results: [{ symbol: '^BVSP', regularMarketPrice: 182500, regularMarketChangePercent: 0.53 }] } }
      ];
      
      axios.get
        .mockResolvedValueOnce(mockResponses[0])
        .mockResolvedValueOnce(mockResponses[1])
        .mockResolvedValueOnce(mockResponses[2]);
      
      const symbols = ['AAPL', 'PETR4', '^BVSP'];
      const result = await fetchMarketOverview(symbols);
      
      expect(axios.get).toHaveBeenCalledTimes(3);
      expect(result).toHaveProperty('AAPL');
      expect(result).toHaveProperty('PETR4');
      expect(result).toHaveProperty('^BVSP');
      expect(result.AAPL.price).toBe(178.50);
      expect(result.PETR4.change).toBe(-0.45);
    });

    test('returns empty when individual API calls fail without cache', async () => {
      axios.get.mockRejectedValue(new Error('Network Error'));
      
      const symbols = ['AAPL', 'INVALID'];
      const result = await fetchMarketOverview(symbols);

      // Nenhum ativo deve aparecer sem cache disponível
      expect(result).not.toHaveProperty('AAPL');
      expect(result).not.toHaveProperty('INVALID');
    });

    test('uses cached data when available and API fails', async () => {
      // Simula dados em cache
      const localStorageMock = (() => {
        let store = {
          'brapi_cache_AAPL': JSON.stringify({ price: 175.00, change: 0.50, timestamp: Date.now() })
        };
        
        return {
          getItem(key) {
            return store[key] || null;
          },
          setItem(key, value) {
            store[key] = value.toString();
          },
          removeItem(key) {
            delete store[key];
          },
          clear() {
            store = {};
          }
        };
      })();
      
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
        writable: true
      });
      
      axios.get.mockRejectedValue(new Error('Network Error'));
      
      const symbols = ['AAPL'];
      const result = await fetchMarketOverview(symbols);
      
      expect(result.AAPL.price).toBe(175.00);
      expect(result.AAPL.change).toBe(0.50);
      expect(result.AAPL.isCached).toBe(true);
    });
  });
});
