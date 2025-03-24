import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 50; // 50 requests per minute

// Basic in-memory rate limiter
const rateLimiter = new Map<string, { count: number, resetAt: number }>();

export async function GET(req: NextRequest) {
  // Get URL from searchParams
  const url = req.nextUrl.searchParams.get('url');
  
  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  // Apply rate limiting based on IP
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const clientId = String(ip);
  
  // Check rate limit
  if (!checkRateLimit(clientId)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  try {
    // Validate that the URL is for the expected API
    if (
      !url.includes('alchemy.com/nft/') && 
      !url.includes('moralis.io/api/') && 
      !url.includes('etherscan.io/api') &&
      !url.includes('bscscan.com/api')
    ) {
      return NextResponse.json({ error: 'Invalid API URL' }, { status: 403 });
    }
    
    // Make the request to the NFT API service
    const response = await axios.get(url, {
      headers: {
        'Accept': 'application/json',
      },
      // Handle timeouts and large responses
      timeout: 10000,
      maxContentLength: 10 * 1024 * 1024, // 10MB max
      validateStatus: (status) => status < 500,
    });
    
    // Return the data from the API
    return NextResponse.json(response.data, { status: response.status });
  } catch (error: any) {
    console.error('API proxy error:', error);
    
    // Handle different error types
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      return NextResponse.json({
        error: 'External API error',
        details: error.response.data
      }, { status: error.response.status });
    } else if (error.request) {
      // The request was made but no response was received
      return NextResponse.json({
        error: 'External API timeout',
        message: 'The request timed out'
      }, { status: 504 });
    } else {
      // Something happened in setting up the request that triggered an Error
      return NextResponse.json({
        error: 'Server error',
        message: error.message
      }, { status: 500 });
    }
  }
}

// Rate limiting helper function
function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  
  // Clean up expired entries
  for (const [id, data] of rateLimiter.entries()) {
    if (data.resetAt < now) {
      rateLimiter.delete(id);
    }
  }
  
  // Get or create client rate limit data
  let clientData = rateLimiter.get(clientId);
  if (!clientData) {
    clientData = { count: 0, resetAt: now + RATE_LIMIT_WINDOW };
    rateLimiter.set(clientId, clientData);
  } else if (clientData.resetAt < now) {
    // Reset if window expired
    clientData.count = 0;
    clientData.resetAt = now + RATE_LIMIT_WINDOW;
  }
  
  // Check and increment
  if (clientData.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  
  clientData.count++;
  return true;
}
