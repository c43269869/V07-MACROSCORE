import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  VIXData,
  MarketData,
  RatePolicyData,
  GrowthMomentumData,
  RealInterestEdgeData,
  PositioningData,
  MarketRegime,
  CurrencyScore,
  detectMarketRegime,
  calculateCurrencyScore,
  calculateTradingSignal,
  runModelTests,
  updateVIXHistory,
  updateGoldOutperformDays
} from '../lib/modelCalculations';

interface ForexDataContextType {
  // Market Data
  vixData: VIXData;
  marketData: MarketData;
  marketRegime: MarketRegime;
  isCentralBankWeek: boolean;
  
  // Currency Data
  currencyData: Record<string, {
    ratePolicy: RatePolicyData;
    growthMomentum: GrowthMomentumData;
    realInterestEdge: RealInterestEdgeData;
    positioning: PositioningData;
  }>;
  
  // Calculated Scores
  currencyScores: Record<string, CurrencyScore>;
  
  // Actions
  updateVixData: (data: Partial<VIXData>) => void;
  updateMarketData: (data: Partial<MarketData>) => void;
  updateCurrencyData: (currency: string, data: any) => void;
  setCentralBankWeek: (value: boolean) => void;
  refreshCalculations: () => void;
  runTests: () => void;
  
  // Trading Signals
  getTradingSignal: (currencyA: string, currencyB: string) => ReturnType<typeof calculateTradingSignal> | null;
}

const ForexDataContext = createContext<ForexDataContextType | undefined>(undefined);

// Default data based on the model specifications - FIXED: Added CHF
const defaultVixData: VIXData = {
  current: 35,
  last20Days: Array(20).fill(0).map((_, i) => 20 + i * 0.5)
};

const defaultMarketData: MarketData = {
  spyReturn: -2.5,
  gldReturn: 1.5,
  spyMA20: 450,
  spyPrice: 440,
  goldOutperformDays: 0
};

const defaultCurrencyData = {
  USD: {
    ratePolicy: {
      currentRate: 5.25,
      terminalRate: 5.50,
      currency: 'USD',
      hawkishWords: 3,
      dovishWords: 1
    } as RatePolicyData,
    growthMomentum: {
      employment: { currency: 'USD', value: 175 },
      pmi: 48.5,
      gdpQoQ: 1.5
    } as GrowthMomentumData,
    realInterestEdge: {
      currency: 'USD',
      twoYearYield: 4.7,
      breakeven5Y5Y: 2.3
    } as RealInterestEdgeData,
    positioning: {
      currency: 'USD',
      netPosition: 50000,
      percentile52Week: 75
    } as PositioningData
  },
  EUR: {
    ratePolicy: {
      currentRate: 4.00,
      terminalRate: 3.75,
      currency: 'EUR',
      hawkishWords: 1,
      dovishWords: 2
    } as RatePolicyData,
    growthMomentum: {
      employment: { currency: 'EUR', value: -0.2 },
      pmi: 47.2,
      gdpQoQ: 0.8
    } as GrowthMomentumData,
    realInterestEdge: {
      currency: 'EUR',
      twoYearYield: 3.2,
      breakeven5Y5Y: 2.0
    } as RealInterestEdgeData,
    positioning: {
      currency: 'EUR',
      netPosition: -30000,
      percentile52Week: 25
    } as PositioningData
  },
  GBP: {
    ratePolicy: {
      currentRate: 5.25,
      terminalRate: 5.00,
      currency: 'GBP',
      hawkishWords: 2,
      dovishWords: 1
    } as RatePolicyData,
    growthMomentum: {
      employment: { currency: 'GBP', value: 15 }, // Claimant count change
      pmi: 49.8,
      gdpQoQ: 1.2
    } as GrowthMomentumData,
    realInterestEdge: {
      currency: 'GBP',
      twoYearYield: 4.3,
      breakeven5Y5Y: 2.2
    } as RealInterestEdgeData,
    positioning: {
      currency: 'GBP',
      netPosition: 20000,
      percentile52Week: 60
    } as PositioningData
  },
  JPY: {
    ratePolicy: {
      currentRate: 0.10,
      terminalRate: 0.25,
      currency: 'JPY',
      hawkishWords: 1,
      dovishWords: 3
    } as RatePolicyData,
    growthMomentum: {
      employment: { currency: 'JPY', value: 1.28 }, // Job-to-applicant ratio
      pmi: 50.1,
      gdpQoQ: 0.3
    } as GrowthMomentumData,
    realInterestEdge: {
      currency: 'JPY',
      twoYearYield: 0.5,
      breakeven5Y5Y: 2.0 // BoJ target
    } as RealInterestEdgeData,
    positioning: {
      currency: 'JPY',
      netPosition: -80000,
      percentile52Week: 15
    } as PositioningData
  },
  AUD: {
    ratePolicy: {
      currentRate: 4.35,
      terminalRate: 4.50,
      currency: 'AUD',
      hawkishWords: 2,
      dovishWords: 1
    } as RatePolicyData,
    growthMomentum: {
      employment: { currency: 'AUD', value: 66.3 }, // Participation rate
      pmi: 51.2,
      gdpQoQ: 2.1
    } as GrowthMomentumData,
    realInterestEdge: {
      currency: 'AUD',
      twoYearYield: 4.1,
      breakeven5Y5Y: 2.1
    } as RealInterestEdgeData,
    positioning: {
      currency: 'AUD',
      netPosition: 35000,
      percentile52Week: 80
    } as PositioningData
  },
  CAD: {
    ratePolicy: {
      currentRate: 5.00,
      terminalRate: 4.75,
      currency: 'CAD',
      hawkishWords: 1,
      dovishWords: 2
    } as RatePolicyData,
    growthMomentum: {
      employment: { currency: 'CAD', value: 62.2 }, // Employment rate
      pmi: 50.8,
      gdpQoQ: 1.8
    } as GrowthMomentumData,
    realInterestEdge: {
      currency: 'CAD',
      twoYearYield: 4.0,
      breakeven5Y5Y: 2.0
    } as RealInterestEdgeData,
    positioning: {
      currency: 'CAD',
      netPosition: 15000,
      percentile52Week: 55
    } as PositioningData
  },
  // ADDED: CHF currency support
  CHF: {
    ratePolicy: {
      currentRate: 1.75,
      terminalRate: 2.00,
      currency: 'CHF',
      hawkishWords: 1,
      dovishWords: 1
    } as RatePolicyData,
    growthMomentum: {
      employment: { currency: 'CHF', value: 2.1 }, // Unemployment rate (Swiss style - lower is better)
      pmi: 49.5,
      gdpQoQ: 1.0
    } as GrowthMomentumData,
    realInterestEdge: {
      currency: 'CHF',
      twoYearYield: 1.8,
      breakeven5Y5Y: 1.5 // SNB target is 0-2%, using 1.5% as estimate
    } as RealInterestEdgeData,
    positioning: {
      currency: 'CHF',
      netPosition: -25000,
      percentile52Week: 20
    } as PositioningData
  }
};

export function ForexDataProvider({ children }: { children: ReactNode }) {
  const [vixData, setVixData] = useState<VIXData>(defaultVixData);
  const [marketData, setMarketData] = useState<MarketData>(defaultMarketData);
  const [currencyData, setCurrencyData] = useState(defaultCurrencyData);
  const [isCentralBankWeek, setIsCentralBankWeek] = useState(false);
  const [currencyScores, setCurrencyScores] = useState<Record<string, CurrencyScore>>({});
  const [marketRegime, setMarketRegime] = useState<MarketRegime>('NEUTRAL');

  const refreshCalculations = () => {
    // Detect market regime
    const regime = detectMarketRegime(vixData, marketData, isCentralBankWeek);
    setMarketRegime(regime);

    // Calculate scores for each currency
    const newScores: Record<string, CurrencyScore> = {};
    
    Object.keys(currencyData).forEach(currency => {
      const data = currencyData[currency];
      newScores[currency] = calculateCurrencyScore(
        currency,
        data.ratePolicy,
        data.growthMomentum,
        data.realInterestEdge,
        vixData,
        marketData,
        data.positioning,
        regime
      );
    });

    setCurrencyScores(newScores);
  };

  const updateVixData = (data: Partial<VIXData>) => {
    setVixData(prev => {
      // FIXED: Proper VIX history management
      if (data.current !== undefined && data.current !== prev.current) {
        const newHistory = updateVIXHistory(data.current, prev.last20Days);
        return { ...prev, ...data, last20Days: newHistory };
      }
      return { ...prev, ...data };
    });
  };

  const updateMarketData = (data: Partial<MarketData>) => {
    setMarketData(prev => {
      const newData = { ...prev, ...data };
      
      // FIXED: Update gold outperformance days tracking
      if (data.spyReturn !== undefined || data.gldReturn !== undefined) {
        const spyReturn = data.spyReturn ?? prev.spyReturn;
        const gldReturn = data.gldReturn ?? prev.gldReturn;
        const previousDays = prev.goldOutperformDays || 0;
        newData.goldOutperformDays = updateGoldOutperformDays(spyReturn, gldReturn, previousDays);
      }
      
      return newData;
    });
  };

  const updateCurrencyData = (currency: string, data: any) => {
    setCurrencyData(prev => ({
      ...prev,
      [currency]: { ...prev[currency], ...data }
    }));
  };

  const setCentralBankWeek = (value: boolean) => {
    setIsCentralBankWeek(value);
  };

  const getTradingSignal = (currencyA: string, currencyB: string) => {
    const scoreA = currencyScores[currencyA];
    const scoreB = currencyScores[currencyB];
    
    if (!scoreA || !scoreB) return null;
    
    return calculateTradingSignal(scoreA, scoreB);
  };

  const runTests = () => {
    runModelTests();
  };

  // Auto-refresh calculations when data changes
  useEffect(() => {
    refreshCalculations();
  }, [vixData, marketData, currencyData, isCentralBankWeek]);

  const value: ForexDataContextType = {
    vixData,
    marketData,
    marketRegime,
    isCentralBankWeek,
    currencyData,
    currencyScores,
    updateVixData,
    updateMarketData,
    updateCurrencyData,
    setCentralBankWeek,
    refreshCalculations,
    runTests,
    getTradingSignal
  };

  return (
    <ForexDataContext.Provider value={value}>
      {children}
    </ForexDataContext.Provider>
  );
}

export function useForexData() {
  const context = useContext(ForexDataContext);
  if (context === undefined) {
    throw new Error('useForexData must be used within a ForexDataProvider');
  }
  return context;
}