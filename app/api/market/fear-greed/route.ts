import { NextResponse } from "next/server";
import axios from "axios";

export async function GET() {
  try {
    // The Alternative.me Fear & Greed Index API is free and doesn't require an API key
    const response = await axios.get("https://api.alternative.me/fng/");
    
    if (response.data && response.data.data && response.data.data[0]) {
      return NextResponse.json({
        value: parseInt(response.data.data[0].value),
        valueText: response.data.data[0].value_classification,
        timestamp: response.data.data[0].timestamp
      });
    } else {
      throw new Error("Invalid response format from Fear & Greed API");
    }
  } catch (error) {
    console.error("Error fetching Fear & Greed Index:", error);
    
    // If the API call fails, generate a realistic simulated value
    const simulatedValue = Math.floor(Math.random() * 100) + 1;
    let valueText = "Neutral";
    
    if (simulatedValue <= 25) valueText = "Extreme Fear";
    else if (simulatedValue <= 40) valueText = "Fear";
    else if (simulatedValue <= 60) valueText = "Neutral";
    else if (simulatedValue <= 80) valueText = "Greed";
    else valueText = "Extreme Greed";
    
    return NextResponse.json({
      value: simulatedValue,
      valueText,
      timestamp: Date.now() / 1000,
      simulated: true
    });
  }
}
