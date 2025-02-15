import axios from 'axios'

interface Transaction {
  hash: string
  method: string
  block: string
  age: string
  from: string
  to: string
  amount: string
  fee: string
  timestamp: number
  txType: 'self' | 'contract' | 'transfer'
}

interface FilterParams {
  txType?: string
  addressType?: string
  minAmount?: number
  maxAmount?: number
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}

interface AddressOverview {
  address: string
  balance: string
  balanceUSD: string
  transactionCount: number
  tokenHoldings: TokenBalance[]
  ethPrice: string
}

interface TokenBalance {
  contractAddress: string
  balance: string
  symbol: string
  name: string
}

export class EthereumClient {
  private readonly baseUrl: string
  private readonly apiKey: string

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl
    this.apiKey = apiKey
  }

  private formatTransaction(tx: any): Transaction {
    const timestamp = parseInt(tx.timeStamp)
    const amount = parseFloat(tx.value) / 1e18
    const gasPrice = parseFloat(tx.gasPrice)
    const gasUsed = parseFloat(tx.gasUsed)
    const fee = (gasPrice * gasUsed) / 1e18

    return {
      hash: tx.hash,
      method: this.decodeMethod(tx.input),
      block: tx.blockNumber,
      age: this.calculateAge(timestamp),
      from: tx.from,
      to: tx.to,
      amount: `${amount.toFixed(8)} ETH`,
      fee: fee.toFixed(8),
      timestamp,
      txType: tx.from.toLowerCase() === tx.to.toLowerCase()
        ? 'self'
        : tx.to.toLowerCase() === tx.contractAddress?.toLowerCase()
        ? 'contract'
        : 'transfer'
    }
  }

  private decodeMethod(input: string): string {
    if (!input || input === '0x') return 'Transfer'

    const methodId = input.slice(0, 10)
    const methodMap: Record<string, string> = {
      '0xa9059cbb': 'Transfer',
      '0x095ea7b3': 'Approve',
      '0x23b872dd': 'TransferFrom',
      '0x2e1a7d4d': 'Burn',
      '0x40c10f19': 'Mint',
      '0xf305d719': 'Withdraw',
      '0x9ebea88c': 'Propose Block',
      '0xd0e30db0': 'Deposit ETH'
    }

    return methodMap[methodId] || 'Unknown Method'
  }

  private calculateAge(timestamp: number): string {
    const now = Date.now() / 1000
    const diff = now - timestamp

    if (diff < 60) return `${Math.floor(diff)} seconds ago`
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`
    return `${Math.floor(diff / 86400)} days ago`
  }

  async get_filtered_transactions(
    address: string,
    params: FilterParams = {}
  ): Promise<Transaction[]> {
    try {
      const response = await this.apiRequest('account', 'txlist', {
        address,
        startblock: '0',
        endblock: '99999999',
        sort: 'desc',
        page: params.page || 1,
        offset: params.limit || 10,
        ...params
      })

      let transactions = response.data.result.map((tx: any) => this.formatTransaction(tx))

      // Apply filters
      if (params.txType && params.txType !== 'all') {
        transactions = transactions.filter((tx: Transaction) => tx.txType === params.txType)
      }

      if (params.addressType && params.addressType !== 'all') {
        transactions = transactions.filter((tx: Transaction) =>
          params.addressType === 'from' ? tx.from.toLowerCase() === address.toLowerCase() :
          params.addressType === 'to' ? tx.to.toLowerCase() === address.toLowerCase() : true
        )
      }

      if (params.minAmount) {
        transactions = transactions.filter((tx: Transaction) =>
          parseFloat(tx.amount) >= (params.minAmount || 0)
        )
      }

      if (params.maxAmount) {
        transactions = transactions.filter((tx: Transaction) =>
          parseFloat(tx.amount) <= (params.maxAmount || Infinity)
        )
      }

      if (params.startDate) {
        const startTimestamp = new Date(params.startDate).getTime() / 1000
        transactions = transactions.filter((tx: Transaction) => tx.timestamp >= startTimestamp)
      }

      if (params.endDate) {
        const endTimestamp = new Date(params.endDate).getTime() / 1000
        transactions = transactions.filter((tx: Transaction) => tx.timestamp <= endTimestamp)
      }

      return transactions
    } catch (error) {
      this.handleApiError(error)
      return [] // In case of error, return an empty array to satisfy the return type
    }
  }

  async get_address_overview(address: string): Promise<AddressOverview | undefined> {
    try {
      const [balanceResponse, txCountResponse, tokenBalanceResponse] = await Promise.all([
        this.getAddressBalance(address),
        this.getTransactionCount(address),
        this.getTokenBalances(address)
      ])

      const ethPrice = await this.getEthPrice()

      const balance = parseFloat(balanceResponse.result) / 1e18
      const balanceUSD = balance * ethPrice

      return {
        address,
        balance: `${balance.toFixed(6)} ETH`,
        balanceUSD: `$${balanceUSD.toFixed(2)}`,
        transactionCount: parseInt(txCountResponse.result, 16),
        tokenHoldings: tokenBalanceResponse,
        ethPrice: `$${ethPrice.toFixed(2)}`
      }
    } catch (error) {
      this.handleApiError(error)
      return undefined // If an error occurs, return undefined as the fallback
    }
  }

  private async apiRequest(module: string, action: string, params: Record<string, any>) {
    const response = await axios.get(`${this.baseUrl}/api`, {
      params: {
        module,
        action,
        apikey: this.apiKey,
        ...params
      }
    })

    if (response.data.status !== '1') {
      throw new Error(response.data.message || 'API request failed')
    }

    return response.data
  }

  private handleApiError(error: any) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        return [] // return empty array if not found
      }
      throw new Error(error.response?.data?.message || 'API error occurred')
    }
    throw error
  }

  private async getAddressBalance(address: string) {
    return await this.apiRequest('account', 'balance', { address, tag: 'latest' })
  }

  private async getTransactionCount(address: string) {
    return await this.apiRequest('proxy', 'eth_getTransactionCount', { address, tag: 'latest' })
  }

  private async getTokenBalances(address: string): Promise<TokenBalance[]> {
    const response = await this.apiRequest('account', 'tokentx', {
      address,
      startblock: 0,
      endblock: 999999999,
      sort: 'asc'
    })

    const tokenBalances = new Map<string, TokenBalance>()

    response.result.forEach((tx: any) => {
      const balance = tokenBalances.get(tx.contractAddress)?.balance || '0'
      const amount = parseFloat(tx.value) / Math.pow(10, parseInt(tx.tokenDecimal))
      const newBalance = tx.to.toLowerCase() === address.toLowerCase()
        ? parseFloat(balance) + amount
        : parseFloat(balance) - amount

      tokenBalances.set(tx.contractAddress, {
        contractAddress: tx.contractAddress,
        balance: newBalance.toFixed(6),
        symbol: tx.tokenSymbol,
        name: tx.tokenName
      })
    })

    return Array.from(tokenBalances.values()).filter(token => parseFloat(token.balance) > 0)
  }

  private async getEthPrice() {
    const response = await this.apiRequest('stats', 'ethprice', {})
    return parseFloat(response.result.ethusd)
  }
}
