'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ParticlesBackground from '@/components/ParticlesBackground';

export default function SignupPage() {
  const router = useRouter();

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  

  // Helper functions: using localStorage to store users (as in your original code)
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

  const saveUser = (user: { name: string; email: string; password: string }) => {
    const users = getUsers();
    users.push(user);
    localStorage.setItem('users', JSON.stringify(users));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Reset error messages
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');

    let valid = true;

    if (!name.trim()) {
      setNameError('Please enter your full name.');
      valid = false;
    }
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address.');
      valid = false;
    } else if (isEmailExists(email)) {
      setEmailError('Email already exists.');
      valid = false;
    }
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters long.');
      valid = false;
    }
    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match.');
      valid = false;
    }

    if (valid) {
      const newUser = {
        name: name.trim(),
        email: email.trim(),
        password: password,
      };
      saveUser(newUser);
      alert('Sign up successful!');
      router.push('/login'); // or redirect to login if you prefer
    }
  };

  return (
    <>
      <div className = "relative">
        <ParticlesBackground/>
      {/* Signup Form */}
      <div className="bg-transparent flex min-h-screen flex-col items-center justify-center p-6 relative z-10">
        <div id="form-container" className="w-full max-w-sm md:max-w-3xl">
          <div className="card bg-transparent rounded-md shadow-lg overflow-hidden">
            <div className="card-content">
              <div className="form-container p-6 md:p-10">
                <form onSubmit={handleSubmit}>
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-col items-center text-center">
                      <h1 className="text-2xl font-bold text-white">Create an account</h1>
                      <p className="text-gray-400">
                        Sign up for your{' '}
                        <span className="text-[#ff6500] font-bold">CryptoPath</span> account
                      </p>
                    </div>
                    <div className="grid gap-2">
                      <label htmlFor="name" className="text-sm font-medium text-white">
                        Full Name
                      </label>
                      <input
                        id="name"
                        type="text"
                        placeholder="John Doe"
                        required
                        className="w-full px-3 py-2 border border-white bg-black text-white rounded-md"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                      {nameError && <span className="text-red-500 text-sm">{nameError}</span>}
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
                        className="w-full px-3 py-2 border border-white bg-black text-white rounded-md"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      {emailError && <span className="text-red-500 text-sm">{emailError}</span>}
                    </div>
                    <div className="grid gap-2">
                      <label htmlFor="password" className="text-sm font-medium text-white">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          required
                          className="w-full px-3 py-2 border border-white bg-black text-white rounded-md pr-10"
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
                      {passwordError && <span className="text-red-500 text-sm">{passwordError}</span>}
                    </div>
                    <div className="grid gap-2">
                      <label htmlFor="confirm-password" className="text-sm font-medium text-white">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <input
                          id="confirm-password"
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          className="w-full px-3 py-2 border border-white bg-black text-white rounded-md pr-10"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-white"
                        >
                          {showConfirmPassword ? (
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
                      {confirmPasswordError && (
                        <span className="text-red-500 text-sm">{confirmPasswordError}</span>
                      )}
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-white text-black py-2 px-4 rounded-md hover:bg-gray-200"
                    >
                      Sign Up
                    </button>
                    <div className="text-center text-sm text-white">
                      Already have an account?{' '}
                      <Link href="/login" className="text-white underline ml-1">
                        Log in
                      </Link>
                    </div>
                  </div>
                </form>
              </div>
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
