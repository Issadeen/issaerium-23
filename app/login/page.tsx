"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation'; // Use this for client-side navigation in Next.js 13 App Directory
import Link from 'next/link';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import Cookies from 'js-cookie';
import ErrorModal from './ErrorModal'; // Ensure this path is correct

const firebaseApp = initializeApp({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
});


const auth = getAuth(firebaseApp);

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSigningIn(true);
    setError(null);
    const auth = getAuth();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();
      Cookies.set('token', idToken, { expires: 1 }); // Set token in cookies for 1 day
      router.push('/dashboard');
    } catch (error) {
      console.error('Error signing in:', error);
      setError('Failed to sign in. Please check your email and password.');
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-gray-100">
      <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-[300px] space-y-6">
          <div className="text-center">
            <svg height="40" aria-hidden="true" viewBox="0 0 16 16" version="1.1" width="40" data-view-component="true" className="mx-auto fill-white">
              <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path>
            </svg>
            <h2 className="mt-4 text-center text-xl font-bold text-white">Sign in to Issaerium-23</h2>
          </div>
          <form onSubmit={handleSubmit} className="bg-gray-800 rounded-md p-4 space-y-4 shadow-2xl"> 
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2 text-white">
                Username or email address
              </label>
              <input
                id="email"
                name="email"
                type="text"
                required
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="password" className="block text-sm font-medium text-white">
                  Password
                </label>
                <Link href="/forgot-password" className="text-sm text-blue-400 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 px-4 bg-green-500 hover:bg-green-600 text-white rounded-md font-medium transition-colors duration-300"
              disabled={isSigningIn}
            >
              {isSigningIn ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
          <div className="bg-gray-700 rounded-md p-4 text-center text-sm shadow-md">
            <div className="text-white">
              New to Issaerium-23?{' '}
              <Link href="/create-account" className="text-blue-400 hover:underline">
                Create an account
              </Link>
              .
            </div>
          </div>
        </div>
      </main>
      <footer className="py-6 text-center text-xs text-gray-400 space-x-4">
        <Link href="#" className="hover:text-blue-400">Terms</Link>
        <Link href="#" className="hover:text-blue-400">Privacy</Link>
        <Link href="#" className="hover:text-blue-400">Docs</Link>
        <Link href="#" className="hover:text-blue-400">Contact Issaerium-23 Support</Link>
        <Link href="#" className="hover:text-blue-400">Manage cookies</Link>
        <Link href="#" className="hover:text-blue-400">Do not share my personal information</Link>
      </footer>
      {error && <ErrorModal message={error} onClose={() => setError(null)} />}
    </div>
  );
};

export default LoginPage;