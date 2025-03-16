import { NextResponse } from "next/server";
import axios from "axios";

export async function GET() {
  try {
    // Alternative Fear & Greed Index API (free, no API key required)
    const response = await axios.get("https://api.alternative.me/fng/");
    
    if (response.data && response.data.data && response.data.data[0]) {
      const data = response.data.data[0];
      return NextResponse.json({
        value: parseInt(data.value),
        valueText: data.value_classification,
        timestamp: Date.now()
      });
    } else {
      throw new Error("Invalid response from Alternative.me API");
    }
  } catch (error: any) {
    console.error("Error fetching Fear & Greed Index:", error.message);
    
    // Return simulated data if the API call fails
    const simulatedValue = Math.floor(Math.random() * 20) + 15; // Random value between 15-35
    let valueText = "Fear";
    
    if (simulatedValue <= 20) valueText = "Extreme Fear";
    else if (simulatedValue <= 40) valueText = "Fear";
    else if (simulatedValue <= 60) valueText = "Neutral";
    else if (simulatedValue <= 80) valueText = "Greed";
    else valueText = "Extreme Greed";
    
    return NextResponse.json({
      value: simulatedValue,
      valueText,
      timestamp: Date.now(),
      simulated: true
    });
  }
}