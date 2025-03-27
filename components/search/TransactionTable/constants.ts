import { TransactionType } from "./types";

// Cache duration in milliseconds
export const CACHE_DURATION = 60000; // 1 minute cache

// Known method signatures for better transaction classification
export const METHOD_SIGNATURES: Record<string, { type: TransactionType, name: string }> = {
  '0xa9059cbb': { type: 'transfer', name: 'transfer' },
  '0x23b872dd': { type: 'transfer', name: 'transferFrom' },
  '0x095ea7b3': { type: 'approve', name: 'approve' },
  '0x7ff36ab5': { type: 'swap', name: 'swapExactETHForTokens' },
  '0x4a25d94a': { type: 'swap', name: 'swapExactTokensForTokens' },
  '0x38ed1739': { type: 'swap', name: 'swapExactTokensForTokens' },
  '0x18cbafe5': { type: 'swap', name: 'swapExactTokensForETH' },
  '0x8803dbee': { type: 'swap', name: 'swapTokensForExactTokens' },
  '0xfb3bdb41': { type: 'swap', name: 'swapETHForExactTokens' },
  '0x5c11d795': { type: 'swap', name: 'swapExactTokensForTokensSupportingFeeOnTransferTokens' },
  '0x791ac947': { type: 'swap', name: 'swapExactTokensForETHSupportingFeeOnTransferTokens' },
  '0x40c10f19': { type: 'mint', name: 'mint' },
  '0xa0712d68': { type: 'mint', name: 'mint' },
  '0x6a627842': { type: 'mint', name: 'mint' },
  '0x42966c68': { type: 'burn', name: 'burn' },
  '0x9dc29fac': { type: 'burn', name: 'burn' },
  '0xbe9a6555': { type: 'bridge', name: 'bridgeETH' },
  '0x2e1a7d4d': { type: 'unstake', name: 'withdraw' },
  '0xb6b55f25': { type: 'stake', name: 'deposit' },
  '0xe2bbb158': { type: 'stake', name: 'deposit' },
  '0x0fabd9f7': { type: 'claim', name: 'claimRewards' },
  '0x2e7ba6ef': { type: 'claim', name: 'claim' },
  '0x3d18b912': { type: 'claim', name: 'getReward' },
  '0x6a761202': { type: 'nft_sale', name: 'execTransaction' },
  '0x1249c58b': { type: 'nft_mint', name: 'mint' },
  '0xc87b56dd': { type: 'nft_transfer', name: 'tokenURI' },
};

// Known wallet addresses and their names
export const KNOWN_ADDRESSES: Record<string, string> = {
  '0x28c6c06298d514db089934071355e5743bf21d60': 'Binance Hot Wallet',
  '0xe0a809fdd155c6ec87eeca8db0583c2bfc8bafbb': 'Coinbase Hot Wallet',
  '0xdfd5293d8e347dfe59e90efd55b2956a1343963d': 'Coinbase Hot Wallet',
  '0x99c9fc46f92e8a1c0dec1b1747d010903e884be1': 'Optimism Bridge',
  '0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9': 'Aave',
  '0x3dfd23a6c5e8bbcfc9581d2e864a68feb6a076d3': 'Compound',
  '0x7a250d5630b4cf539739df2c5dacb4c659f2488d': 'Uniswap V2 Router',
  '0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45': 'Uniswap V3 Router',
  '0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f': 'SushiSwap Router',
  '0x1111111254eeb25477b68fb85ed929f73a960582': '1inch Router',
  // Add more as needed
};
