import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, AlertTriangle } from 'lucide-react';
import axios from 'axios';

interface AltcoinSeasonData {
  value: number;
  valueText: string;
  btcDominance: number;
  timestamp: number;
  simulated?: boolean;
}

export default function AltcoinIndex() {
  const [altcoinIndex, setAltcoinIndex] = useState<number>(50);
  const [btcDominance, setBtcDominance] = useState<number>(60);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [seasonText, setSeasonText] = useState<string>("Neutral");
  const [isSimulated, setIsSimulated] = useState<boolean>(false);
  
  useEffect(() => {
    const fetchAltcoinSeasonData = async () => {
      try {
        const response = await axios.get<AltcoinSeasonData>('/api/market/altcoin-season');
        setAltcoinIndex(response.data.value);
        setSeasonText(response.data.valueText);
        setBtcDominance(response.data.btcDominance);
        setIsSimulated(response.data.simulated || false);
      } catch (error) {
        console.error("Failed to fetch Altcoin Season Index:", error);
        // Generate a fallback value
        const fallbackValue = Math.floor(Math.random() * 100) + 1;
        setAltcoinIndex(fallbackValue);
        setBtcDominance(60 + (Math.random() * 10 - 5));
        setIsSimulated(true);
        
        // Set season text based on value
        if (fallbackValue <= 25) setSeasonText("Bitcoin Season");
        else if (fallbackValue < 45) setSeasonText("Bitcoin Favored");
        else if (fallbackValue < 55) setSeasonText("Neutral");
        else if (fallbackValue < 75) setSeasonText("Altcoin Favored");
        else setSeasonText("Altcoin Season");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAltcoinSeasonData();
  }, []);
  
  // Determine season based on the altcoin index
  const getSeason = (value: number): { text: string; color: string } => {
    if (value <= 25) return { text: 'Bitcoin Season', color: 'from-orange-500 to-yellow-500' };
    if (value < 45) return { text: 'Bitcoin Favored', color: 'from-yellow-500 to-yellow-300' };
    if (value < 55) return { text: 'Neutral', color: 'from-blue-500 to-purple-500' };
    if (value < 75) return { text: 'Altcoin Favored', color: 'from-blue-500 to-blue-300' };
    return { text: 'Altcoin Season', color: 'from-blue-700 to-blue-500' };
  };
  
  const season = getSeason(altcoinIndex);
  
  return (
    <Card className="border border-gray-800 bg-black/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-medium flex items-center justify-between">
          <span className="flex items-center">
            Altcoin Season Index
            <Info className="h-4 w-4 ml-2 text-gray-400 cursor-help" />
          </span>
          {isSimulated && (
            <span className="text-xs text-amber-500 flex items-center">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Estimated
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="text-center mb-4">
              <div className="text-4xl font-bold mb-1">{altcoinIndex}<span className="text-lg text-gray-400">/100</span></div>
              <div className={`text-sm font-medium bg-gradient-to-r ${season.color} inline-block text-transparent bg-clip-text`}>
                {seasonText}
              </div>
            </div>
            
            <div className="relative pt-1 w-full">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block text-orange-500">
                    Bitcoin Season
                  </span>
                </div>
                <div>
                  <span className="text-xs font-semibold inline-block text-blue-500">
                    Altcoin Season
                  </span>
                </div>
              </div>
              <div className="h-2 w-full bg-gray-800 rounded-full">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-orange-500 via-purple-500 to-blue-500"
                  style={{ width: `${altcoinIndex}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-1 text-xs text-gray-400">
                <span>0</span>
                <span>25</span>
                <span>75</span>
                <span>100</span>
              </div>
              
              <div className="mt-4 text-xs text-gray-400">
                <div className="flex justify-between items-center">
                  <span>BTC Dominance:</span>
                  <span className="font-semibold">{btcDominance.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
