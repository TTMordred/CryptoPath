// api/dappradar/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chain = searchParams.get('chain') || 'ethereum';
  const API_KEY = process.env.REACT_APP_DAPPRADAR_API_KEY;

  try {
    const [dappsResponse, gamesResponse, marketplaceResponse] = await Promise.all([
      fetch(`https://apis.dappradar.com/v2/dapps/top/uaw?chain=${chain}&range=7d&top=10`, {
        headers: {
          accept: 'application/json',
          'x-api-key': API_KEY || '',
        },
      }),
      fetch(`https://apis.dappradar.com/v2/dapps/top/balance?chain=${chain}&category=games&range=24h&top=10`, {
        headers: {
          accept: 'application/json',
          'x-api-key': API_KEY || '',
        },
      }),
      fetch(`https://apis.dappradar.com/v2/dapps/top/transactions?chain=${chain}&category=marketplaces&range=24h&top=10`, {
        headers: {
          accept: 'application/json',
          'x-api-key': API_KEY || '',
        },
      }),
    ]);

    // Check if any request failed.
    if (!dappsResponse.ok || !gamesResponse.ok || !marketplaceResponse.ok) {
      return NextResponse.json(
        {
          error: `One or more endpoints returned an error: dapps(${dappsResponse.status}), game(${gamesResponse.status}), arketplace(${marketplaceResponse.status})`,
        },
        { status: 404 }
      );
    }

    const dappsData = await dappsResponse.json();
    const gamesData = await gamesResponse.json();
    const marketplacesData = await marketplaceResponse.json();

    return NextResponse.json({
      dapps: dappsData,
      games: gamesData,
      marketplaces: marketplacesData,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
