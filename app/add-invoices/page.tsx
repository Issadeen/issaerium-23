'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, LogOut } from 'lucide-react';
import { Button } from "../components/ui/button";
import Input from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push } from 'firebase/database';
import { getAuth, onAuthStateChanged, signOut, User } from 'firebase/auth';


const firebaseApp = initializeApp({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
});

const database = getDatabase(firebaseApp);
const auth = getAuth(firebaseApp);

export default function AddInvoices() {
    const [user, setUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        date: '',
        owner: '',
        deport: '',
        truckNo: '',
        pms: '',
        ago: '',
        at20: '',
        price: '',
        amount: '',
        expenses: '',
        payments: '',
        paymentDate: '',
        transport: '',
        balance: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUser(user);
            } else if (typeof window !== 'undefined') {
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
                handleLogout();
            }, 7 * 60 * 1000); // 7 minutes
        };

        window.addEventListener('mousemove', handleActivity);
        window.addEventListener('keydown', handleActivity);

        return () => {
            window.removeEventListener('mousemove', handleActivity);
            window.removeEventListener('keydown', handleActivity);
            if (inactivityTimeoutRef.current) {
                clearTimeout(inactivityTimeoutRef.current);
            }
        };
    }, []);

    const handleLogout = () => {
        signOut(auth).then(() => {
            router.push('/sign-in');
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value
        }));
    };

    const validateForm = () => {
        const datePattern = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
        const numberPattern = /^\d*\.?\d*$/;

        if (!formData.date || !datePattern.test(formData.date)) {
            alert('Please enter a valid date in the format dd/mm/yyyy.');
            return false;
        }
        if (!formData.owner) {
            alert('Please enter the owner.');
            return false;
        }
        if (!formData.deport) {
            alert('Please enter the deport.');
            return false;
        }
        if (!formData.truckNo) {
            alert('Please enter the truck number.');
            return false;
        }
        if (!formData.at20 || !numberPattern.test(formData.at20)) {
            alert('Please enter a valid number for AT 20.');
            return false;
        }
        if (!formData.price || !numberPattern.test(formData.price)) {
            alert('Please enter a valid number for price.');
            return false;
        }
        if (formData.pms && !numberPattern.test(formData.pms)) {
            alert('Please enter a valid number for PMS.');
            return false;
        }
        if (formData.ago && !numberPattern.test(formData.ago)) {
            alert('Please enter a valid number for AGO.');
            return false;
        }
        if (formData.expenses && !numberPattern.test(formData.expenses)) {
            alert('Please enter a valid number for expenses.');
            return false;
        }
        if (formData.payments && !numberPattern.test(formData.payments)) {
            alert('Please enter a valid number for payments.');
            return false;
        }
        if (formData.paymentDate && !datePattern.test(formData.paymentDate)) {
            alert('Please enter a valid payment date in the format dd/mm/yyyy.');
            return false;
        }
        if (formData.transport && !numberPattern.test(formData.transport)) {
            alert('Please enter a valid number for transport.');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!validateForm()) {
            return;
        }
        setIsLoading(true);

        try {
            await push(ref(database, 'data'), formData);
            setFormData({
                date: '',
                owner: '',
                deport: '',
                truckNo: '',
                pms: '',
                ago: '',
                at20: '',
                price: '',
                amount: '',
                expenses: '',
                payments: '',
                paymentDate: '',
                transport: '',
                balance: ''
            });
            alert('Data saved successfully!');
        } catch (error) {
            alert('Data could not be saved.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const calculateAmount = () => {
            const at20 = parseFloat(formData.at20) || 0;
            const price = parseFloat(formData.price) || 0;
            setFormData((prevData) => ({
                ...prevData,
                amount: (at20 * price).toFixed(2)
            }));
        };

        const calculateBalance = () => {
            const payments = parseFloat(formData.payments) || 0;
            const amount = parseFloat(formData.amount) || 0;
            const expenses = parseFloat(formData.expenses) || 0;
            const transport = parseFloat(formData.transport) || 0;
            setFormData((prevData) => ({
                ...prevData,
                balance: (payments - amount - expenses - transport).toFixed(2)
            }));
        };

        calculateAmount();
        calculateBalance();
    }, [formData.at20, formData.price, formData.payments, formData.amount, formData.expenses, formData.transport]);

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100">
            <header className="sticky top-0 z-20 border-b border-gray-800 bg-gray-900/70 backdrop-blur-md supports-[backdrop-filter]:bg-gray-900/60">
                <div className="container flex h-16 items-center justify-between mx-auto px-4">
                    <Button
                        variant="ghost"
                        size="md"
                        className="text-gray-400 hover:text-gray-100"
                        onClick={() => router.push('/dashboard')}
                    >
                        <ArrowLeft className="h-5 w-5" />
                        <span className="sr-only">Back to Dashboard</span>
                    </Button>
                    <h1 className="text-xl font-bold">Add Invoices</h1>
                    <div className="flex items-center space-x-4">
                        <Button
                            variant="ghost"
                            size="md"
                            className="text-gray-400 hover:text-gray-100"
                            onClick={handleLogout}
                        >
                            <LogOut className="h-5 w-5" />
                            <span className="sr-only">Logout</span>
                        </Button>
                        <Avatar>
                            <AvatarImage src={user?.photoURL || 'https://github.com/shadcn.png'} alt={user?.displayName || 'User'} />
                            <AvatarFallback>{user?.displayName ? user.displayName[0] : 'U'}</AvatarFallback>
                        </Avatar>
                    </div>
                </div>
            </header>
            <main className="container mx-auto py-6 px-4">
                <form className="space-y-4 mx-auto max-w-4xl w-full px-4 grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                        <Label htmlFor="date">Date</Label>
                        <Input
                            id="date"
                            name="date"
                            placeholder="dd/mm/yyyy"
                            value={formData.date}
                            onChange={handleChange}
                            className="bg-gray-700 text-gray-100 rounded-lg w-full"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="owner">Owner</Label>
                        <Input
                            id="owner"
                            name="owner"
                            value={formData.owner}
                            onChange={handleChange}
                            className="bg-gray-700 text-gray-100 rounded-lg w-full"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="deport">Deport</Label>
                        <Input
                            id="deport"
                            name="deport"
                            value={formData.deport}
                            onChange={handleChange}
                            className="bg-gray-700 text-gray-100 rounded-lg w-full"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="truckNo">Truck No</Label>
                        <Input
                            id="truckNo"
                            name="truckNo"
                            value={formData.truckNo}
                            onChange={handleChange}
                            className="bg-gray-700 text-gray-100 rounded-lg w-full"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="pms">PMS</Label>
                        <Input
                            id="pms"
                            name="pms"
                            value={formData.pms}
                            onChange={handleChange}
                            className="bg-gray-700 text-gray-100 rounded-lg w-full"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="ago">AGO</Label>
                        <Input
                            id="ago"
                            name="ago"
                            value={formData.ago}
                            onChange={handleChange}
                            className="bg-gray-700 text-gray-100 rounded-lg w-full"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="at20">AT 20</Label>
                        <Input
                            id="at20"
                            name="at20"
                            value={formData.at20}
                            onChange={handleChange}
                            className="bg-gray-700 text-gray-100 rounded-lg w-full"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="price">Price</Label>
                        <Input
                            id="price"
                            name="price"
                            value={formData.price}
                            onChange={handleChange}
                            className="bg-gray-700 text-gray-100 rounded-lg w-full"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="amount">Amount</Label>
                        <Input
                            id="amount"
                            name="amount"
                            value={formData.amount}
                            onChange={handleChange}
                            className="bg-gray-700 text-gray-100 rounded-lg w-full"
                            readOnly
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="expenses">Expenses</Label>
                        <Input
                            id="expenses"
                            name="expenses"
                            value={formData.expenses}
                            onChange={handleChange}
                            className="bg-gray-700 text-gray-100 rounded-lg w-full"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="payments">Payments</Label>
                        <Input
                            id="payments"
                            name="payments"
                            value={formData.payments}
                            onChange={handleChange}
                            className="bg-gray-700 text-gray-100 rounded-lg w-full"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="paymentDate">Payment Date</Label>
                        <Input
                            id="paymentDate"
                            name="paymentDate"
                            placeholder="dd/mm/yyyy"
                            value={formData.paymentDate}
                            onChange={handleChange}
                            className="bg-gray-700 text-gray-100 rounded-lg w-full"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="transport">Transport</Label>
                        <Input
                            id="transport"
                            name="transport"
                            value={formData.transport}
                            onChange={handleChange}
                            className="bg-gray-700 text-gray-100 rounded-lg w-full"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="balance">Balance</Label>
                        <Input
                            id="balance"
                            name="balance"
                            value={formData.balance}
                            onChange={handleChange}
                            className="bg-gray-700 text-gray-100 rounded-lg w-full"
                            readOnly
                        />
                    </div>
                    <div className="flex justify-end space-x-2 col-span-1 md:col-span-2">
                        <Button type="button" variant="ghost" onClick={() => router.back()}>
                            Back
                        </Button>
                        <Button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md">
                            {isLoading ? (
                                <svg className="animate-spin h-5 w-5 mr-3 border-t-2 border-white rounded-full" viewBox="0 0 24 24"></svg>
                            ) : (
                                'Submit'
                            )}
                        </Button>
                    </div>
                </form>
            </main>
        </div>
    );
}