// Contract address
export const CONTRACT_ADDRESS = "0xc3e9Cf26237c9002c0C04305D637AEa3d9A4A1DE"; // PATH Token V3 address
export const CAKE_TOKEN_ADDRESS = "0xFa60D973F7642B748046464e165A65B7323b0DEE"; // CAKE token on BSC Testnet
export const PANCAKE_ROUTER = "0xD99D1c33F9fC3444f8101754aBC46c52416550D1"; // PancakeSwap Router on BSC Testnet

// ABI for PATH Token V3 - Updated with all functions from the new contract
export const CONTRACT_ABI = [
  // Read functions
  "function balanceOf(address account) view returns (uint256)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function decimals() view returns (uint8)",
  "function FAUCET_AMOUNT() view returns (uint256)",
  "function DAILY_LIMIT() view returns (uint256)",
  "function COOLDOWN() view returns (uint256)",
  "function swapFee() view returns (uint256)",
  "function feeWallet() view returns (address)",
  "function pairedToken() view returns (address)",
  "function owner() view returns (address)",
  "function faucetBalance() view returns (uint256)",
  "function antiBotEnabled() view returns (bool)",
  "function blacklist(address account) view returns (bool)",
  "function faucetRecords(address account) view returns (uint256 lastRequest, uint256 dailyCount, uint256 lastBlock)",
  "function allowance(address owner, address spender) view returns (uint256)",
  
  // Write functions
  "function requestTokens() external",
  "function swapTokens(uint256 amountIn, uint256 amountOutMin, uint24 fee) external",
  "function addLiquidity(uint256 amount0Desired, uint256 amount1Desired, uint24 fee, int24 tickLower, int24 tickUpper) external returns (uint256 tokenId)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function refillFaucet(uint256 amount) external",
  "function setFeeParameters(uint256 _newFee, address _newWallet) external",
  "function manageBlacklist(address[] calldata addresses, bool status) external",
  "function toggleAntiBot() external",
  "function transfer(address to, uint256 amount) external returns (bool)",
  
  // Events
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
  "event FaucetUsed(address indexed user, uint256 amount)",
  "event LiquidityAdded(address indexed user, uint256 tokenId)",
  "event SwapExecuted(address indexed user, uint256 amountIn, uint256 amountOut)"
];

// PancakeSwap Router ABI
export const PANCAKE_ROUTER_ABI = [
  "function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] calldata path, address to, uint256 deadline) external returns (uint256[] memory amounts)",
  "function getAmountsOut(uint256 amountIn, address[] calldata path) external view returns (uint256[] memory amounts)",
  "function WETH() external pure returns (address)"
];

// Token ABI for approvals
export const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)"
];

// Faucet constants
export const FAUCET_AMOUNT = "100";
export const FAUCET_COOLDOWN = 21600;
export const DAILY_LIMIT = 3;

// BSC Testnet
export const CHAIN_ID = 97;
export const BSC_TESTNET_PARAMS = {
  chainId: '0x61',
  chainName: 'BSC Testnet',
  nativeCurrency: {
    name: 'BNB',
    symbol: 'tBNB',
    decimals: 18
  },
  rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545'],
  blockExplorerUrls: ['https://testnet.bscscan.com']
};