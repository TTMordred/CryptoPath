
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info } from 'lucide-react';

interface DominanceCardProps {
  btcDominance: number;
  ethDominance: number;
  othersDominance: number;
}

export default function DominanceCard({ 
  btcDominance, 
  ethDominance, 
  othersDominance 
}: DominanceCardProps) {
  return (
    <Card className="border border-gray-800 bg-black/40 h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-medium flex items-center">
          Bitcoin Dominance
          <Info className="h-4 w-4 ml-2 text-gray-400 cursor-help" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-3 w-3 rounded-full bg-orange-500 mr-2"></div>
                <span className="text-sm">Bitcoin</span>
              </div>
              <span className="font-bold">{btcDominance.toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-3 w-3 rounded-full bg-blue-500 mr-2"></div>
                <span className="text-sm">Ethereum</span>
              </div>
              <span className="font-bold">{ethDominance.toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-3 w-3 rounded-full bg-gray-500 mr-2"></div>
                <span className="text-sm">Others</span>
              </div>
              <span className="font-bold">{othersDominance.toFixed(1)}%</span>
            </div>
          </div>
          
          <div className="relative pt-1">
            <div className="flex h-2 overflow-hidden rounded-full bg-gray-800">
              <div 
                className="bg-orange-500" 
                style={{ width: `${btcDominance}%` }}
              ></div>
              <div 
                className="bg-blue-500" 
                style={{ width: `${ethDominance}%` }}
              ></div>
              <div 
                className="bg-gray-500" 
                style={{ width: `${othersDominance}%` }}
              ></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
