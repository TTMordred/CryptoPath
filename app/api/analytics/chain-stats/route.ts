import { NextResponse } from "next/server";
import axios from "axios";

export async function GET() {
  try {
    // Try to fetch real data from Blockchain.info
    const response = await axios.get("https://api.blockchain.info/stats");
    
    if (response.data) {
      return NextResponse.json({
        data: {
          hashRate: response.data.hash_rate,
          difficulty: response.data.difficulty,
          latestHeight: response.data.n_blocks_total,
          unconfirmedTx: response.data.n_tx_unconfirmed,
          mempool: response.data.mempool_size,
          btcMined: response.data.n_btc_mined,
          marketPrice: response.data.market_price_usd,
          transactionRate: response.data.n_tx_per_block,
          minutesBetweenBlocks: response.data.minutes_between_blocks,
          totalFees: response.data.total_fees_btc
        },
        timestamp: Date.now()
      });
    } else {
      throw new Error("Invalid response from Blockchain.info API");
    }
  } catch (error) {
    console.error("Failed to fetch blockchain stats:", error);
    
    // Return simulated data if the API call fails
    return NextResponse.json({
      data: {
        hashRate: 180000000000000, // 180 EH/s
        difficulty: 53950000000000,
        latestHeight: 820000,
        unconfirmedTx: 5000,
        mempool: 8500,
        btcMined: 19250000,
        marketPrice: 60000,
        transactionRate: 2500,
        minutesBetweenBlocks: 9.75,
        totalFees: 1.25
      },
      timestamp: Date.now(),
      simulated: true
    });
  }
}