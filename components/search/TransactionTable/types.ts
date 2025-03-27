export interface Transaction {
  id: string
  hash?: string
  from: string
  to: string
  value: string
  timestamp: string
  network?: string
  gas?: number
  gasPrice?: number
  gasUsed?: number
  blockNumber?: number
  nonce?: number
  status?: "success" | "failed" | "pending"
  type?: TransactionType
  input?: string
  methodId?: string
  methodName?: string
  tokenTransfers?: TokenTransfer[]
  decodedInput?: any
  usdValue?: number
}

export type TransactionType = 
  | "transfer"        // ERC20 transfers
  | "swap"            // DEX swaps
  | "approve"         // Token approvals
  | "mint"            // Token minting
  | "burn"            // Token burning
  | "stake"           // Staking assets
  | "unstake"         // Unstaking assets
  | "borrow"          // Borrowing (lending protocols)
  | "repay"           // Repaying loans
  | "claim"           // Claiming rewards/airdrops
  | "bridge"          // Cross-chain transfers
  | "nft_transfer"    // NFT transfers
  | "nft_mint"        // NFT minting
  | "nft_sale"        // NFT marketplace sales
  | "contract_deploy" // Contract deployment
  | "inflow"          // Money coming in
  | "outflow"         // Money going out
  | "unknown";        // Default unknown type

export interface TokenTransfer {
  token: string
  tokenAddress: string
  tokenSymbol?: string
  from: string
  to: string
  value: string
  decimals?: number
}

export interface ApiResponse {
  data?: Transaction[]
  error?: string
  message?: string
}

export interface FilterState {
  dateRange: { start: string, end: string }
  valueMin: string
  valueMax: string
  searchQuery: string
  statusFilter: Record<string, boolean>
}
