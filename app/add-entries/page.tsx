"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '../firebaseConfig'; // Import initialized Firebase services
import { getAuth, onAuthStateChanged, signOut, User } from 'firebase/auth';
import { getDatabase, ref, push, query, orderByChild, equalTo, get, set } from 'firebase/database';
import { Button } from "../components/ui/button";
import Input from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { ChevronLeft } from 'lucide-react';

export default function AddEntriesPage() {
  const [tr800Number, setTr800Number] = useState('');
  const [tr800Quantity, setTr800Quantity] = useState('');
  const [product, setProduct] = useState('');
  const [destination, setDestination] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (!user) {
        router.push('/login');
      } else {
        setUser(user);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    const db = getDatabase();
    const tr800Ref = ref(db, 'tr800');
    const tr800Query = query(tr800Ref, orderByChild('number'), equalTo(tr800Number));

    try {
      const snapshot = await get(tr800Query);
      if (snapshot.exists()) {
        setErrorMessage('TR800 number already exists.');
        setIsSubmitting(false);
        return;
      }

      const tr800QuantityFloat = parseFloat(tr800Quantity);
      const newEntryRef = push(tr800Ref);
      await set(newEntryRef, {
        number: tr800Number,
        initialQuantity: tr800QuantityFloat,
        remainingQuantity: tr800QuantityFloat,
        product: product.toLowerCase(),
        destination: destination.toLowerCase(),
        product_destination: `${product.toLowerCase()}_${destination.toLowerCase()}`,
        timestamp: Date.now()
      });

      if (destination.toLowerCase() === 'ssd') {
        const allocationsRef = ref(db, 'allocations');
        const allocationDataRef = push(allocationsRef);
        await set(allocationDataRef, {
          number: tr800Number,
          initialQuantity: tr800QuantityFloat,
          remainingQuantity: tr800QuantityFloat,
          product: product.toLowerCase(),
          destination: destination.toLowerCase(),
          product_destination: `${product.toLowerCase()}_${destination.toLowerCase()}`,
          timestamp: Date.now()
        });
      }

      setSuccessMessage('TR800 entry added successfully.');
      setTr800Number('');
      setTr800Quantity('');
      setProduct('');
      setDestination('');

      // Clear the success message after 2 seconds
      setTimeout(() => setSuccessMessage(''), 2000);
    } catch (error) {
      setErrorMessage('An error occurred while adding the entry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center">
      <header className="sticky top-0 z-20 border-b border-gray-800 bg-gray-900/70 backdrop-blur-md supports-[backdrop-filter]:bg-gray-900/60 w-full">
        <div className="container flex h-16 items-center justify-between mx-auto px-4">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-100" onClick={() => router.back()}>
              <span className="sr-only">Back</span>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Add Mother Entries (TR800)</h1>
          </div>
          <nav className="flex space-x-4">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-100" onClick={() => router.push('/view-manage-entries.html')}>
              Entries
            </Button>
            {user && (
              <img
                src={user.photoURL ?? ''}
                alt="Profile"
                className="h-10 w-10 rounded-full border-2 border-gray-600"
              />
            )}
          </nav>
        </div>
      </header>
      <main className="container py-6 mx-auto px-4 flex-grow">
        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300 w-full max-w-lg mx-auto">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">Add TR800 Entry</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-gray-400">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="tr800Number" className="block text-sm font-medium mb-2">TR800 Number</label>
                <Input
                  id="tr800Number"
                  name="tr800Number"
                  type="text"
                  required
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  value={tr800Number}
                  onChange={(e) => setTr800Number(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="tr800Quantity" className="block text-sm font-medium mb-2">TR800 Quantity</label>
                <Input
                  id="tr800Quantity"
                  name="tr800Quantity"
                  type="number"
                  required
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  value={tr800Quantity}
                  onChange={(e) => setTr800Quantity(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="product" className="block text-sm font-medium mb-2">Product</label>
                <Input
                  id="product"
                  name="product"
                  type="text"
                  required
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  value={product}
                  onChange={(e) => setProduct(e.target.value.toLowerCase())}
                />
              </div>
              <div>
                <label htmlFor="destination" className="block text-sm font-medium mb-2">Destination</label>
                <Input
                  id="destination"
                  name="destination"
                  type="text"
                  required
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value.toLowerCase())}
                />
              </div>
              <Button type="submit" variant="primary" className="w-full py-2 px-4 bg-green-500 hover:bg-green-600 text-white rounded-md font-medium transition-colors duration-300" disabled={isSubmitting}>
                {isSubmitting ? 'Adding TR800...' : 'Add TR800'}
              </Button>
            </form>
            {errorMessage && (
              <div className="mt-4 text-red-500 text-sm">{errorMessage}</div>
            )}
            {successMessage && (
              <div className="mt-4 text-green-500 text-sm">{successMessage}</div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
