import { NextResponse } from 'next/server';

  export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const chain = searchParams.get('chain') || 'ethereum';
    const API_KEY = process.env.REACT_APP_DAPPRADAR_API_KEY;
  
    try {
      const nftResponse = await fetch(`https://apis.dappradar.com/v2/nfts/collections?range=24h&sort=sales&order=desc&chain=${chain}&resultsPerPage=10`, {
          headers: {
            accept: 'application/json',
            'x-api-key': API_KEY || '',
          },
        }
    );

  
      // Check if any request failed.
      if (!nftResponse.ok) {
        return NextResponse.json(
          {
            error: `Returned an error: dapps(${nftResponse.status}))`,
          },
          { status: 404 }
        );
      }
  
      const nftData = await nftResponse.json();
  
      return NextResponse.json({
        nfts: nftData,
      });
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || 'Internal server error' },
        { status: 500 }
      );
    }
  }
