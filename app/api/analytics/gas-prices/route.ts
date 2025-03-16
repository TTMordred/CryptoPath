import { NextResponse } from "next/server";
import axios from "axios";

export async function GET() {
  try {
    // Try ETH Gas Station API first (which is free)
    const response = await axios.get('https://ethgasstation.info/api/ethgasAPI.json');
    
    if (response.data) {
      // ETH Gas Station returns values in tenths of Gwei, so divide by 10
      return NextResponse.json({
        slow: Math.round(response.data.safeLow / 10),
        average: Math.round(response.data.average / 10),
        fast: Math.round(response.data.fast / 10),
        fastest: Math.round(response.data.fastest / 10),
        baseFee: Math.round(response.data.avgBaseFee / 10),
        timestamp: Date.now()
      });
    } else {
      throw new Error("Invalid response from ETH Gas Station API");
    }
  } catch (error) {
    try {
      // Fallback to Etherscan API if available
      const apiKey = process.env.ETHERSCAN_API_KEY;
      
      if (!apiKey) {
        throw new Error("Etherscan API key is not configured");
      }
      
      const etherscanResponse = await axios.get(
        `https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${apiKey}`
      );
      
      if (etherscanResponse.data && etherscanResponse.data.status === "1" && etherscanResponse.data.result) {
        const { SafeGasPrice, ProposeGasPrice, FastGasPrice, suggestBaseFee } = etherscanResponse.data.result;
        
        return NextResponse.json({
          slow: parseInt(SafeGasPrice),
          average: parseInt(ProposeGasPrice),
          fast: parseInt(FastGasPrice),
          baseFee: parseFloat(suggestBaseFee),
          timestamp: Date.now()
        });
      } else {
        throw new Error("Invalid response from Etherscan API");
      }
    } catch (fallbackError) {
      console.error("Error fetching gas prices:", fallbackError);
      
      // Return simulated data if both API calls fail
      return NextResponse.json({
        slow: Math.floor(Math.random() * 20) + 10,
        average: Math.floor(Math.random() * 30) + 25, 
        fast: Math.floor(Math.random() * 50) + 50,
        baseFee: (Math.random() * 10 + 5).toFixed(2),
        timestamp: Date.now(),
        simulated: true
      });
    }
  }
}
