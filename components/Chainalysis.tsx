'use client';

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Loader2 } from "lucide-react";

interface Identification {
  category: string;
  name: string;
  description: string;
  url: string;
}

interface ChainalysisData {
  identifications: Identification[];
}

interface ChainalysisDisplayProps {
  address: string;
}

export default function ChainalysisDisplay({ address }: ChainalysisDisplayProps) {
    const [data, setData] = useState<ChainalysisData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
  
    useEffect(() => {
      async function fetchData() {
        try {
          setLoading(true);
          setError(null);
          const response = await fetch(`/api/chainalysis?address=${address}`);
          if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
          }
          const result = await response.json();
          setData(result);
        } catch (err: any) {
          setError(err.message || "Failed to fetch data");
        } finally {
          setLoading(false);
        }
      }
  
      if (address) {
        fetchData();
      }
    }, [address]);
  
    // Loading state
    if (loading) {
      return (
        <Card className="mt-4 border border-amber-500/20 bg-gradient-to-b from-gray-900/50 to-gray-800/50 backdrop-blur-sm">
          <CardContent className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
          </CardContent>
        </Card>
      );
    }
  
    // Error state
    if (error) {
      return (
        <Card className="mt-4 border border-amber-500/20 bg-gradient-to-b from-gray-900/50 to-gray-800/50 backdrop-blur-sm">
          <CardContent className="flex items-center justify-center py-6">
            <AlertCircle className="h-6 w-6 text-red-500" />
            <span className="ml-2 text-red-500">{error}</span>
          </CardContent>
        </Card>
      );
    }
  
    // Empty data state
    if (data && data.identifications.length === 0) {
      return (
        <Card className="mt-4 border border-amber-500/20 bg-gradient-to-b from-gray-900/50 to-gray-800/50 backdrop-blur-sm">
          <CardContent className="flex items-center justify-center py-6">
            <p className="text-green-500 font-medium">
              No suspicious activity found with the address.
            </p>
          </CardContent>
        </Card>
      );
    }
  
    // Normal state (data exists)
    if (data){
    return (
      <Card className="mt-4 border border-amber-500/20 bg-gradient-to-b from-gray-900/50 to-gray-800/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-amber-400">Chainalysis Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-red-500 font-medium">Suspicious activity detected:</p>
            {data.identifications.map((identification, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center">
                  <span className="text-gray-400">Category:</span>
                  <span className="font-medium text-blue-500 ml-2">{identification.category}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-400">Name:</span>
                  <span className="font-medium text-green-500 ml-2">{identification.name}</span>
                </div>
                <div>
                  <span className="text-gray-400">Description:</span>
                  <p className="text-gray-300">{identification.description}</p>
                </div>
                <div>
                  <a
                    href={identification.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 underline"
                  >
                    Learn more
                  </a>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
    }
    // Fallback (if data is null for some reason)
    return null;
}