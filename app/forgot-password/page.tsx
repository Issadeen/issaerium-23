"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import ErrorModal from './ErrorModal';

const PasswordResetPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [workId, setWorkId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingEmail(true);
    setErrorMessage('');
    setSuccessMessage('');

    // Validate work ID
    if (!validateWorkId(email, workId)) {
      setErrorMessage('Work ID does not match the email address.');
      setIsSendingEmail(false);
      return;
    }

    try {
      const auth = getAuth();
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage('Password reset email sent successfully.');
    } catch (error: any) {
      console.error('Error sending password reset email:', error);
      setErrorMessage(error.message);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const validateWorkId = (email: string, workId: string): boolean => {
    // Example validation logic: check if work ID is part of the email address
    return email.includes(workId);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-[350px] space-y-6">
          <div className="text-center">
            <svg height="40" aria-hidden="true" viewBox="0 0 16 16" version="1.1" width="40" data-view-component="true" className="mx-auto fill-white">
              <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path>
            </svg>
            <h2 className="mt-4 text-center text-xl font-bold">Reset Your Password</h2>
          </div>
          {successMessage && (
            <div className="bg-green-500 text-white p-2 rounded-md text-center">
              {successMessage}
            </div>
          )}
          <form id="password-reset-form" className="bg-gray-800 rounded-md p-4 space-y-4 shadow-lg shadow-gray-700" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="workId" className="block text-sm font-medium mb-2">Work ID</label>
              <input
                id="workId"
                name="workId"
                type="text"
                required
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                value={workId}
                onChange={(e) => setWorkId(e.target.value)}
              />
            </div>
            <button
              type="submit"
              id="reset-password-button"
              className="w-full py-2 px-4 bg-green-500 hover:bg-green-600 text-white rounded-md font-medium transition-colors duration-300"
              disabled={isSendingEmail}
            >
              {isSendingEmail ? 'Sending Email...' : 'Send Password Reset Email'}
            </button>
          </form>
          <div className="bg-gray-700 rounded-md p-4 text-center text-sm shadow-md shadow-gray-500 relative overflow-hidden">
            <div className="absolute inset-0 animate-comet z-0"></div>
            <div className="relative z-10">
              Remembered your password? <Link href="/login" className="text-blue-400 hover:underline">Sign in</Link>.
            </div>
          </div>
        </div>
      </main>
      <footer className="py-6 text-center text-xs text-gray-500 space-x-4">
        <Link href="#" className="hover:text-blue-600 dark:hover:text-blue-400">Terms</Link>
        <Link href="#" className="hover:text-blue-600 dark:hover:text-blue-400">Privacy</Link>
        <Link href="#" className="hover:text-blue-600 dark:hover:text-blue-400">Docs</Link>
        <Link href="#" className="hover:text-blue-600 dark:hover:text-blue-400">Contact Issaerium-23 Support</Link>
        <Link href="#" className="hover:text-blue-600 dark:hover:text-blue-400">Status</Link>
      </footer>
      {errorMessage && (
        <ErrorModal message={errorMessage} onClose={() => setErrorMessage('')} />
      )}
    </div>
  );
};

export default PasswordResetPage;