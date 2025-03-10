// types/global.d.ts
interface EthereumProvider {
  request(args: { method: string; params?: any[] }): Promise<any>;
  on(event: string, callback: (...args: any[]) => void): void;
  removeListener?(event: string, callback: (...args: any[]) => void): void;
  chainId?: string;
  networkVersion?: string;
  selectedAddress?: string | null;
  providers?: EthereumProvider[];
  disconnect?: () => void;
  isMetaMask?: boolean;
  isConnected?: () => boolean;
  enable?: () => Promise<string[]>;
}
  interface Window {
    ethereum?: ethers.providers.ExternalProvider & {
      isMetaMask?: boolean;
      providers?: any[];
      request?: (request: { method: string; params?: any[] }) => Promise<any>;
    };
}