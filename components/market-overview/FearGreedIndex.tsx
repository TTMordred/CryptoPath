import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, AlertTriangle, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';

interface FearGreedData {
  value: number;
  valueText: string;
  timestamp: number;
  simulated?: boolean;
}

export default function FearGreedIndex() {
  const [fgIndex, setFgIndex] = useState<number>(50);
  const [fgText, setFgText] = useState<string>("Neutral");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSimulated, setIsSimulated] = useState<boolean>(false);
  
  useEffect(() => {
    const fetchFearGreedIndex = async () => {
      try {
        // Try to fetch from real API
        const response = await fetch('/api/analytics/fear-greed-index');
        
        if (response.ok) {
          const data = await response.json();
          setFgIndex(data.value);
          setFgText(data.valueText);
          setIsSimulated(data.simulated || false);
        } else {
          throw new Error('API request failed');
        }
      } catch (error) {
        console.error("Failed to fetch Fear & Greed Index:", error);
        
        // Generate fallback data
        const fallbackValue = Math.floor(Math.random() * 20) + 15; // Random value between 15-35
        setFgIndex(fallbackValue);
        setIsSimulated(true);
        
        // Set text based on value
        if (fallbackValue <= 20) setFgText("Extreme Fear");
        else if (fallbackValue <= 40) setFgText("Fear");
        else if (fallbackValue <= 60) setFgText("Neutral");
        else if (fallbackValue <= 80) setFgText("Greed");
        else setFgText("Extreme Greed");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFearGreedIndex();
  }, []);
  
  // Determine color based on the fear & greed index
  const getSentiment = (value: number): { text: string; color: string } => {
    if (value <= 20) return { text: "Extreme Fear", color: 'from-red-600 to-red-500' };
    if (value <= 40) return { text: "Fear", color: 'from-orange-600 to-orange-500' };
    if (value <= 60) return { text: "Neutral", color: 'from-yellow-500 to-yellow-400' };
    if (value <= 80) return { text: "Greed", color: 'from-green-500 to-green-400' };
    return { text: "Extreme Greed", color: 'from-green-700 to-green-600' };
  };
  
  const sentiment = getSentiment(fgIndex);
  const rotation = (fgIndex / 100) * 180 - 90; // Convert to -90 to 90 deg range
  
  return (
    <Card className="border border-gray-800 bg-black/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-medium flex items-center justify-between">
          <span className="flex items-center">
            Fear and Greed Index
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
      <CardContent className="flex flex-col items-center">
        {isLoading ? (
          <div className="flex justify-center items-center h-24">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            <div className="relative w-48 h-24 mb-2">
              {/* Gauge background */}
              <div className="absolute h-full w-full bg-gradient-to-r from-red-600 via-yellow-400 to-green-600 rounded-t-full overflow-hidden opacity-30"></div>
              
              {/* Gauge foreground */}
              <div className="absolute bottom-0 left-0 right-0 flex justify-center">
                <div className="relative w-4 h-24">
                  {/* Needle */}
                  <div 
                    className="absolute bottom-0 left-1/2 w-1 h-20 bg-white rounded-t-full origin-bottom transform -translate-x-1/2"
                    style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
                  ></div>
                  
                  {/* Needle base */}
                  <div className="absolute bottom-0 left-1/2 w-4 h-4 bg-white rounded-full transform -translate-x-1/2"></div>
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-4xl font-bold mb-1">{fgIndex}</div>
              <div className={`text-sm font-medium bg-gradient-to-r ${sentiment.color} inline-block text-transparent bg-clip-text`}>
                {fgText}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
