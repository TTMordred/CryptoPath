'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ParticlesBackground from '@/components/ParticlesBackground';
import toast from 'react-hot-toast';
import { supabase } from '@/src/integrations/supabase/client';
import { Web3OnboardProvider, init, useConnectWallet } from '@web3-onboard/react';
import injectedModule from '@web3-onboard/injected-wallets';
import walletConnectModule from '@web3-onboard/walletconnect';
import coinbaseModule from '@web3-onboard/coinbase';
import infinityWalletModule from '@web3-onboard/infinity-wallet';
import safeModule from '@web3-onboard/gnosis';
import trezorModule from '@web3-onboard/trezor';
import magicModule from '@web3-onboard/magic';
import dcentModule from '@web3-onboard/dcent';
import sequenceModule from '@web3-onboard/sequence';
import tahoModule from '@web3-onboard/taho';
import trustModule from '@web3-onboard/trust';
import okxModule from '@web3-onboard/okx';
import frontierModule from '@web3-onboard/frontier';
import { useAuth } from '@/lib/context/AuthContext';
import { useSettings } from '@/components/context/SettingsContext';

interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  auth_provider: string | null;
  profile_image: string | null;
  background_image: string | null;
  wallets: { address: string; is_default: boolean }[] | null;
}

interface Account {
  address: `0x${string}`;
  ens: string | null;
}

const INFURA_KEY = '7d389678fba04ceb9510b2be4fff5129';
const walletConnect = walletConnectModule({
  projectId: 'b773e42585868b9b143bb0f1664670f1',
  optionalChains: [1, 137],
});

const wallets = [
  infinityWalletModule(),
  sequenceModule(),
  injectedModule(),
  trustModule(),
  okxModule(),
  frontierModule(),
  tahoModule(),
  coinbaseModule(),
  dcentModule(),
  walletConnect,
  safeModule(),
  magicModule({ apiKey: 'pk_live_E9B0C0916678868E' }),
  trezorModule({ email: 'test@test.com', appUrl: 'https://www.blocknative.com' }),
];

const chains = [
  { id: '0x1', token: 'ETH', label: 'Ethereum Mainnet', rpcUrl: `https://mainnet.infura.io/v3/${INFURA_KEY}` },
  { id: '11155111', token: 'ETH', label: 'Sepolia', rpcUrl: 'https://rpc.sepolia.org/' },
  { id: '0x13881', token: 'MATIC', label: 'Polygon - Mumbai', rpcUrl: 'https://matic-mumbai.chainstacklabs.com' },
  { id: '0x38', token: 'BNB', label: 'Binance', rpcUrl: 'https://bsc-dataseed.binance.org/' },
  { id: '0xA', token: 'OETH', label: 'OP Mainnet', rpcUrl: 'https://mainnet.optimism.io' },
  { id: '0xA4B1', token: 'ARB-ETH', label: 'Arbitrum', rpcUrl: 'https://rpc.ankr.com/arbitrum' },
  { id: '0xa4ec', token: 'ETH', label: 'Celo', rpcUrl: 'https://1rpc.io/celo' },
  { id: '666666666', token: 'DEGEN', label: 'Degen', rpcUrl: 'https://rpc.degen.tips' },
  { id: '2192', token: 'SNAX', label: 'SNAX Chain', rpcUrl: 'https://mainnet.snaxchain.io' },
];

const appMetadata = {
  name: 'CryptoPath',
  description: 'Login to CryptoPath with your wallet',
  recommendedInjectedWallets: [
    { name: 'MetaMask', url: 'https://metamask.io' },
    { name: 'Coinbase', url: 'https://wallet.coinbase.com/' },
  ],
};

const web3Onboard = init({ wallets, chains, appMetadata });

const debounce = <T extends (...args: any[]) => void>(func: T, wait: number) => {
  let timeout: NodeJS.Timeout | undefined;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

function LoginPageContent() {
  const router = useRouter();
  const { signInWithWalletConnect } = useAuth();
  const { updateProfile, addWallet, syncWithSupabase } = useSettings();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [emailError, setEmailError] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [{ wallet, connecting }, connect, disconnect] = useConnectWallet();
  const [isLoggedOut, setIsLoggedOut] = useState<boolean>(false);
  const [account, setAccount] = useState<Account | null>(null);

  const formatWalletAddress = (walletAddress: string): string => {
    if (!walletAddress) return '';
    return `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
  };

  useEffect(() => {
    const checkExistingSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) router.push('/');
    };
    checkExistingSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) router.push('/');
      else if (event === 'SIGNED_OUT') setIsLoggedOut(true);
    });

    return () => subscription.unsubscribe();
  }, [router]);

  useEffect(() => {
    if (wallet?.provider && !isLoggedOut) {
      const { address, ens } = wallet.accounts[0];
      setAccount({ address, ens: ens?.name || null });
  
      const authenticateWithWallet = async () => {
        try {
          setIsLoading(true);
  
          // Kiểm tra xem địa chỉ ví đã tồn tại trong Supabase chưa
          const { data: existingProfile, error: profileError } = await supabase
            .from('profiles')
            .select('id, username, wallets')
            .eq('wallets->>address', address)
            .single();
  
          if (profileError && profileError.code !== 'PGRST116') {
            throw new Error(); // Bỏ message
          }
  
          if (existingProfile) {
            // Nếu tìm thấy profile với địa chỉ ví này
            const { data, error } = await signInWithWalletConnect(address);
            if (error) throw new Error(); // Bỏ message
            if (!data || !data.session) throw new Error(); // Bỏ message
  
            updateProfile({
              username: existingProfile.username || formatWalletAddress(address),
              profileImage: null,
              backgroundImage: null,
            });
            addWallet(address);
            await syncWithSupabase();
  
            toast.success('Logged in with existing wallet!');
          } else {
            // Nếu không tìm thấy, tạo tài khoản mới
            const { data, error } = await signInWithWalletConnect(address);
            if (error) throw new Error(); // Bỏ message
            if (!data || !data.session) throw new Error(); // Bỏ message
  
            const newUsername = ens?.name || formatWalletAddress(address);
  
            updateProfile({
              username: newUsername,
              profileImage: null,
              backgroundImage: null,
            });
            addWallet(address);
            await syncWithSupabase();
  
            const { error: upsertError } = await supabase
              .from('profiles')
              .upsert({
                id: data.session.user.id,
                username: newUsername,
                wallets: [{ address, is_default: true }],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
  
            if (upsertError) throw new Error(); // Bỏ message
  
            toast.success('New account created with wallet!'); // Giữ thông báo thành công
          }
  
          router.push('/');
          setTimeout(() => {
            window.location.reload();
          }, 500);
        } catch (error: unknown) {
          console.error('Wallet authentication error:', error); // Giữ log
          // Bỏ toast.error
        } finally {
          setIsLoading(false);
        }
      };
  
      authenticateWithWallet();
    }
  }, [wallet, router, isLoggedOut, signInWithWalletConnect, updateProfile, addWallet, syncWithSupabase]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setEmailError('');
    setPasswordError('');
    setIsLoading(true);

    try {
      if (!email) {
        setEmailError('Please enter your email');
        toast.error('Please enter your email');
        setIsLoading(false);
        return;
      }

      if (!password) {
        setPasswordError('Please enter your password');
        toast.error('Please enter your password');
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Invalid email or password');
          setEmailError('Invalid email or password');
          setPasswordError('Invalid email or password');
        } else {
          toast.error(error.message);
          setEmailError(error.message);
        }
        setIsLoading(false);
        return;
      }

      if (!data.user || !data.session) {
        toast.error('Login failed: No user data returned.');
        setIsLoading(false);
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        toast.error('Failed to load profile data.');
        setIsLoading(false);
        return;
      }

      updateProfile({
        username: profileData.username || email.split('@')[0],
        profileImage: profileData.profile_image || null,
        backgroundImage: profileData.background_image || null,
      });
      await syncWithSupabase();

      toast.success('Login successful!');
      setTimeout(() => router.push('/'), 2000);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Login error:', error);
      toast.error(`An unexpected error occurred: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWalletConnect = debounce(async () => {
    if (!wallet) {
      await connect();
    } else {
      await disconnect({ label: wallet.label });
      setAccount(null);
      setIsLoggedOut(true);
      await supabase.auth.signOut();
      router.push('/login');
    }
  }, 3000);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/` },
      });
      if (error) throw error;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Google login error:', error);
      toast.error(`Google login failed: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="relative">
        <ParticlesBackground />
        <div className="bg-transparent flex min-h-screen flex-col items-center justify-center p-6 relative z-10">
          <div id="form-container" className="w-full max-w-sm md:max-w-3xl">
            <div className="card bg-transparent rounded-md shadow-lg overflow-hidden">
              <div className="card-content p-6 md:p-10 bg-white/5 rounded-[20px] backdrop-blur-sm">
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
                      <label htmlFor="email" className="text-sm font-medium text-white">Email</label>
                      <input
                        id="email"
                        type="email"
                        placeholder="m@example.com"
                        required
                        className="w-full px-3 py-2 border rounded-[20px] bg-black text-white"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                      />
                      {emailError && <span className="text-red-500 text-sm">{emailError}</span>}
                    </div>
                    <div className="grid gap-2">
                      <label htmlFor="password" className="text-sm font-medium text-white">Password</label>
                      <div className="relative">
                        <input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          required
                          className="w-full px-3 py-2 border rounded-[20px] bg-black text-white pr-10"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          disabled={isLoading}
                        >
                          {showPassword ? (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c4.756 0 8.773-3.162 10.065-7.498a10.523 10.523 0 01-4.293-5.774" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          )}
                        </button>
                      </div>
                      {passwordError && <span className="text-red-500 text-sm">{passwordError}</span>}
                    </div>
                    <button
                      type="submit"
                      className={`w-full bg-white text-black py-2 px-4 border rounded-[20px] hover:bg-gray-200 ${isLoading ? '' : ''}`}
                      disabled={isLoading}
                    >
                      Login
                    </button>
                    <div className="text-center text-sm">
                      <span className="bg-black px-2 text-gray-400">Or continue with</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        id="google-login"
                        className="flex items-center justify-center w-full border rounded-[20px] py-2 px-4 hover: transition-transform duration-200 hover:-translate-y-1"
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          className="w-5 h-5 text-white"
                        >
                          <path
                            d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                            fill="currentColor"
                          />
                        </svg>
                        <span className="sr-only">Login with Google</span>
                      </button>
                      <button
                        id="connectButton"
                        type="button"
                        onClick={handleWalletConnect}
                        disabled={connecting || isLoading}
                        className="flex items-center justify-center w-full border rounded-[20px] py-2 px-4 hover: transition-transform duration-200 hover:-translate-y-1"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          className="w-5 h-5 text-white"
                        >
                          <path
                            d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3"
                            fill="currentColor"
                          />
                        </svg>
                        <span className="sr-only">Login with Wallet</span>
                      </button>
                    </div>
                    <div className="text-center text-sm text-white">
                      Don't have an account?{' '}
                      <Link href="/signup" className="text-white underline ml-1">Sign up</Link>
                    </div>
                  </div>
                </form>
              </div>
            </div>
            <div className="mt-6 text-center text-xs text-gray-400">
              By clicking continue, you agree to our{' '}
              <a href="#" className="underline text-white">Terms of Service</a>{' '}
              and{' '}
              <a href="#" className="underline text-white">Privacy Policy</a>.
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