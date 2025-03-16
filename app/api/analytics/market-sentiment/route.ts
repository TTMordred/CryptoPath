import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET() {
  try {
    // Try to fetch real Fear & Greed Index data
    // This is an unofficial API endpoint that provides the data
    const response = await axios.get('https://api.alternative.me/fng/');
    
    if (response.data && response.data.data && response.data.data[0]) {
      const fngData = response.data.data[0];
      
      // Map the fear & greed value to our format
      // F&G index is 0-100, where 0 is extreme fear and 100 is extreme greed
      const sentimentData = {
        score: parseInt(fngData.value),
        // Add some variance for social and news, but keep them related to the main score
        socialMediaScore: Math.min(Math.max(parseInt(fngData.value) + Math.floor(Math.random() * 20) - 10, 0), 100),
        newsScore: Math.min(Math.max(parseInt(fngData.value) + Math.floor(Math.random() * 20) - 10, 0), 100),
        classification: fngData.value_classification,
        redditMentions: Math.floor(Math.random() * 30000) + 10000, // Still simulated
        twitterMentions: Math.floor(Math.random() * 100000) + 50000, // Still simulated
        timestamp: Date.now()
      };

      return NextResponse.json(sentimentData, { status: 200 });
    } else {
      throw new Error("Invalid response from Fear & Greed API");
    }
  } catch (error) {
    console.error('Error in market sentiment API:', error);
    
    // Return simulated data if the API call fails
    const baseScore = Math.random() < 0.6 ? 
      Math.floor(Math.random() * 20) + 45 : 
      Math.floor(Math.random() * 40) + 30;
    
    const socialMediaVariance = Math.floor(Math.random() * 20) - 10;
    const newsVariance = Math.floor(Math.random() * 20) - 10;
    
    return NextResponse.json({
      score: baseScore,
      socialMediaScore: Math.min(Math.max(baseScore + socialMediaVariance, 0), 100),
      newsScore: Math.min(Math.max(baseScore + newsVariance, 0), 100),
      redditMentions: Math.floor(Math.random() * 30000) + 10000,
      twitterMentions: Math.floor(Math.random() * 100000) + 50000,
      timestamp: Date.now(),
      simulated: true
    }, { status: 200 });
  }
}
