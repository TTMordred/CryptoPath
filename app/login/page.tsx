'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ParticlesBackground from '@/components/ParticlesBackground';
import { Web3OnboardProvider, init, useConnectWallet } from '@web3-onboard/react';
import injectedModule from '@web3-onboard/injected-wallets';
import walletConnectModule from '@web3-onboard/walletconnect';
import coinbaseModule from '@web3-onboard/coinbase';
import infinityWalletModule from '@web3-onboard/infinity-wallet'
import safeModule from '@web3-onboard/gnosis'
import trezorModule from '@web3-onboard/trezor'
import magicModule from '@web3-onboard/magic'
import dcentModule from '@web3-onboard/dcent';

const dcent = dcentModule();
import sequenceModule from '@web3-onboard/sequence'
import tahoModule from '@web3-onboard/taho'
import trustModule from '@web3-onboard/trust'
import okxModule from '@web3-onboard/okx'
import frontierModule from '@web3-onboard/frontier';

const INFURA_KEY = '7d389678fba04ceb9510b2be4fff5129'; // Replace with your Infura key

// Initialize WalletConnect with projectId
const walletConnect = walletConnectModule({
  projectId: 'b773e42585868b9b143bb0f1664670f1', // Replace with your WalletConnect project ID
  optionalChains: [1, 137] // Optional: specify chains you want to support
});


const injected = injectedModule();
const coinbase = coinbaseModule();
const infinityWallet = infinityWalletModule()
const safe = safeModule()
const sequence = sequenceModule()
const taho = tahoModule() // Previously named Tally Ho wallet
const trust = trustModule()
const okx = okxModule()
const frontier = frontierModule()
const trezorOptions = {
  email: 'test@test.com',
  appUrl: 'https://www.blocknative.com'
}

const trezor = trezorModule(trezorOptions)

const magic = magicModule({
  apiKey: 'pk_live_E9B0C0916678868E'
})

const wallets = [infinityWallet,
  sequence,
  injected,
  trust,
  okx,
  frontier,
  taho,
  coinbase,
  dcent,
  walletConnect,
  safe,
  magic];

const chains = [
  {
    id: '0x1',
    token: 'ETH',
    label: 'Ethereum Mainnet',
    rpcUrl: `https://mainnet.infura.io/v3/${INFURA_KEY}`,
  },
  {
    id: 11155111,
    token: 'ETH',
    label: 'Sepolia',
    rpcUrl: 'https://rpc.sepolia.org/'
  },
  {
    id: '0x13881',
    token: 'MATIC',
    label: 'Polygon - Mumbai',
    rpcUrl: 'https://matic-mumbai.chainstacklabs.com',
  },
  {
    id: '0x38',
    token: 'BNB',
    label: 'Binance',
    rpcUrl: 'https://bsc-dataseed.binance.org/'
  },
  {
    id: '0xA',
    token: 'OETH',
    label: 'OP Mainnet',
    rpcUrl: 'https://mainnet.optimism.io'
  },
  {
    id: '0xA4B1',
    token: 'ARB-ETH',
    label: 'Arbitrum',
    rpcUrl: 'https://rpc.ankr.com/arbitrum'
  },
  {
    id: '0xa4ec',
    token: 'ETH',
    label: 'Celo',
    rpcUrl: 'https://1rpc.io/celo'
  },
  {
    id: 666666666,
    token: 'DEGEN',
    label: 'Degen',
    rpcUrl: 'https://rpc.degen.tips'
  },
  {
    id: 2192,
    token: 'SNAX',
    label: 'SNAX Chain',
    rpcUrl: 'https://mainnet.snaxchain.io'
  }
];

const appMetadata = {
  name: 'CryptoPath',
  //icon: '<svg><rect width="100" height="100" fill="#ff6500"/></svg>', // Replace with your actual icon
  description: 'Login to CryptoPath with your wallet',
  recommendedInjectedWallets: [
    { name: 'MetaMask', url: 'https://metamask.io' },
    { name: 'Coinbase', url: 'https://wallet.coinbase.com/' },
  ],
};

const web3Onboard = init({
  wallets,
  chains,
  appMetadata,
});

function LoginPageContent() {
  const router = useRouter();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggedOut, setIsLoggedOut] = useState(false);
  // Wallet state
  const [{ wallet, connecting }, connect, disconnect] = useConnectWallet();
  interface Account {
    address: string;
    ens: string | null;
  }
  const formatWalletAddress = (walletAddress: string) => {
    if (!walletAddress) return "";
    return `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
  };
  const [account, setAccount] = useState<Account | null>(null);

  // Handle wallet connection
  useEffect(() => {
    if (wallet?.provider && !isLoggedOut) { // Chỉ đăng nhập nếu chưa logout
      const { address, ens } = wallet.accounts[0];
      setAccount({
        address,
        ens: ens?.name || null,
      });
      const userData = {
        walletAddress: address,
        name: ens?.name || formatWalletAddress(address), // Sử dụng ENS nếu có, nếu không thì dùng địa chỉ ví rút gọn
      };
      localStorage.setItem('currentUser', JSON.stringify(userData));
      window.location.href = '/';
    }
  }, [wallet, router, isLoggedOut]);

  // Helper functions (using localStorage for demo purposes)
  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.toLowerCase());
  };

  const getUsers = () => {
    if (typeof window !== 'undefined') {
      const usersJSON = localStorage.getItem('users');
      return usersJSON ? JSON.parse(usersJSON) : [];
    }
    return [];
  };

  const isEmailExists = (email: string) => {
    const users = getUsers();
    return users.some((user: { email: string }) => user.email === email);
  };

  const validatePasswordForUser = (email: string, password: string) => {
    const users = getUsers();
    const user = users.find(
      (user: { email: string; password: string }) => user.email === email
    );
    return user && user.password === password;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setEmailError('');
    setPasswordError('');

    let valid = true;

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address.');
      valid = false;
    } else if (!isEmailExists(email)) {
      setEmailError('Email does not exist.');
      valid = false;
    }

    if (valid && !validatePasswordForUser(email, password)) {
      setPasswordError('Incorrect password.');
      valid = false;
    }

    if (valid) {
      // Save the current user to localStorage for use in the header
      const users = getUsers();
      const loggedInUser = users.find(
        (user: { email: string; password: string }) => user.email === email
      );
      localStorage.setItem('currentUser', JSON.stringify(loggedInUser));
      window.location.href = "/";
      window.location.reload();
    }
  };

  const handleWalletConnect = () => {
    if (!wallet) {
      connect(); // Kết nối ví nếu chưa kết nối
    } else {
      disconnect({ label: wallet.label }); // Ngắt kết nối ví
      setAccount(null);
      setIsLoggedOut(true); // Đánh dấu đã logout
      localStorage.removeItem('currentUser');
      router.push('/login'); // Chuyển hướng về trang login
    }
  };

  return (
    <>
      <div className="relative">
        <ParticlesBackground />
        <div className="bg-transparent flex min-h-screen flex-col items-center justify-center p-6 relative z-10">
          <div id="form-container" className="w-full max-w-sm md:max-w-3xl">
            <div className="card bg-transparent rounded-md shadow-lg overflow-hidden">
              <div className="card-content p-6 md:p-10">
                <form onSubmit={handleSubmit}>
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-col items-center text-center">
                      <h1 className="text-2xl font-bold text-white">Welcome back</h1>
                      <p className="text-gray-400">
                        Login to your{' '}
                        <span className="text-[#ff6500] font-bold">CryptoPath</span> account
                      </p>
                    </div>
                    <div className="grid gap-2">
                      <label htmlFor="email" className="text-sm font-medium text-white">
                        Email
                      </label>
                      <input
                        id="email"
                        type="email"
                        placeholder="m@example.com"
                        required
                        className="w-full px-3 py-2 border border-white rounded-md bg-black text-white"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      {emailError && <span className="text-red-500 text-sm">{emailError}</span>}
                    </div>
                    <div className="grid gap-2">
                      <div className="flex items-center">
                        <label htmlFor="password" className="text-sm font-medium text-white">
                          Password
                        </label>
                      </div>
                      <div className="relative">
                        <input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          required
                          className="w-full px-3 py-2 border border-white rounded-md bg-black text-white pr-10"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-white"
                        >
                          {showPassword ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth="1.5"
                              stroke="currentColor"
                              className="w-5 h-5"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5
                                  c4.756 0 8.773-3.162 10.065-7.498a10.523 10.523 0 01-4.293-5.774"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0"
                              />
                            </svg>
                          ) : (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth="1.5"
                              stroke="currentColor"
                              className="w-5 h-5"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5
                                  c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639
                                  C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                          )}
                        </button>
                      </div>
                      {passwordError && (
                        <span className="text-red-500 text-sm">{passwordError}</span>
                      )}
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-white text-black py-2 px-4 rounded-md hover:bg-gray-200"
                    >
                      Login
                    </button>
                    <div className="text-center text-sm">
                      <span className="bg-black px-2 text-gray-400">Or continue with</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {/* Social login buttons (icons only) */}
                      <button className="flex items-center justify-center w-full border border-white rounded-md py-2 px-4 hover:bg-gray-800">
                        {/* Apple icon */}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          className="w-5 h-5 text-white"
                        >
                          <path
                            d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 
                              1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 
                              1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857"
                            fill="currentColor"
                          />
                        </svg>
                        <span className="sr-only">Login with Apple</span>
                      </button>
                      <button
                        id="google-login"
                        className="flex items-center justify-center w-full border border-white rounded-md py-2 px-4 hover:bg-gray-800"
                      >
                        {/* Google icon */}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          className="w-5 h-5 text-white"
                        >
                          <path
                            d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4
                              -4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307
                              C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12
                              c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                            fill="currentColor"
                          />
                        </svg>
                        <span className="sr-only">Login with Google</span>
                      </button>
                      <button
                        id="connectButton"
                        type="button"
                        onClick={handleWalletConnect}
                        disabled={connecting}
                        className="flex items-center justify-center w-full border border-white rounded-md py-2 px-4 hover:bg-gray-800"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          className="w-5 h-5 text-white"
                        >
                          <path
                            d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12
                              m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9
                              m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25
                              A2.25 2.25 0 0 0 3 6v3"
                            fill="currentColor"
                          />
                        </svg>
                        <span className="sr-only">Login with Wallet</span>
                      </button>
                    </div>
                    <div className="text-center text-sm text-white">
                      Don't have an account?{' '}
                      <Link href="/signup" className="text-white underline ml-1">
                        Sign up
                      </Link>
                    </div>
                  </div>
                </form>
              </div>
            </div>
            <div className="mt-6 text-center text-xs text-gray-400">
              By clicking continue, you agree to our{' '}
              <a href="#" className="underline text-white">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="underline text-white">
                Privacy Policy
              </a>.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Web3OnboardProvider web3Onboard={web3Onboard}>
      <LoginPageContent />
    </Web3OnboardProvider>
  );
}