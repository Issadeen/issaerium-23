'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowUp } from 'lucide-react';
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { auth } from '../firebaseConfig'; // Import initialized Firebase services
import { signOut, onAuthStateChanged } from 'firebase/auth';

export default function WorkDetailsPage() {
    const [profilePic, setProfilePic] = useState<string | null>(null);
    const [showScrollToTop, setShowScrollToTop] = useState(false);
    const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, user => {
            if (user) {
                setProfilePic(user.photoURL);
            } else {
                router.push('/login');
            }
        });
        return () => unsubscribe();
    }, [router]);

    useEffect(() => {
        const handleActivity = () => {
            if (inactivityTimeoutRef.current) {
                clearTimeout(inactivityTimeoutRef.current);
            }
            inactivityTimeoutRef.current = setTimeout(() => {
                signOut(auth).then(() => {
                    router.push('/login');
                });
            }, 7 * 60 * 1000); // 7 minutes
        };

        window.addEventListener('mousemove', handleActivity);
        window.addEventListener('keydown', handleActivity);

        handleActivity(); // Initialize the timeout

        return () => {
            window.removeEventListener('mousemove', handleActivity);
            window.removeEventListener('keydown', handleActivity);
            if (inactivityTimeoutRef.current) {
                clearTimeout(inactivityTimeoutRef.current);
            }
        };
    }, [router]);

    const handleLogout = async () => {
        await signOut(auth);
        router.push('/login');
    };

    const handleScrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center">
            <header className="sticky top-0 z-20 border-b border-gray-800 bg-gray-900/70 backdrop-blur-md supports-[backdrop-filter]:bg-gray-900/60 w-full">
                <div className="container flex h-16 items-center justify-between mx-auto px-4">
                    <div className="flex items-center space-x-4">
                        <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-200" onClick={() => router.push('/dashboard')}>
                            <ArrowLeft className="h-5 w-5" />
                            <span className="sr-only">Back</span>
                        </Button>
                        <h1 className="text-xl font-bold">Work Details</h1>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Button variant="ghost" size="md" className="text-gray-400 hover:text-gray-300" onClick={handleLogout}>
                            Logout
                        </Button>
                        <Button variant="ghost" size="md" className="text-blue-400 hover:text-blue-200">
                            <Avatar>
                                <AvatarImage src={profilePic || "https://github.com/shadcn.png"} alt="Profile Picture" />
                                <AvatarFallback>CN</AvatarFallback>
                            </Avatar>
                        </Button>
                    </div>
                </div>
            </header>
            <main className="container py-6 mx-auto px-4 flex-grow">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-200">Entry Details</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs text-gray-400">
                            <p>View and manage Entries.</p>
                            <div className="mt-4 space-y-2">
                                <Button size="sm" variant="primary" className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={() => router.push('/add-entries')}>
                                    Add Entries
                                </Button>
                                <Button size="sm" variant="primary" className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={() => router.push('/view-manage-entries.html')}>
                                    View and Manage Entries
                                </Button>
                                <Button size="sm" variant="primary" className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={() => router.push('/view-manage-orders.html')}>
                                    View and Manage Orders
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-200">Invoices</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs text-gray-400">
                            <p>View and manage Invoices & Expenses.</p>
                            <div className="mt-4 space-y-2">
                                <Button size="sm" variant="primary" className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={() => router.push('/add-invoices')}>
                                    Add Invoices
                                </Button>
                                <Button size="sm" variant="primary" className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={() => router.push('/view-invoices')}>
                                    View Invoices
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-200">Reports</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs text-gray-400">
                            <p>View and generate reports.</p>
                            <div className="mt-4 space-y-2">
                                <Button size="sm" variant="primary" className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={() => router.push('/view-expenses')}>
                                    View Expenses
                                </Button>
                                <Button size="sm" variant="primary" className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={() => router.push('/tracker')}>
                                    Tracker
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
            {showScrollToTop && (
                <button
                    onClick={handleScrollToTop}
                    className="fixed bottom-4 right-4 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300"
                >
                    <ArrowUp className="h-5 w-5" />
                </button>
            )}
        </div>
    );
}