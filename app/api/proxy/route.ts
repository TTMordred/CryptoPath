// This file creates a proxy endpoint to bypass CORS issues during development

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  
  if (!url) {
    return new Response(JSON.stringify({ error: 'URL parameter is required' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'CryptoPath/1.0',
      },
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: `API responded with status: ${response.status}` }), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'max-age=60, s-maxage=60',
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch from remote API' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
