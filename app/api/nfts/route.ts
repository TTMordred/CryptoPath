import { NextResponse } from "next/server"

const ETHERSCAN_API_URL = "https://api.etherscan.io/api"

interface NFT {
  tokenID: string
  tokenName: string
  tokenSymbol: string
  contractAddress: string
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get("address")

  if (!address) {
    return NextResponse.json({ error: "Address is required" }, { status: 400 })
  }

  try {
    const response = await fetch(
      `${ETHERSCAN_API_URL}?module=account&action=tokennfttx&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${process.env.ETHERSCAN_API_KEY}`,
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    if (data.status !== "1") {
      // If no NFTs are found, return an empty array instead of throwing an error
      if (data.message === "No transactions found") {
        return NextResponse.json([])
      }
      throw new Error(data.message || "Etherscan API returned an error")
    }

    const nfts = data.result.reduce((acc: NFT[], tx: any) => {
      const existingNFT = acc.find((nft) => nft.contractAddress === tx.contractAddress && nft.tokenID === tx.tokenID)
      if (!existingNFT) {
        acc.push({
          tokenID: tx.tokenID,
          tokenName: tx.tokenName,
          tokenSymbol: tx.tokenSymbol,
          contractAddress: tx.contractAddress,
        })
      }
      return acc
    }, [])

    return NextResponse.json(nfts)
  } catch (error) {
    console.error("Error fetching NFTs:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unknown error occurred" },
      { status: 500 },
    )
  }
}

