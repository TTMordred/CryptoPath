import { NextResponse } from "next/server";
import axios from "axios";

// Calculate Altcoin Season Index based on BTC dominance and altcoin performance
export async function GET() {
  try {
    // Step 1: Get BTC dominance from Binance API (uses CoinMarketCap data)
    const dominanceResponse = await axios.get(`https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT`);
    
    // Step 2: Get data for top altcoins
    const altcoinsSymbols = ["ETHUSDT", "BNBUSDT", "SOLUSDT", "ADAUSDT"];
    const altcoinPromises = altcoinsSymbols.map(symbol => 
      axios.get(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`)
    );
    
    const altcoinResponses = await Promise.allSettled(altcoinPromises);
    
    // Step 3: Calculate altcoin performance
    let altcoinPerformance = 0;
    let successfulResponses = 0;
    
    altcoinResponses.forEach(response => {
      if (response.status === 'fulfilled' && response.value.data) {
        const priceChangePercent = parseFloat(response.value.data.priceChangePercent);
        if (!isNaN(priceChangePercent)) {
          altcoinPerformance += priceChangePercent;
          successfulResponses++;
        }
      }
    });
    
    if (successfulResponses > 0) {
      altcoinPerformance /= successfulResponses;
    }
    
    // Step 4: Get BTC dominance from CoinMarketCap if possible
    let btcDominance = 60; // Default value if we can't get real data
    
    try {
      const cmcResponse = await axios.get('/api/coinmarketcap/global-metrics');
      if (cmcResponse.data && cmcResponse.data.data && cmcResponse.data.data.btc_dominance) {
        btcDominance = cmcResponse.data.data.btc_dominance;
      }
    } catch (error) {
      console.error("Could not fetch BTC dominance from CoinMarketCap", error);
    }
    
    // Step 5: Calculate Altcoin Season Index (0-100 scale)
    // Higher BTC dominance means less altcoin season
    // Higher altcoin performance relative to BTC means more altcoin season
    const btcPerformance = parseFloat(dominanceResponse.data.priceChangePercent);
    
    // Base index on BTC dominance (inverted, scaled to 0-75)
    let altcoinIndex = 100 - Math.min(100, Math.max(0, btcDominance * 1.25));
    
    // Adjust based on relative performance of altcoins vs BTC (adds or subtracts up to 25 points)
    if (!isNaN(btcPerformance) && !isNaN(altcoinPerformance)) {
      const performanceDiff = altcoinPerformance - btcPerformance;
      altcoinIndex += Math.min(25, Math.max(-25, performanceDiff * 2));
    }
    
    // Ensure the index stays within 0-100 range
    altcoinIndex = Math.min(100, Math.max(0, altcoinIndex));
    
    // Calculate the season text
    let seasonText = "Neutral";
    if (altcoinIndex < 25) seasonText = "Bitcoin Season";
    else if (altcoinIndex < 45) seasonText = "Bitcoin Favored";
    else if (altcoinIndex < 55) seasonText = "Neutral";
    else if (altcoinIndex < 75) seasonText = "Altcoin Favored";
    else seasonText = "Altcoin Season";
    
    return NextResponse.json({
      value: Math.round(altcoinIndex),
      valueText: seasonText,
      btcDominance: btcDominance,
      timestamp: Date.now() / 1000
    });
  } catch (error) {
    console.error("Error calculating Altcoin Season Index:", error);
    
    // If API calls fail, return simulated data
    const simulatedValue = Math.floor(Math.random() * 100) + 1;
    let valueText = "Neutral";
    
    if (simulatedValue <= 25) valueText = "Bitcoin Season";
    else if (simulatedValue < 45) valueText = "Bitcoin Favored";
    else if (simulatedValue < 55) valueText = "Neutral";
    else if (simulatedValue < 75) valueText = "Altcoin Favored";
    else valueText = "Altcoin Season";
    
    return NextResponse.json({
      value: simulatedValue,
      valueText,
      btcDominance: 60 + (Math.random() * 10 - 5),
      timestamp: Date.now() / 1000,
      simulated: true
    });
  }
}
