import React, { useState } from 'react';
import { useForexData } from '../contexts/ForexDataContext';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Save, RefreshCw, ToggleLeft, ToggleRight, Info } from 'lucide-react';

// ADDED: Employment metric guidance by currency
const EMPLOYMENT_METRICS: Record<string, { label: string; description: string; goodThreshold: string; badThreshold: string }> = {
  USD: { 
    label: "Non-Farm Payrolls (000s)", 
    description: "Monthly job additions", 
    goodThreshold: ">180K", 
    badThreshold: "<100K" 
  },
  EUR: { 
    label: "Employment Rate YoY (%)", 
    description: "Year-over-year change", 
    goodThreshold: ">+0.3%", 
    badThreshold: "<-0.1%" 
  },
  GBP: { 
    label: "Claimant Count Change (000s)", 
    description: "Monthly change (negative = good)", 
    goodThreshold: "<-20K", 
    badThreshold: ">+40K" 
  },
  JPY: { 
    label: "Job-to-Applicant Ratio", 
    description: "Labor market tightness", 
    goodThreshold: ">1.30", 
    badThreshold: "<1.25" 
  },
  AUD: { 
    label: "Participation Rate (%)", 
    description: "Labor force participation", 
    goodThreshold: ">66.5%", 
    badThreshold: "<66.0%" 
  },
  CAD: { 
    label: "Employment Rate (%)", 
    description: "Employment-to-population ratio", 
    goodThreshold: ">62.5%", 
    badThreshold: "<61.5%" 
  },
  CHF: { 
    label: "Unemployment Rate (%)", 
    description: "Standardized unemployment (lower = better)", 
    goodThreshold: "<2.0%", 
    badThreshold: ">3.0%" 
  }
};

export default function DataInput() {
  const { 
    vixData, 
    marketData, 
    currencyData, 
    isCentralBankWeek,
    updateVixData, 
    updateMarketData, 
    updateCurrencyData,
    setCentralBankWeek,
    refreshCalculations 
  } = useForexData();

  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const currencies = Object.keys(currencyData);

  const handleVixUpdate = (field: string, value: string) => {
    if (field === 'current') {
      updateVixData({ current: parseFloat(value) || 0 });
    }
  };

  const handleMarketUpdate = (field: string, value: string) => {
    updateMarketData({ [field]: parseFloat(value) || 0 });
  };

  const handleCurrencyUpdate = (field: string, subField: string, value: string) => {
    const currentData = currencyData[selectedCurrency];
    const numValue = parseFloat(value) || 0;
    
    updateCurrencyData(selectedCurrency, {
      [field]: {
        ...currentData[field as keyof typeof currentData],
        [subField]: subField === 'employment' ? 
          { currency: selectedCurrency, value: numValue } : 
          numValue
      }
    });
  };

  // Get current employment metric info
  const currentEmploymentMetric = EMPLOYMENT_METRICS[selectedCurrency];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Data Input</h1>
          <p className="text-muted-foreground mt-1">
            Update model inputs and parameters for V07 calculations
          </p>
        </div>
        <Button onClick={refreshCalculations} className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4" />
          <span>Refresh Calculations</span>
        </Button>
      </div>

      {/* Market Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* VIX & Market Data */}
        <Card>
          <CardHeader>
            <CardTitle>Market Data</CardTitle>
            <CardDescription>
              VIX volatility and market performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Current VIX</label>
              <Input 
                type="number" 
                value={vixData.current}
                onChange={(e) => handleVixUpdate('current', e.target.value)}
                placeholder="35.0"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">SPY Weekly Return (%)</label>
              <Input 
                type="number" 
                value={marketData.spyReturn}
                onChange={(e) => handleMarketUpdate('spyReturn', e.target.value)}
                placeholder="-2.5"
                step="0.1"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">GLD Weekly Return (%)</label>
              <Input 
                type="number" 
                value={marketData.gldReturn}
                onChange={(e) => handleMarketUpdate('gldReturn', e.target.value)}
                placeholder="1.5"
                step="0.1"
              />
            </div>
            
            {/* ADDED: Gold outperformance tracking */}
            <div>
              <label className="text-sm font-medium">
                Gold Outperform Days 
                <span className="text-xs text-muted-foreground ml-1">(auto-calculated)</span>
              </label>
              <Input 
                type="number" 
                value={marketData.goldOutperformDays || 0}
                readOnly
                className="bg-muted"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">SPY 20-Day MA</label>
              <Input 
                type="number" 
                value={marketData.spyMA20}
                onChange={(e) => handleMarketUpdate('spyMA20', e.target.value)}
                placeholder="450"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">SPY Current Price</label>
              <Input 
                type="number" 
                value={marketData.spyPrice}
                onChange={(e) => handleMarketUpdate('spyPrice', e.target.value)}
                placeholder="440"
              />
            </div>
          </CardContent>
        </Card>

        {/* Central Bank Week Toggle */}
        <Card>
          <CardHeader>
            <CardTitle>Market Regime Settings</CardTitle>
            <CardDescription>
              Special market conditions and regime overrides
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <div className="font-medium">Central Bank Week</div>
                <div className="text-sm text-muted-foreground">
                  48 hours before/after major CB decisions
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCentralBankWeek(!isCentralBankWeek)}
                className="flex items-center space-x-2"
              >
                {isCentralBankWeek ? (
                  <ToggleRight className="h-5 w-5 text-green-600" />
                ) : (
                  <ToggleLeft className="h-5 w-5" />
                )}
                <span>{isCentralBankWeek ? 'ON' : 'OFF'}</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Currency Data Input */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Currency-Specific Data</CardTitle>
              <CardDescription>
                Update individual currency factors and metrics
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              {currencies.map((currency) => (
                <Button
                  key={currency}
                  variant={selectedCurrency === currency ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCurrency(currency)}
                >
                  {currency}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Rate Policy */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                <h4 className="font-semibold">Rate Policy</h4>
              </div>
              
              <div>
                <label className="text-sm font-medium">Current Policy Rate (%)</label>
                <Input 
                  type="number" 
                  value={currencyData[selectedCurrency].ratePolicy.currentRate}
                  onChange={(e) => handleCurrencyUpdate('ratePolicy', 'currentRate', e.target.value)}
                  step="0.01"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Market Terminal Rate (%)</label>
                <Input 
                  type="number" 
                  value={currencyData[selectedCurrency].ratePolicy.terminalRate}
                  onChange={(e) => handleCurrencyUpdate('ratePolicy', 'terminalRate', e.target.value)}
                  step="0.01"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Hawkish Words</label>
                  <Input 
                    type="number" 
                    value={currencyData[selectedCurrency].ratePolicy.hawkishWords}
                    onChange={(e) => handleCurrencyUpdate('ratePolicy', 'hawkishWords', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Dovish Words</label>
                  <Input 
                    type="number" 
                    value={currencyData[selectedCurrency].ratePolicy.dovishWords}
                    onChange={(e) => handleCurrencyUpdate('ratePolicy', 'dovishWords', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Growth Momentum - IMPROVED with currency-specific guidance */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                <h4 className="font-semibold">Growth Momentum</h4>
              </div>
              
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <label className="text-sm font-medium">
                    {currentEmploymentMetric.label}
                  </label>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </div>
                <Input 
                  type="number" 
                  value={currencyData[selectedCurrency].growthMomentum.employment.value}
                  onChange={(e) => handleCurrencyUpdate('growthMomentum', 'employment', e.target.value)}
                  step="0.1"
                />
                <div className="text-xs text-muted-foreground mt-1 space-y-1">
                  <div>{currentEmploymentMetric.description}</div>
                  <div>Good: {currentEmploymentMetric.goodThreshold} | Bad: {currentEmploymentMetric.badThreshold}</div>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Manufacturing PMI</label>
                <Input 
                  type="number" 
                  value={currencyData[selectedCurrency].growthMomentum.pmi}
                  onChange={(e) => handleCurrencyUpdate('growthMomentum', 'pmi', e.target.value)}
                  step="0.1"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">GDP QoQ (%)</label>
                <Input 
                  type="number" 
                  value={currencyData[selectedCurrency].growthMomentum.gdpQoQ}
                  onChange={(e) => handleCurrencyUpdate('growthMomentum', 'gdpQoQ', e.target.value)}
                  step="0.1"
                />
              </div>
            </div>

            {/* Real Interest Edge - IMPROVED with real rate display */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
                <h4 className="font-semibold">Real Interest Edge</h4>
              </div>
              
              <div>
                <label className="text-sm font-medium">2-Year Government Yield (%)</label>
                <Input 
                  type="number" 
                  value={currencyData[selectedCurrency].realInterestEdge.twoYearYield}
                  onChange={(e) => handleCurrencyUpdate('realInterestEdge', 'twoYearYield', e.target.value)}
                  step="0.01"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">5Y5Y Breakeven Inflation (%)</label>
                <Input 
                  type="number" 
                  value={currencyData[selectedCurrency].realInterestEdge.breakeven5Y5Y}
                  onChange={(e) => handleCurrencyUpdate('realInterestEdge', 'breakeven5Y5Y', e.target.value)}
                  step="0.01"
                />
              </div>
              
              <div className="p-2 bg-muted rounded text-sm space-y-1">
                <div>Real Rate: {(
                  currencyData[selectedCurrency].realInterestEdge.twoYearYield - 
                  currencyData[selectedCurrency].realInterestEdge.breakeven5Y5Y
                ).toFixed(2)}%</div>
                <div className="text-xs text-muted-foreground">
                  Model Score: {((
                    currencyData[selectedCurrency].realInterestEdge.twoYearYield - 
                    currencyData[selectedCurrency].realInterestEdge.breakeven5Y5Y
                  ) * 1.5).toFixed(2)}
                </div>
              </div>
            </div>

            {/* Positioning */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                <h4 className="font-semibold">COT Positioning</h4>
              </div>
              
              <div>
                <label className="text-sm font-medium">Net Position (Contracts)</label>
                <Input 
                  type="number" 
                  value={currencyData[selectedCurrency].positioning.netPosition}
                  onChange={(e) => handleCurrencyUpdate('positioning', 'netPosition', e.target.value)}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">52-Week Percentile</label>
                <Input 
                  type="number" 
                  value={currencyData[selectedCurrency].positioning.percentile52Week}
                  onChange={(e) => handleCurrencyUpdate('positioning', 'percentile52Week', e.target.value)}
                  min="0"
                  max="100"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Sources Guide - UPDATED with CHF sources */}
      <Card>
        <CardHeader>
          <CardTitle>Data Sources Guide</CardTitle>
          <CardDescription>
            Where to find the data for accurate model inputs (Updated with CHF)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-semibold mb-2">📊 Market Data</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• VIX: TradingView, Yahoo Finance, CBOE</li>
                <li>• SPY/GLD: Any financial data provider</li>
                <li>• Moving averages: Calculate from price history</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">🏦 Interest Rates</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Policy rates: Central bank websites</li>
                <li>• OIS rates: Bloomberg, Refinitiv</li>
                <li>• Government yields: Yahoo Finance, FRED</li>
                <li>• CHF rates: SNB website, SIX Swiss Exchange</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">📈 Economic Data</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Employment: BLS, Eurostat, ONS, SECO (CHF)</li>
                <li>• PMI: S&P Global, national stat offices</li>
                <li>• GDP: National statistical offices</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">💸 Positioning</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• COT data: CFTC.gov (updated Fridays)</li>
                <li>• CHF futures: Swiss Franc (6S)</li>
                <li>• Large speculator positions</li>
                <li>• Calculate 52-week percentiles</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}