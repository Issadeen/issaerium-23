'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, LogOut, Plus, Trash, Download } from 'lucide-react';
import { Button } from "../components/ui/button";
import Input from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Dialog, DialogTrigger } from "../components/ui/Dialog";
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, remove, get } from 'firebase/database';
import { getAuth, onAuthStateChanged, signOut, User } from 'firebase/auth';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const firebaseApp = initializeApp({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
});

const database = getDatabase(firebaseApp);
const auth = getAuth(firebaseApp);
const storage = getStorage(firebaseApp);

export default function Tracker() {
    const [user, setUser] = useState<User | null>(null);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState('');
    const [statement, setStatement] = useState<File | null>(null);
    const [mpesaStatement, setMpesaStatement] = useState<File | null>(null);
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
        const expensesRef = ref(database, 'expenses');
        onValue(expensesRef, (snapshot) => {
            const data = snapshot.val();
            setExpenses(data ? Object.entries(data).map(([key, val]) => (typeof val === 'object' && val !== null ? { key, ...val } : { key })) : []);
        });
    }, []);

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

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!name || !amount || !date || !statement || !mpesaStatement) {
            alert('Please fill in all the fields');
            return;
        }

        setIsLoading(true);

        const statementRef = storageRef(storage, `statements/${statement.name}`);
        const mpesaStatementRef = storageRef(storage, `statements/${mpesaStatement.name}`);

        await uploadBytes(statementRef, statement);
        await uploadBytes(mpesaStatementRef, mpesaStatement);

        const statementURL = await getDownloadURL(statementRef);
        const mpesaStatementURL = await getDownloadURL(mpesaStatementRef);

        await set(ref(database, `expenses/${Date.now()}`), {
            name,
            amount,
            date,
            statement: statementURL,
            mpesaStatement: mpesaStatementURL,
        });

        setName('');
        setAmount('');
        setDate('');
        setStatement(null);
        setMpesaStatement(null);
        setIsDialogOpen(false);
        setIsLoading(false);
    };

    const handleDelete = async (key: string, statementUrl: string, mpesaStatementUrl: string) => {
        const enteredWorkId = prompt("Enter your work ID to delete an expense:");
        if (user) {
            const userRef = ref(database, `users/${user.uid}`);
            const snapshot = await get(userRef);
            if (snapshot.exists() && snapshot.val().workId === enteredWorkId) {
                await remove(ref(database, `expenses/${key}`));
                await deleteObject(storageRef(storage, statementUrl));
                await deleteObject(storageRef(storage, mpesaStatementUrl));
                alert('Expense deleted successfully');
            } else {
                alert('Incorrect work ID.');
            }
        } else {
            alert('You need to be logged in to delete an expense.');
        }
    };

    const downloadExpenses = async () => {
        const zip = new JSZip();
        for (const expense of expenses) {
            const statementResponse = await fetch(expense.statement);
            const statementBlob = await statementResponse.blob();
            const mpesaStatementResponse = await fetch(expense.mpesaStatement);
            const mpesaStatementBlob = await mpesaStatementResponse.blob();

            zip.file(`${expense.name}_statement.${statementBlob.type.split('/')[1]}`, statementBlob);
            zip.file(`${expense.name}_mpesaStatement.${mpesaStatementBlob.type.split('/')[1]}`, mpesaStatementBlob);
        }
        const content = await zip.generateAsync({ type: 'blob' });
        saveAs(content, 'expenses.zip');
    };

    const handleLogout = () => {
        signOut(auth).then(() => {
            router.push('/sign-in');
        });
    };

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
                    <h1 className="text-xl font-bold">Expense Tracker</h1>
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
                <Button
                    variant="ghost"
                    size="md"
                    className="text-gray-400 hover:text-gray-100 mb-4"
                    onClick={() => setIsDialogOpen(true)}
                >
                    <Plus className="h-5 w-5" />
                    <span className="sr-only">Add New Expense</span>
                </Button>
                <Button
                    variant="ghost"
                    size="md"
                    className="text-gray-400 hover:text-gray-100 mb-4"
                    onClick={downloadExpenses}
                >
                    <Download className="h-5 w-5" />
                    <span className="sr-only">Download Expenses</span>
                </Button>
                <div className="space-y-4">
                    {expenses.map((expense) => (
                        <Card key={expense.key} className="bg-gray-800 border-gray-700 hover:shadow-lg hover:shadow-blue-500/50 transition-shadow duration-300">
                            <CardHeader>
                                <CardTitle className="text-xl font-bold">{expense.name}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p>Amount: {expense.amount}</p>
                                <p>Date: {expense.date}</p>
                                <p>Statement: <a href={expense.statement} target="_blank" rel="noopener noreferrer">View</a></p>
                                <p>Mpesa Statement: <a href={expense.mpesaStatement} target="_blank" rel="noopener noreferrer">View</a></p>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-500 hover:text-red-700 mt-2"
                                    onClick={() => handleDelete(expense.key, expense.statement, expense.mpesaStatement)}
                                >
                                    <Trash className="h-5 w-5" />
                                    <span className="sr-only">Delete</span>
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </main>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen} title="Add Expense">
                <form className="space-y-4 mx-auto max-w-lg w-full px-4 overflow-y-auto max-h-[80vh]" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                        <Label htmlFor="name">Expense Name</Label>
                        <Input
                            id="name"
                            placeholder="Enter expense name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-gray-700 text-gray-100 rounded-lg w-full"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="amount">Amount</Label>
                        <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            placeholder="Enter amount"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="bg-gray-700 text-gray-100 rounded-lg w-full"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="date">Date</Label>
                        <Input
                            id="date"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="bg-gray-700 text-gray-100 rounded-lg w-full"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="statement">Expense Statement</Label>
                        <Input
                            id="statement"
                            type="file"
                            onChange={(e) => setStatement(e.target.files ? e.target.files[0] : null)}
                            className="bg-gray-700 text-gray-100 rounded-lg w-full"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="mpesaStatement">Mpesa Statement</Label>
                        <Input
                            id="mpesaStatement"
                            type="file"
                            onChange={(e) => setMpesaStatement(e.target.files ? e.target.files[0] : null)}
                            className="bg-gray-700 text-gray-100 rounded-lg w-full"
                            required
                        />
                    </div>
                    <div className="flex justify-end space-x-2">
                        <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md">
                            {isLoading ? (
                                <svg className="animate-spin h-5 w-5 mr-3 border-t-2 border-white rounded-full" viewBox="0 0 24 24"></svg>
                            ) : (
                                'Add Expense'
                            )}
                        </Button>
                    </div>
                </form>
            </Dialog>
        </div>
    );
}