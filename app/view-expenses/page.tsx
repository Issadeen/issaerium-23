'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, LogOut, Plus, Trash, Edit } from 'lucide-react';
import { Button } from "../components/ui/button";
import Input from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Dialog } from "../components/ui/Dialog";
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, remove, update } from 'firebase/database';
import { getAuth, onAuthStateChanged, signOut, User } from 'firebase/auth';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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

export default function Expenses() {
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState('');
    const [user, setUser] = useState<User | null>(null);
    const [creditors, setCreditors] = useState<{ [key: string]: { name: string, total: number } } | null>(null);
    const [selectedCreditor, setSelectedCreditor] = useState<string | null>(null);
    const [expenses, setExpenses] = useState<ExpenseData[] | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isCreditorDialogOpen, setIsCreditorDialogOpen] = useState(false);
    const [isEditCreditorDialogOpen, setIsEditCreditorDialogOpen] = useState(false);
    const [newCreditorName, setNewCreditorName] = useState('');
    const [editCreditorId, setEditCreditorId] = useState<string | null>(null);
    const [editCreditorName, setEditCreditorName] = useState('');
    const [workId, setWorkId] = useState(''); // Use this state to store the verified work ID
    const [isWorkIdVerificationOpen, setIsWorkIdVerificationOpen] = useState(false);
    const [workIdInput, setWorkIdInput] = useState(''); // Input for work ID verification
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null); // To store the ID of the item to be deleted
    const [deleteType, setDeleteType] = useState<'expense' | 'creditor' | null>(null); // To store the type of item to be deleted
    const router = useRouter();

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
        const logoutTimer = setTimeout(() => {
            signOut(auth).then(() => {
                router.push('/login');
            });
        }, 7 * 60 * 1000); // 7 minutes

        const resetTimer = () => {
            clearTimeout(logoutTimer);
            setTimeout(() => {
                signOut(auth).then(() => {
                    router.push('/login');
                });
            }, 7 * 60 * 1000);
        };

        window.addEventListener('mousemove', resetTimer);
        window.addEventListener('keypress', resetTimer);

        return () => {
            clearTimeout(logoutTimer);
            window.removeEventListener('mousemove', resetTimer);
            window.removeEventListener('keypress', resetTimer);
        };
    }, [router]);

    useEffect(() => {
        const creditorsRef = ref(database, 'creditors');
        onValue(creditorsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                // Calculate total for each creditor
                const updatedCreditors = Object.keys(data).reduce((acc: { [key: string]: { name: string, total: number } }, key: string) => {
                    const expensesRef = ref(database, `creditors/${key}/expenses`);
                    onValue(expensesRef, (snapshot) => {
                        const expensesData = snapshot.val();
                        const total = expensesData ? Object.values(expensesData).reduce((sum: number, expense: any) => sum + parseFloat(expense.amount), 0) : 0;
                        acc[key] = { name: data[key].name, total };
                    });
                    return acc;
                }, {});
                setCreditors(updatedCreditors);
            } else {
                setCreditors(null);
            }
        });
    }, []);

    useEffect(() => {
        if (selectedCreditor) {
            const expensesRef = ref(database, `creditors/${selectedCreditor}/expenses`);
            onValue(expensesRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    const expensesArray = Object.keys(data).map(key => ({ id: key, ...data[key] }));
                    expensesArray.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                    setExpenses(expensesArray);
                } else {
                    setExpenses(null);
                }
            });
        }
    }, [selectedCreditor]);

    interface ExpenseData {
        id?: string;
        name: string;
        amount: string;
        date: string;
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            const expenseRef = ref(database, `creditors/${selectedCreditor}/expenses/${Date.now()}`);
            const expenseData: ExpenseData = { name, amount, date };
            await set(expenseRef, expenseData);
            alert('Expense added successfully');
            setName('');
            setAmount('');
            setDate('');
            setIsDialogOpen(false);
        } catch (error) {
            console.error('Error adding expense:', error);
            alert('An error occurred while adding the expense. Please try again.');
        }
    };

    const handleDelete = async (expenseId: string) => {
        try {
            const expenseRef = ref(database, `creditors/${selectedCreditor}/expenses/${expenseId}`);
            await remove(expenseRef);
            alert('Expense deleted successfully');
        } catch (error) {
            console.error('Error deleting expense:', error);
            alert('An error occurred while deleting the expense. Please try again.');
        }
    };

    const handleDeleteRequest = (expenseId: string) => {
        setPendingDeleteId(expenseId);
        setIsWorkIdVerificationOpen(true);
    };

    const handleDeleteCreditor = async (creditorId: string) => {
        if (workId) {
            try {
                const creditorRef = ref(database, `creditors/${creditorId}`);
                await remove(creditorRef);
                alert('Creditor deleted successfully');
            } catch (error) {
                console.error('Error deleting creditor:', error);
                alert('An error occurred while deleting the creditor. Please try again.');
            }
        } else {
            setIsWorkIdVerificationOpen(true); 
        }
    };

    const handleLogout = () => {
        signOut(auth).then(() => {
            router.push('/login');
        });
    };

    const handleAddCreditor = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            const creditorRef = ref(database, `creditors/${Date.now()}`);
            await set(creditorRef, { name: newCreditorName });
            alert('Creditor added successfully');
            setNewCreditorName('');
            setIsCreditorDialogOpen(false);
        } catch (error) {
            console.error('Error adding creditor:', error);
            alert('An error occurred while adding the creditor. Please try again.');
        }
    };

    const handleEditCreditor = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            const creditorRef = ref(database, `creditors/${editCreditorId}`);
            await update(creditorRef, { name: editCreditorName });
            alert('Creditor updated successfully');
            setEditCreditorName('');
            setEditCreditorId(null);
            setIsEditCreditorDialogOpen(false);
        } catch (error) {
            console.error('Error updating creditor:', error);
            alert('An error occurred while updating the creditor. Please try again.');
        }
    };

    const downloadPDF = () => {
        const doc = new jsPDF();
        const tableColumn = ["Description", "Amount", "Date"];
        const tableRows: any[] = [];

        expenses?.forEach(expense => {
            const expenseData = [
                expense.name,
                expense.amount,
                expense.date
            ];
            tableRows.push(expenseData);
        });

        // Calculate total for selected creditor
        let total = 0;
        expenses?.forEach(expense => {
            total += parseFloat(expense.amount);
        });

        // Add total to table
        tableRows.push(["", "", `Total: ${total}`]); 

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 20
        });
        doc.text("Expense Report", 14, 15);

        doc.save("expenses.pdf");
    };

    const handleVerifyWorkId = () => {
        if (user && workIdInput === (user as any).workId) { // Assuming user.workId contains the valid work ID for the logged-in user
            setWorkId('verified'); // Set work ID to 'verified' if successful
            setIsWorkIdVerificationOpen(false);
            if (pendingDeleteId && deleteType) {
                if (deleteType === 'expense') {
                    handleDelete(pendingDeleteId);
                } else if (deleteType === 'creditor') {
                    handleDeleteCreditor(pendingDeleteId);
                }
                setPendingDeleteId(null);
                setDeleteType(null);
            }
        } else {
            alert('Invalid work ID.');
        }
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
                    <h1 className="text-xl font-bold">Expenses</h1>
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
            <main className="container mx-auto py-6 px-4 flex flex-col md:flex-row">
                <div className="w-full md:w-1/4 pr-4 mb-4 md:mb-0">
                    <Card className="bg-gray-800 border-gray-700 mb-4">
                        <CardHeader>
                            <CardTitle className="text-2xl font-bold flex justify-between items-center">
                                Creditors
                                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-100" onClick={() => setIsCreditorDialogOpen(true)}>
                                    <Plus className="h-5 w-5" />
                                </Button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {creditors ? (
                                    Object.keys(creditors).map((key) => (
                                        <div
                                            key={key}
                                            className={`p-2 rounded-lg cursor-pointer flex justify-between items-center ${selectedCreditor === key ? 'bg-blue-500' : 'bg-gray-700'}`}
                                            onClick={() => setSelectedCreditor(key)}
                                        >
                                            {creditors[key].name}
                                            <div className="flex space-x-2">
                                                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-100" onClick={() => {
                                                    setEditCreditorId(key);
                                                    setEditCreditorName(creditors[key].name);
                                                    setIsEditCreditorDialogOpen(true);
                                                }}>
                                                    <Edit className="h-5 w-5" />
                                                </Button>
                                                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => handleDeleteCreditor(key)}>
                                                    <Trash className="h-5 w-5" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p>No creditors found.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="w-full md:w-3/4">
                    <Card className="bg-gray-800 border-gray-700 mb-4">
                        <CardHeader>
                            <CardTitle className="text-2xl font-bold flex justify-between items-center">
                                Expenses
                                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-100" onClick={() => setIsDialogOpen(true)}>
                                    <Plus className="h-5 w-5" />
                                </Button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {expenses && expenses.length > 0 ? (
                                <div className="mt-4">
                                    <h3 className="text-lg font-bold">Expense Details</h3>
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr>
                                                <th className="border border-gray-700 p-2">Description</th>
                                                <th className="border border-gray-700 p-2">Amount</th>
                                                <th className="border border-gray-700 p-2">Date</th>
                                                <th className="border border-gray-700 p-2">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {expenses.map((expense, index) => (
                                                <tr key={index}>
                                                    <td className="border border-gray-700 p-2">{expense.name}</td>
                                                    <td className="border border-gray-700 p-2">{expense.amount}</td>
                                                    <td className="border border-gray-700 p-2">{expense.date}</td>
                                                    <td className="border border-gray-700 p-2 text-center">
                                                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => handleDeleteRequest(expense.id!)}>
                                                            <Trash className="h-5 w-5" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <p className="mt-2 text-center">Total: {expenses?.reduce((total, expense) => total + parseFloat(expense.amount), 0).toFixed(2)}</p> {/* Display total */}
                                    <Button onClick={downloadPDF} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md mt-4">
                                        Download PDF
                                    </Button>
                                </div>
                            ) : (
                                <p>No expenses found for the selected creditor.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen} title="Add Expense">
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                        <Label htmlFor="name">Description</Label>
                        <Input
                            id="name"
                            placeholder="Enter description"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-gray-700 text-gray-100 rounded-lg"
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
                            className="bg-gray-700 text-gray-100 rounded-lg"
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
                            className="bg-gray-700 text-gray-100 rounded-lg"
                            required
                        />
                    </div>
                    <Button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md w-full md:w-auto">
                        Add Expense
                    </Button>
                </form>
            </Dialog>
            <Dialog open={isCreditorDialogOpen} onOpenChange={setIsCreditorDialogOpen} title="Add Creditor">
                <form className="space-y-4" onSubmit={handleAddCreditor}>
                    <div className="space-y-2">
                        <Label htmlFor="newCreditorName">Creditor Name</Label>
                        <Input
                            id="newCreditorName"
                            placeholder="Enter creditor name"
                            value={newCreditorName}
                            onChange={(e) => setNewCreditorName(e.target.value)}
                            className="bg-gray-700 text-gray-100 rounded-lg"
                            required
                        />
                    </div>
                    <Button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md w-full md:w-auto">
                        Add Creditor
                    </Button>
                </form>
            </Dialog>
            <Dialog open={isEditCreditorDialogOpen} onOpenChange={setIsEditCreditorDialogOpen} title="Edit Creditor">
                <form className="space-y-4" onSubmit={handleEditCreditor}>
                    <div className="space-y-2">
                        <Label htmlFor="editCreditorName">Creditor Name</Label>
                        <Input
                            id="editCreditorName"
                            placeholder="Enter creditor name"
                            value={editCreditorName}
                            onChange={(e) => setEditCreditorName(e.target.value)}
                            className="bg-gray-700 text-gray-100 rounded-lg"
                            required
                        />
                    </div>
                    <Button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md w-full md:w-auto">
                        Update Creditor
                    </Button>
                </form>
            </Dialog>
            <Dialog open={isWorkIdVerificationOpen} onOpenChange={setIsWorkIdVerificationOpen} title="Verify Work ID">
                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleVerifyWorkId(); }}>
                    <div className="space-y-2">
                        <Label htmlFor="workIdInput">Work ID</Label>
                        <Input
                            id="workIdInput"
                            placeholder="Enter your work ID"
                            value={workIdInput}
                            onChange={(e) => setWorkIdInput(e.target.value)}
                            className="bg-gray-700 text-gray-100 rounded-lg"
                            required
                        />
                    </div>
                    <Button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md w-full md:w-auto">
                        Verify
                    </Button>
                </form>
            </Dialog>
        </div>
    );
}