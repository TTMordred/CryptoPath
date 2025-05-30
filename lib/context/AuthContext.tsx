'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/src/integrations/supabase/client';
import bcrypt from 'bcryptjs'; // Import bcryptjs

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signUp: (email: string, password: string, meta?: any) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithWalletConnect: (address: string) => Promise<any>;
  checkSession: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Function to hash a password using bcrypt
const hashPassword = (password: string): string => {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check active session and set user
    const checkSession = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        setSession(data.session);
        setUser(data.session?.user || null);

        // Update localStorage if user is logged in
        if (data.session?.user) {
          const currentUser = {
            id: data.session.user.id,
            email: data.session.user.email,
            name: data.session.user.user_metadata?.full_name || data.session.user.email?.split('@')[0],
            isLoggedIn: true,
            settingsKey: `settings_${data.session.user.email}`,
          };
          localStorage.setItem('currentUser', JSON.stringify(currentUser));
        }
      } catch (error) {
        console.error('Error checking auth session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user || null);

      // Update localStorage based on session state
      if (session?.user) {
        const currentUser = {
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
          isLoggedIn: true,
          settingsKey: `settings_${session.user.email}`,
        };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('currentUser');
      }

      setIsLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Sign up a new user
  const signUp = async (email: string, password: string, meta?: any) => {
    try {
      const hashedPassword = hashPassword(password); // Hash password before sign-up
      const { data, error } = await supabase.auth.signUp({
        email,
        password: hashedPassword,
        options: {
          data: {
            ...meta,
            auth_provider: 'email',
          },
        },
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  // Sign in a user
  const signIn = async (email: string, password: string) => {
    try {
      const hashedPassword = hashPassword(password); // Hash the password before signing in
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: hashedPassword, // Use the hashed password
      });

      if (error) throw error;

      // Update auth provider in profiles table
      if (data.user) {
        await supabase
          .from('profiles')
          .update({ auth_provider: 'email' })
          .eq('id', data.user.id);
      }

      return data;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;

      // Note: We'll update the auth_provider in profiles after the OAuth callback
      // This happens automatically through Supabase's auth state change listener
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  // Sign in with Wallet Connect - Modified to use a valid email format
  const signInWithWalletConnect = async (address: string) => {
    try {
      if (!address) {
        throw new Error('Wallet address is required');
      }

      // For wallet authentication, use a valid email format
      const normalizedAddress = address.toLowerCase();
      const validEmail = `wallet_${normalizedAddress.replace('0x', '')}@cryptopath.com`;
      const password = `${normalizedAddress}-secure-pass`;

      console.log('Attempting to authenticate with wallet address:', address);
      console.log('Using valid email format:', validEmail);

      // Try to sign in with existing account
      try {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: validEmail,
          password,
        });

        if (!signInError) {
          console.log('Successfully signed in with wallet address');

          // Update the profile with wallet address if needed
          if (signInData.user) {
            const displayName = `Wallet ${address.slice(0, 6)}...${address.slice(-4)}`;

            await supabase
              .from('profiles')
              .update({
                wallet_address: address,
                auth_provider: 'wallet',
                display_name: displayName,
              })
              .eq('id', signInData.user.id);

            // Store user data for frontend usage
            const userData = {
              id: signInData.user.id,
              email: validEmail,
              name: displayName,
              walletAddress: address,
            };

            localStorage.setItem('currentUser', JSON.stringify(userData));

            const currentUser = {
              id: signInData.user.id,
              email: validEmail,
              name: displayName,
            };

            window.dispatchEvent(new CustomEvent('userUpdated', { detail: currentUser }));
          }

          return signInData;
        }

        console.log('Sign in failed, creating new user', signInError);
      } catch (signInErr) {
        console.error('Error during wallet sign in attempt:', signInErr);
        // Continue to signup if signin fails
      }

      // Create a new user with the wallet address
      console.log('Creating new user with wallet');
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: validEmail,
        password,
        options: {
          data: {
            wallet_address: address,
            auth_provider: 'wallet',
          },
        },
      });

      if (signUpError) {
        console.error('Error creating wallet user:', signUpError);
        throw signUpError;
      }

      console.log('Successfully created wallet user');

      // Update the profile with wallet address and display name
      if (signUpData.user) {
        const displayName = `Wallet ${address.slice(0, 6)}...${address.slice(-4)}`;

        await supabase
          .from('profiles')
          .update({
            wallet_address: address,
            auth_provider: 'wallet',
            display_name: displayName,
          })
          .eq('id', signUpData.user.id);

        // Store user data for frontend usage
        const userData = {
          id: signUpData.user.id,
          email: validEmail,
          name: displayName,
          walletAddress: address,
        };

        localStorage.setItem('currentUser', JSON.stringify(userData));
      }

      return signUpData;
    } catch (error) {
      console.error('Error signing in with wallet:', error);
      throw error;
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Clear any local storage used for authentication
      localStorage.removeItem('currentUser');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  // Check if user has active session
  const checkSession = async (): Promise<boolean> => {
    try {
      const { data } = await supabase.auth.getSession();
      return !!data.session;
    } catch (error) {
      console.error('Error checking session:', error);
      return false;
    }
  };

  const value = {
    user,
    session,
    isLoading,
    signUp,
    signIn,
    signOut,
    signInWithGoogle,
    signInWithWalletConnect,
    checkSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};