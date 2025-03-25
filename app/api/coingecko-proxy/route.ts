
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');

  if (!endpoint) {
    return NextResponse.json({ error: 'Endpoint is required' }, { status: 400 });
  }

  try {
    const response = await fetch(`https://api.coingecko.com/api/v3/${endpoint}`, {
      headers: {
        'Accept': 'application/json',
        // Nếu bạn có API key trả phí, thêm vào đây
        // 'x-cg-api-key': 'your-api-key-here',
      },
    });

    if (!response.ok) {
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After') || '60'; // Mặc định 60s nếu không có header
        return NextResponse.json(
          {
            error: 'Rate limit exceeded. Please try again later.',
            retryAfter: parseInt(retryAfter),
          },
          { status: 429 } // Trả về 429 thay vì ném lỗi
        );
      }
      throw new Error(`CoinGecko API responded with status ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from CoinGecko' },
      { status: 500 }
    );
  }
}

export const config = {
  runtime: 'nodejs',
};