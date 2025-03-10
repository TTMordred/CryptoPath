// types/global.d.ts
interface EthereumProvider {
    request(args: { method: string; params?: any[] }): Promise<any>;
    on(event: string, callback: (...args: any[]) => void): void;
    removeListener(event: string, callback: (...args: any[]) => void): void;
    chainId?: string;
    networkVersion?: string;
    selectedAddress?: string;
    providers?: EthereumProvider[];
    disconnect?: () => void;
    isMetaMask?: boolean;
  }
  
  interface Window {
    ethereum?: EthereumProvider & {
      _metamask?: {
        isUnlocked: () => Promise<boolean>;
      };
    };
  }