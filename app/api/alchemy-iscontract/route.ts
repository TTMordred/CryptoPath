import { NextResponse } from "next/server";

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
const ALCHEMY_API_URL = `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;

interface ContractData {
  isContract: boolean;
  contractInfo?: {
    name: string;
    symbol?: string;
    tokenType?: 'ERC20' | 'ERC721' | 'ERC1155';
    totalSupply?: string;
    decimals?: number;
    logo?: string;
    holders?: number;
    transactions?: number;
    deployedAt?: string;
    implementationAddress?: string;
    verified: boolean;
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json(
      { error: "Address is required" },
      { status: 400 }
    );
  }

  try {
    // Check if address is a contract
    const codeResponse = await fetch(ALCHEMY_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getCode',
        params: [address, 'latest']
      })
    });

    const codeData = await codeResponse.json();
    const isContract = codeData.result !== '0x';

    if (!isContract) {
      return NextResponse.json({ isContract: false });
    }

    // Check contract interfaces to determine type
    const [erc721Response, erc1155Response] = await Promise.all([
      // Check ERC721 interface
      fetch(ALCHEMY_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 2,
          method: 'eth_call',
          params: [{
            to: address,
            data: '0x01ffc9a780ac58cd00000000000000000000000000000000000000000000000000000000'
          }, 'latest']
        })
      }),
      // Check ERC1155 interface
      fetch(ALCHEMY_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 3,
          method: 'eth_call',
          params: [{
            to: address,
            data: '0x01ffc9a7d9b67a2600000000000000000000000000000000000000000000000000000000'
          }, 'latest']
        })
      })
    ]);

    const [erc721Data, erc1155Data] = await Promise.all([
      erc721Response.json(),
      erc1155Response.json()
    ]);

    // Get token metadata
    const metadataResponse = await fetch(ALCHEMY_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 4,
        method: 'alchemy_getTokenMetadata',
        params: [address]
      })
    });

    const metadataData = await metadataResponse.json();
    const metadata = metadataData.result;

    // Determine token type
    let tokenType: 'ERC20' | 'ERC721' | 'ERC1155' | undefined;

    if (erc721Data.result === '0x0000000000000000000000000000000000000000000000000000000000000001') {
      tokenType = 'ERC721';
    } else if (erc1155Data.result === '0x0000000000000000000000000000000000000000000000000000000000000001') {
      tokenType = 'ERC1155';
    } else if (metadata?.decimals !== undefined) {
      tokenType = 'ERC20';
    }

    // Get deployment info
    const deploymentResponse = await fetch(ALCHEMY_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 5,
        method: 'alchemy_getAssetTransfers',
        params: [
          {
            fromBlock: "0x0",
            toAddress: address,
            category: ["external"],
            withMetadata: true,
            excludeZeroValue: true,
            maxCount: "0x1"
          }
        ]
      })
    });

    const deploymentData = await deploymentResponse.json();
    const deployment = deploymentData.result?.transfers?.[0];

    const contractData: ContractData = {
      isContract: true,
      contractInfo: {
        name: metadata?.name || "Unknown Contract",
        symbol: metadata?.symbol,
        tokenType,
        totalSupply: metadata?.totalSupply,
        decimals: metadata?.decimals,
        logo: metadata?.logo,
        holders: 0,
        transactions: 0,
        deployedAt: deployment?.metadata?.blockTimestamp,
        verified: Boolean(metadata?.name),
      }
    };

    return NextResponse.json(contractData);
  } catch (error) {
    console.error("Error detecting contract:", error);
    return NextResponse.json(
      { error: "Failed to detect contract" },
      { status: 500 }
    );
  }
}