import React, { useState, useEffect, JSX } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import axios from 'axios';

interface SentimentData {
  score: number;
  socialMediaScore: number;
  newsScore: number;
  redditMentions: number;
  twitterMentions: number;
  timestamp: number;
  simulated?: boolean;
}

export default function MarketSentimentCard() {
  const [sentimentData, setSentimentData] = useState<SentimentData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSimulated, setIsSimulated] = useState<boolean>(false);
  
  useEffect(() => {
    const fetchSentimentData = async () => {
      try {
        const response = await axios.get<SentimentData>('/api/analytics/market-sentiment');
        setSentimentData(response.data);
        setIsSimulated(response.data.simulated || false);
      } catch (error) {
        console.error("Failed to fetch sentiment data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSentimentData();
    
    // Refresh every 30 minutes
    const interval = setInterval(fetchSentimentData, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
  
  const getSentimentText = (score: number): { text: string; color: string; icon: JSX.Element } => {
    if (score >= 70) return { 
      text: 'Extremely Bullish', 
      color: 'text-green-500', 
      icon: <TrendingUp className="h-5 w-5 mr-2" /> 
    };
    if (score >= 60) return { 
      text: 'Bullish', 
      color: 'text-green-400', 
      icon: <TrendingUp className="h-5 w-5 mr-2" /> 
    };
    if (score >= 45) return { 
      text: 'Slightly Bullish', 
      color: 'text-green-300', 
      icon: <TrendingUp className="h-5 w-5 mr-2" /> 
    };
    if (score > 55) return { 
      text: 'Neutral', 
      color: 'text-gray-400', 
      icon: <Minus className="h-5 w-5 mr-2" /> 
    };
    if (score > 40) return { 
      text: 'Slightly Bearish', 
      color: 'text-red-300', 
      icon: <TrendingDown className="h-5 w-5 mr-2" /> 
    };
    if (score > 30) return { 
      text: 'Bearish', 
      color: 'text-red-400', 
      icon: <TrendingDown className="h-5 w-5 mr-2" /> 
    };
    return { 
      text: 'Extremely Bearish', 
      color: 'text-red-500', 
      icon: <TrendingDown className="h-5 w-5 mr-2" /> 
    };
  };
  
  return (
    <Card className="border border-gray-800 bg-black/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-medium flex items-center justify-between">
          <span className="flex items-center">
            Market Sentiment Analysis
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
        ) : sentimentData ? (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-4xl font-bold">{sentimentData.score.toFixed(0)}<span className="text-lg text-gray-400">/100</span></div>
              
              {(() => {
                const sentiment = getSentimentText(sentimentData.score);
                return (
                  <div className={`flex items-center justify-center mt-1 ${sentiment.color}`}>
                    {sentiment.icon}
                    {sentiment.text}
                  </div>
                );
              })()}
            </div>
            
            <div className="relative pt-1 w-full">
              <div className="h-2 w-full bg-gray-800 rounded-full">
                <div 
                  className={`h-full rounded-full ${
                    sentimentData.score >= 55 ? 'bg-green-500' : 
                    sentimentData.score >= 45 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${sentimentData.score}%` }}
                ></div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <div className="text-sm text-gray-400">Social Media</div>
                <div className={`text-lg font-bold ${
                  sentimentData.socialMediaScore >= 55 ? 'text-green-500' : 
                  sentimentData.socialMediaScore >= 45 ? 'text-yellow-500' : 'text-red-500'
                }`}>
                  {sentimentData.socialMediaScore.toFixed(0)}/100
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400">News</div>
                <div className={`text-lg font-bold ${
                  sentimentData.newsScore >= 55 ? 'text-green-500' : 
                  sentimentData.newsScore >= 45 ? 'text-yellow-500' : 'text-red-500'
                }`}>
                  {sentimentData.newsScore.toFixed(0)}/100
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
              <div>Reddit: {sentimentData.redditMentions.toLocaleString()} mentions</div>
              <div>Twitter: {sentimentData.twitterMentions.toLocaleString()} mentions</div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-gray-400">
            Unable to fetch sentiment data
          </div>
        )}
      </CardContent>
    </Card>
  );
}
