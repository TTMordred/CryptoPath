/**
 * IPFS URI utilities for handling CORS issues and gateway fallbacks
 */

// A list of public IPFS gateways to try in order
const IPFS_GATEWAYS = [
  'https://ipfs.io/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
  'https://ipfs.fleek.co/ipfs/',
  'https://dweb.link/ipfs/',
  'https://ipfs.infura.io/ipfs/'
];

/**
 * Converts an IPFS URI (ipfs:// or ipfs/hash) to an HTTP URL using a gateway
 * @param uri The IPFS URI to convert
 * @param preferredGateway Optional preferred gateway URL
 * @returns HTTP URL
 */
export function ipfsUriToGatewayUrl(uri: string, preferredGateway?: string): string {
  if (!uri) return '';
  
  // If already an HTTP URL, return as is
  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    return uri;
  }
  
  let ipfsHash = uri;
  
  // Extract the hash from various IPFS URI formats
  if (uri.startsWith('ipfs://')) {
    ipfsHash = uri.replace('ipfs://', '');
  } else if (uri.startsWith('ipfs/')) {
    ipfsHash = uri.replace('ipfs/', '');
  }
  
  // Remove any leading slashes
  ipfsHash = ipfsHash.replace(/^\/+/, '');
  
  // Use the preferred gateway if provided
  if (preferredGateway) {
    const gateway = preferredGateway.endsWith('/') ? preferredGateway : `${preferredGateway}/`;
    return `${gateway}${ipfsHash}`;
  }
  
  // Default to first gateway in the list
  return `${IPFS_GATEWAYS[0]}${ipfsHash}`;
}

/**
 * Fetches content from an IPFS URI with fallbacks to other gateways if the first fails
 * @param uri IPFS URI to fetch
 * @returns Promise with the fetch response
 */
export async function fetchFromIpfs(uri: string): Promise<Response> {
  // Extract hash regardless of format
  let ipfsHash = '';
  if (uri.startsWith('ipfs://')) {
    ipfsHash = uri.replace('ipfs://', '');
  } else if (uri.startsWith('ipfs/')) {
    ipfsHash = uri.replace('ipfs/', '');
  } else if (uri.includes('ipfs/')) {
    // Handle URLs like https://gateway.com/ipfs/hash
    ipfsHash = uri.split('ipfs/')[1];
  } else {
    // Assume it's a direct hash
    ipfsHash = uri;
  }
  
  // Remove any leading slashes
  ipfsHash = ipfsHash.replace(/^\/+/, '');
  
  // Try each gateway in order until one succeeds
  let lastError = null;
  
  for (const gateway of IPFS_GATEWAYS) {
    try {
      const url = `${gateway}${ipfsHash}`;
      console.log(`Trying IPFS gateway: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json, text/plain, */*',
        },
        // Set cache policy to help with repeated requests
        cache: 'force-cache',
      });
      
      if (response.ok) {
        console.log(`Successfully fetched from ${gateway}`);
        return response;
      }
    } catch (error) {
      console.warn(`Failed to fetch from ${gateway}:`, error);
      lastError = error;
    }
  }
  
  // All gateways failed
  throw new Error(`Failed to fetch from all IPFS gateways: ${lastError}`);
}

/**
 * Fetches JSON metadata from an IPFS URI with fallbacks
 * @param uri IPFS URI to fetch
 * @returns Parsed JSON data
 */
export async function fetchIpfsJson<T = any>(uri: string): Promise<T> {
  const response = await fetchFromIpfs(uri);
  return await response.json();
}
