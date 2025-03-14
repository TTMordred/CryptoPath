"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import Image from "next/image"

interface NFT {
  tokenID: string
  tokenName: string
  tokenSymbol: string
  contractAddress: string
}

export default function NFTGallery() {
  const searchParams = useSearchParams()
  const address = searchParams.get("address")
  const [nfts, setNFTs] = useState<NFT[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (address) {
      setLoading(true)
      setError(null)
      fetch(`/api/nfts?address=${address}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            throw new Error(data.error)
          }
          setNFTs(data)
        })
        .catch((err) => {
          console.error("Error fetching NFTs:", err)
          setError(err.message || "Failed to fetch NFTs")
        })
        .finally(() => setLoading(false))
    }
  }, [address])

  if (!address) {
    return null // Don't render anything if there's no address
  }

  if (loading) {
    return (
      <Card className="mt-4">
        <CardContent className="flex items-center justify-center h-40">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="mt-4">
        <CardContent>
          <p className="text-center text-red-500">Error: {error}</p>
        </CardContent>
      </Card>
    )
  }

  if (nfts.length === 0) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>NFT Gallery</CardTitle>
        </CardHeader>
        <CardContent>No NFTs found for this address.</CardContent>
      </Card>
    )
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>NFT Gallery</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {nfts.map((nft) => (
            <Card key={`${nft.contractAddress}-${nft.tokenID}`}>
              <CardContent className="p-4">
                <Image
                  src={`https://api.opensea.io/api/v1/asset/${nft.contractAddress}/${nft.tokenID}/image`}
                  alt={nft.tokenName}
                  width={200}
                  height={200}
                  className="w-full h-auto rounded-lg"
                />
                <p className="mt-2 font-semibold">{nft.tokenName}</p>
                <p className="text-sm text-gray-500">#{nft.tokenID}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

