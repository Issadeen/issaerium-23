'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, LogOut, Maximize, Minimize, Download } from 'lucide-react';
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue } from 'firebase/database';
import { getAuth, onAuthStateChanged, signOut, User } from 'firebase/auth';
import jsPDF from 'jspdf';
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

export default function ViewInvoices() {
    const [user, setUser] = useState<User | null>(null);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [selectedOwner, setSelectedOwner] = useState<string | null>(null);
    const [isFullScreen, setIsFullScreen] = useState(false);
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

    useEffect(() => {
        const invoicesRef = ref(database, 'data');
        onValue(invoicesRef, (snapshot) => {
            const data = snapshot.val();
            setInvoices(data ? Object.entries(data).map(([key, val]) => (typeof val === 'object' && val !== null ? { key, ...val } : { key })) : []);
        });
    }, []);

    const handleLogout = () => {
        signOut(auth).then(() => {
            router.push('/sign-in');
        });
    };

    const groupedInvoices = invoices.reduce((acc, invoice) => {
        const owner = (invoice.owner || 'Unknown').toLowerCase();
        if (!acc[owner]) {
            acc[owner] = [];
        }
        acc[owner].push(invoice);
        return acc;
    }, {});

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullScreen(true);
        } else if (document.exitFullscreen) {
            document.exitFullscreen();
            setIsFullScreen(false);
        }
    };

    const downloadPDF = () => {
        if (!selectedOwner) return;

        const doc = new jsPDF('landscape');
        const tableColumn = ["Date", "Owner", "Deport", "Truck No", "PMS", "AGO", "AT 20", "Price", "Amount", "Expenses", "Payments", "Payment Date", "Transport", "Balance"];
        const tableRows: (string | number)[][] = [];

        groupedInvoices[selectedOwner].forEach((invoice: any) => {
            const invoiceData = [
                invoice.date,
                invoice.owner,
                invoice.deport,
                invoice.truckNo,
                invoice.pms || '-',
                invoice.ago || '-',
                invoice.at20 || '-',
                invoice.price || '-',
                invoice.amount || '-',
                invoice.expenses || '-',
                invoice.payments || '-',
                invoice.paymentDate,
                invoice.transport || '-',
                invoice.balance || '-'
            ];
            tableRows.push(invoiceData);
        });

        autoTable(doc, { head: [tableColumn], body: tableRows, startY: 20 });
        if (selectedOwner) {
            doc.text(`${selectedOwner.charAt(0).toUpperCase() + selectedOwner.slice(1)}'s Invoices`, 14, 15);
        }

        // Highlight the balance total
        const balanceTotal = calculateTotal('balance');
        doc.setFontSize(12);
        doc.setTextColor(255, 0, 0);
        doc.text(`Total Balance: ${balanceTotal}`, 14, (doc as any).autoTable.previous.finalY + 10);

        doc.save(`${selectedOwner}_invoices.pdf`);
    };

    const calculateTotal = (field: string) => {
        return selectedOwner ? groupedInvoices[selectedOwner].reduce((total: number, invoice: any) => {
            const value = parseFloat(invoice[field]) || 0;
            return total + value;
        }, 0).toFixed(2) : '0.00';
    };

    return (
        <div className={`min-h-screen bg-gray-900 text-gray-100 ${isFullScreen ? 'fullscreen' : ''}`}>
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
                    <h1 className="text-xl font-bold">View Invoices</h1>
                    <div className="flex items-center space-x-4">
                        <Button
                            variant="ghost"
                            size="md"
                            className="text-gray-400 hover:text-gray-100"
                            onClick={toggleFullScreen}
                        >
                            {isFullScreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                            <span className="sr-only">Toggle Fullscreen</span>
                        </Button>
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {Object.keys(groupedInvoices).map((owner) => (
                        <Button
                            key={owner}
                            variant="ghost"
                            size="md"
                            className={`w-full text-left ${selectedOwner === owner ? 'text-blue-500' : 'text-gray-100'}`}
                            onClick={() => setSelectedOwner(owner)}
                        >
                            {owner.charAt(0).toUpperCase() + owner.slice(1)}
                        </Button>
                    ))}
                </div>
                {!selectedOwner && (
                    <div className="text-center text-gray-400">
                        Please select an owner to view their invoices.
                    </div>
                )}
                {selectedOwner && (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold">{selectedOwner.charAt(0).toUpperCase() + selectedOwner.slice(1)}'s Invoices</h2>
                            <Button
                                variant="ghost"
                                size="md"
                                className="text-gray-400 hover:text-gray-100"
                                onClick={downloadPDF}
                            >
                                <Download className="h-5 w-5" />
                                <span className="sr-only">Download PDF</span>
                            </Button>
                        </div>
                        <Table className="min-w-full bg-gray-800">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-gray-400">Date</TableHead>
                                    <TableHead className="text-gray-400">Owner</TableHead>
                                    <TableHead className="text-gray-400">Deport</TableHead>
                                    <TableHead className="text-gray-400">Truck No</TableHead>
                                    <TableHead className="text-gray-400">PMS</TableHead>
                                    <TableHead className="text-gray-400">AGO</TableHead>
                                    <TableHead className="text-gray-400">AT 20</TableHead>
                                    <TableHead className="text-gray-400">Price</TableHead>
                                    <TableHead className="text-gray-400">Amount</TableHead>
                                    <TableHead className="text-gray-400">Expenses</TableHead>
                                    <TableHead className="text-gray-400">Payments</TableHead>
                                    <TableHead className="text-gray-400">Payment Date</TableHead>
                                    <TableHead className="text-gray-400">Transport</TableHead>
                                    <TableHead className="text-gray-400">Balance</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {groupedInvoices[selectedOwner].map((invoice: any) => (
                                    <TableRow key={invoice.key}>
                                        <TableCell className="text-gray-100">{invoice.date}</TableCell>
                                        <TableCell className="text-gray-100">{invoice.owner}</TableCell>
                                        <TableCell className="text-gray-100">{invoice.deport}</TableCell>
                                        <TableCell className="text-gray-100">{invoice.truckNo}</TableCell>
                                        <TableCell className="text-gray-100">{invoice.pms || '-'}</TableCell>
                                        <TableCell className="text-gray-100">{invoice.ago || '-'}</TableCell>
                                        <TableCell className="text-gray-100">{invoice.at20 || '-'}</TableCell>
                                        <TableCell className="text-gray-100">{invoice.price || '-'}</TableCell>
                                        <TableCell className="text-gray-100">{invoice.amount || '-'}</TableCell>
                                        <TableCell className="text-gray-100">{invoice.expenses || '-'}</TableCell>
                                        <TableCell className="text-gray-100">{invoice.payments || '-'}</TableCell>
                                        <TableCell className="text-gray-100">{invoice.paymentDate}</TableCell>
                                        <TableCell className="text-gray-100">{invoice.transport || '-'}</TableCell>
                                        <TableCell className="text-gray-100">{invoice.balance || '-'}</TableCell>
                                    </TableRow>
                                ))}
                                <TableRow>
                                    <TableCell className="text-gray-100 font-bold">Total</TableCell>
                                    <TableCell className="text-gray-100">&nbsp;</TableCell>
                                    <TableCell className="text-gray-100">&nbsp;</TableCell>
                                    <TableCell className="text-gray-100">&nbsp;</TableCell>
                                    <TableCell className="text-gray-100">{calculateTotal('pms')}</TableCell>
                                    <TableCell className="text-gray-100">{calculateTotal('ago')}</TableCell>
                                    <TableCell className="text-gray-100">{calculateTotal('at20')}</TableCell>
                                    <TableCell className="text-gray-100">{calculateTotal('price')}</TableCell>
                                    <TableCell className="text-gray-100">{calculateTotal('amount')}</TableCell>
                                    <TableCell className="text-gray-100">{calculateTotal('expenses')}</TableCell>
                                    <TableCell className="text-gray-100">{calculateTotal('payments')}</TableCell>
                                    <TableCell className="text-gray-100">&nbsp;</TableCell>
                                    <TableCell className="text-gray-100">{calculateTotal('transport')}</TableCell>
                                    <TableCell className="text-gray-100 font-bold text-red-500">{calculateTotal('balance')}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                )}
            </main>
        </div>
    );
}