
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get("address")
  const network = searchParams.get("network") || "mainnet"
  const page = parseInt(searchParams.get("page") || "1")
  const offset = parseInt(searchParams.get("offset") || "20")

  if (!address) {
    return NextResponse.json({ error: "Address is required" }, { status: 400 })
  }

  try {
    // Get the base URL dynamically
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : process.env.NEXT_PUBLIC_URL || ''
      
    // Use Etherscan API for Ethereum mainnet
    if (network === 'mainnet') {
      const etherscanResponse = await fetch(
        `${baseUrl}/api/etherscan?module=account&action=txlist&address=${address}&page=${page}&offset=${offset}&sort=desc`
      )
      
      if (!etherscanResponse.ok) {
        throw new Error(`Etherscan API responded with status: ${etherscanResponse.status}`)
      }
      
      const etherscanData = await etherscanResponse.json()
      
      if (etherscanData.status !== "1") {
        // If no transactions are found, return an empty array
        if (etherscanData.message === "No transactions found") {
          return NextResponse.json([])
        }
        throw new Error(etherscanData.message || "Etherscan API returned an error")
      }
      
      // Transform Etherscan data to match our expected format
      const transactions = etherscanData.result.map((tx: any) => {
        const valueInEth = parseInt(tx.value) / 1e18
        
        return {
          id: tx.hash,
          from: tx.from,
          to: tx.to || "Contract Creation",
          value: `${valueInEth.toFixed(4)} ETH`,
          timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
          network,
          gas: parseInt(tx.gas),
          gasPrice: parseInt(tx.gasPrice) / 1e9, // in gwei
          blockNumber: parseInt(tx.blockNumber),
          nonce: parseInt(tx.nonce)
        }
      })
      
      return NextResponse.json(transactions)
    }
    // Use Infura for other networks (Optimism, Arbitrum)
    else {
      // First get the latest block number
      const blockNumberResponse = await fetch(`${baseUrl}/api/infura`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          method: "eth_blockNumber",
          params: [],
          network
        }),
      });
      
      const blockNumberData = await blockNumberResponse.json();
      
      if (blockNumberData.error) {
        throw new Error(blockNumberData.error.message || "Failed to fetch block number");
      }
      
      const latestBlock = parseInt(blockNumberData.result, 16);
      
      // Calculate fromBlock (starting at latest block and going backward)
      // Adjust block range based on network (L2s have different block times)
      let blockRange = 10000; // Default for Ethereum (about 1-2 days of blocks)
      
      // Adjust block range based on network
      if (network === "optimism") {
        blockRange = 100000; // Optimism has faster blocks (~0.5s)
      } else if (network === "arbitrum") {
        blockRange = 50000; // Arbitrum also has faster blocks
      }
      
      const fromBlock = Math.max(0, latestBlock - blockRange);
      
      // Use eth_getLogs to get transactions from/to the address
      const logsResponse = await fetch(`${baseUrl}/api/infura`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          method: "eth_getLogs",
          params: [
            {
              fromBlock: `0x${fromBlock.toString(16)}`,
              toBlock: `0x${latestBlock.toString(16)}`,
              address: null,
              topics: [
                null,
                [
                  `0x000000000000000000000000${address.substring(2).toLowerCase()}`,
                ],
              ],
            }
          ],
          network
        }),
      });
      
      const logsData = await logsResponse.json();
      
      // Handle errors or try with reduced range if needed
      if (logsData.error) {
        // Try with a smaller block range if we get an error about the range being too large
        if (logsData.error.message && logsData.error.message.includes("range")) {
          blockRange = Math.floor(blockRange / 5); // Reduce range by 80%
          const reducedFromBlock = Math.max(0, latestBlock - blockRange);
          
          const reducedLogsResponse = await fetch(`${baseUrl}/api/infura`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              method: "eth_getLogs",
              params: [
                {
                  fromBlock: `0x${reducedFromBlock.toString(16)}`,
                  toBlock: `0x${latestBlock.toString(16)}`,
                  address: null,
                  topics: [
                    null,
                    [
                      `0x000000000000000000000000${address.substring(2).toLowerCase()}`,
                    ],
                  ],
                }
              ],
              network
            }),
          });
          
          const reducedLogsData = await reducedLogsResponse.json();
          if (reducedLogsData.error) {
            throw new Error(reducedLogsData.error.message || "Failed to fetch logs even with reduced range");
          }
          
          logsData.result = reducedLogsData.result;
        } else {
          throw new Error(logsData.error.message || "Failed to fetch logs");
        }
      }
      
      // If no logs found, try an alternative approach - get transaction count and then get transactions
      if (!logsData.result || logsData.result.length === 0) {
        // Try getting transaction count first
        const countResponse = await fetch(`${baseUrl}/api/infura`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            method: "eth_getTransactionCount",
            params: [address, "latest"],
            network
          }),
        });
        
        const countData = await countResponse.json();
        if (countData.error) {
          return NextResponse.json([]); // No transactions found
        }
        
        // Return empty result if count is 0
        const txCount = parseInt(countData.result, 16);
        if (txCount === 0) {
          return NextResponse.json([]);
        }
        
        // Since we know there are transactions but logs didn't work,
        // we'll try the last N blocks directly as a fallback
        const smallerRange = 1000;
        const smallerFromBlock = Math.max(0, latestBlock - smallerRange);
        
        for (let blockNum = latestBlock; blockNum >= smallerFromBlock; blockNum--) {
          const blockResponse = await fetch(`${baseUrl}/api/infura`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              method: "eth_getBlockByNumber",
              params: [`0x${blockNum.toString(16)}`, true],
              network
            }),
          });
          
          const blockData = await blockResponse.json();
          if (blockData.error || !blockData.result || !blockData.result.transactions) {
            continue;
          }
          
          // Filter transactions for the address
          const addrLower = address.toLowerCase();
          const relevantTxs = blockData.result.transactions.filter(
            (tx: any) => 
              tx.from && tx.from.toLowerCase() === addrLower || 
              tx.to && tx.to.toLowerCase() === addrLower
          );
          
          // Add transactions to our list
          for (const tx of relevantTxs) {
            logsData.result = logsData.result || [];
            logsData.result.push({
              transactionHash: tx.hash,
              blockHash: blockData.result.hash
            });
          }
          
          // Stop if we found enough transactions
          if (logsData.result && logsData.result.length >= offset) {
            break;
          }
        }
      }
      
      // Now get transaction receipts for each log
      const transactions = [];
      const processedTxHashes = new Set();
      
      // Calculate pagination
      const startIndex = (page - 1) * offset;
      const endIndex = startIndex + offset;
      
      // Determine currency symbol based on network
      const currencySymbol = network === "optimism" ? "ETH" : 
                            network === "arbitrum" ? "ETH" : "ETH";
      
      if (logsData.result && logsData.result.length > 0) {
        for (const log of logsData.result) {
          // Skip if we already processed this transaction
          if (processedTxHashes.has(log.transactionHash)) {
            continue;
          }
          
          // Get the full transaction
          const txResponse = await fetch(`${baseUrl}/api/infura`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              method: "eth_getTransactionByHash",
              params: [log.transactionHash],
              network
            }),
          });
          
          const txData = await txResponse.json();
          
          if (txData.error) continue;
          
          // Get block to extract timestamp
          if (txData.result && txData.result.blockHash) {
            const blockResponse = await fetch(`${baseUrl}/api/infura`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                method: "eth_getBlockByHash",
                params: [txData.result.blockHash, false],
                network
              }),
            });
            
            const blockData = await blockResponse.json();
            
            if (!blockData.error && blockData.result) {
              const tx = txData.result;
              const valueInWei = tx.value ? parseInt(tx.value, 16) : 0;
              
              transactions.push({
                id: tx.hash,
                from: tx.from,
                to: tx.to || "Contract Creation",
                value: `${(valueInWei / 1e18).toFixed(4)} ${currencySymbol}`,
                timestamp: new Date(parseInt(blockData.result.timestamp, 16) * 1000).toISOString(),
                network,
                gas: parseInt(tx.gas, 16),
                gasPrice: tx.gasPrice ? parseInt(tx.gasPrice, 16) / 1e9 : 0, // in gwei
                blockNumber: parseInt(tx.blockNumber, 16),
                nonce: parseInt(tx.nonce, 16)
              });
              
              processedTxHashes.add(tx.hash);
            }
          }
          
          // Stop if we've collected enough transactions for this page
          if (transactions.length >= endIndex) {
            break;
          }
        }
      }
      
      // Sort by block number (timestamp) descending
      transactions.sort((a, b) => b.blockNumber - a.blockNumber);
      
      // Apply pagination
      const paginatedTransactions = transactions.slice(
        Math.min(startIndex, transactions.length), 
        Math.min(endIndex, transactions.length)
      );
      
      if (paginatedTransactions.length === 0) {
        return NextResponse.json([]);  // Return empty array instead of error
      }

      return NextResponse.json(paginatedTransactions);
    }
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unknown error occurred" },
      { status: 500 },
    );
  }
}
