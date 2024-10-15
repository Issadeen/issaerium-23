'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, LogOut, Search } from 'lucide-react';
import { Button } from "../components/ui/button";
import Input from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, get, set, query, orderByChild, equalTo } from 'firebase/database';
import { getAuth, onAuthStateChanged, signOut, User } from 'firebase/auth';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import * as PDFLib from 'pdf-lib';
import { saveAs } from 'file-saver';

pdfMake.vfs = pdfFonts.pdfMake.vfs;

// Initialize Firebase
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};
const firebaseApp = initializeApp(firebaseConfig);
const database = getDatabase(firebaseApp);
const auth = getAuth(firebaseApp);

export default function Wallet() {
    const [billTo, setBillTo] = useState('');
    const [shipTo, setShipTo] = useState('');
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [invoiceDate, setInvoiceDate] = useState('');
    const [customerId, setCustomerId] = useState('');
    const [description, setDescription] = useState('');
    const [hsCode, setHsCode] = useState('0001.13.01');
    const [quantity, setQuantity] = useState('');
    const [unitPrice, setUnitPrice] = useState('');
    const [user, setUser] = useState<User | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<FormData[] | null>(null);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUser(user);
            } else if (typeof window !== 'undefined') {
                router.push('/sign-in');
            }
        });

        return () => unsubscribe();
    }, [router]);

    useEffect(() => {
        const logoutTimer = setTimeout(() => {
            signOut(auth).then(() => {
                router.push('/sign-in');
            });
        }, 7 * 60 * 1000); // 7 minutes

        const resetTimer = () => {
            clearTimeout(logoutTimer);
            setTimeout(() => {
                signOut(auth).then(() => {
                    router.push('/sign-in');
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

    interface FormData {
        billTo: string;
        shipTo: string;
        invoiceNumber: string;
        invoiceDate: string;
        customerId: string;
        description: string;
        hsCode: string;
        quantity: number;
        unitPrice: number;
        amount: string;
        pdfUrl?: string;
    }

    const fillPdf = async (formData: FormData) => {
        try {
            const response = await fetch('https://issadeen.github.io/my-web-app/template.pdf');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const pdfTemplate = await response.arrayBuffer();
            const pdfDoc = await PDFLib.PDFDocument.load(pdfTemplate);
            const page = pdfDoc.getPages()[0];
            const { width, height } = page.getSize();

            // Define field positions (adjust these based on your actual template)
            const fieldPositions: { [key in keyof FormData]: { x: number; y: number; size: number } } = {
                billTo: { x: 75, y: height - 230, size: 10 },
                shipTo: { x: 395, y: height - 240, size: 10 },
                invoiceNumber: { x: 395, y: height - 165, size: 10 },
                invoiceDate: { x: 510, y: height - 165, size: 10 },
                customerId: { x: 395, y: height - 195, size: 10 },
                description: { x: 75, y: height - 380, size: 10 },
                hsCode: { x: 300, y: height - 380, size: 10 },
                quantity: { x: 400, y: height - 380, size: 10 },
                unitPrice: { x: 460, y: height - 380, size: 10 },
                amount: { x: 520, y: height - 435, size: 10 }
            };

            // Add text to the PDF
            Object.entries(formData).forEach(([key, value]) => {
                const position = fieldPositions[key as keyof FormData];
                if (position) {
                    page.drawText(value.toString().toUpperCase(), {
                        x: position.x,
                        y: position.y,
                        size: position.size,
                        color: PDFLib.rgb(0, 0, 0)
                    });
                }
            });

            // Calculate and add total
            const total = (formData.quantity * formData.unitPrice).toFixed(2);
            page.drawText(total, {
                x: 520,
                y: height - 380,
                size: 10,
                color: PDFLib.rgb(0, 0, 0)
            });

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: "application/pdf" });
            const pdfUrl = URL.createObjectURL(blob);
            saveAs(blob, "invoice.pdf");

            // Save invoice details to Firebase
            const invoiceRef = ref(database, `invoices/${formData.invoiceNumber}`);
            await set(invoiceRef, { ...formData, pdfUrl });
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('An error occurred while generating the PDF. Please try again.');
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault(); // Prevent form submission and page reload
        try {
            // Fetch and set the invoice number before generating the PDF
            const snapshot = await get(ref(database, 'invoiceNumber'));
            let currentNumber = snapshot.val() || 599; // Start from 599 if no value exists
            currentNumber++;
            const newInvoiceNumber = `MOK-PFI-${currentNumber.toString().padStart(3, '0')}`;
            setInvoiceNumber(newInvoiceNumber);

            const formData = {
                billTo,
                shipTo,
                invoiceNumber: newInvoiceNumber,
                invoiceDate,
                customerId,
                description,
                hsCode,
                quantity: parseFloat(quantity),
                unitPrice: parseFloat(unitPrice),
                amount: (parseFloat(quantity) * parseFloat(unitPrice)).toFixed(2)
            };
            await fillPdf(formData);

            // Increment and save the invoice number only after successful PDF generation
            await set(ref(database, 'invoiceNumber'), currentNumber);
        } catch (error) {
            console.error('Error submitting form:', error);
            alert('An error occurred while submitting the form. Please try again.');
        }
    };

    const handleSearch = async () => {
        try {
            let searchRef;
            if (searchQuery.startsWith('MOK-PFI-')) {
                searchRef = ref(database, `invoices/${searchQuery}`);
            } else {
                searchRef = query(ref(database, 'invoices'), orderByChild('billTo'), equalTo(searchQuery));
            }
            const snapshot = await get(searchRef);
            if (snapshot.exists()) {
                if (searchQuery.startsWith('MOK-PFI-')) {
                    setSearchResults([snapshot.val()]);
                } else {
                    const results = snapshot.val();
                    const resultArray = Object.keys(results).map(key => results[key]);
                    setSearchResults(resultArray);
                }
            } else {
                alert('Invoice not found.');
                setSearchResults(null);
            }
        } catch (error) {
            console.error('Error searching for invoice:', error);
            alert('An error occurred while searching for the invoice. Please try again.');
        }
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
                    <h1 className="text-xl font-bold">Wallet</h1>
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
                <Card className="bg-gray-800 border-gray-700 mb-4">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold">Invoice Generator</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form className="space-y-4" onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="billTo">Bill To</Label>
                                    <Input
                                        id="billTo"
                                        placeholder="Enter bill to"
                                        value={billTo}
                                        onChange={(e) => setBillTo(e.target.value)}
                                        className="bg-gray-700 text-gray-100 rounded-lg"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="shipTo">Ship To</Label>
                                    <Input
                                        id="shipTo"
                                        placeholder="Enter ship to"
                                        value={shipTo}
                                        onChange={(e) => setShipTo(e.target.value)}
                                        className="bg-gray-700 text-gray-100 rounded-lg"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="invoiceNumber">Proforma Invoice Number</Label>
                                    <Input
                                        id="invoiceNumber"
                                        placeholder="Invoice number"
                                        value={invoiceNumber}
                                        readOnly
                                        className="bg-gray-700 text-gray-100 rounded-lg"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="invoiceDate">Date</Label>
                                    <Input
                                        id="invoiceDate"
                                        type="date"
                                        value={invoiceDate}
                                        onChange={(e) => setInvoiceDate(e.target.value)}
                                        className="bg-gray-700 text-gray-100 rounded-lg"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="customerId">Customer ID</Label>
                                    <Input
                                        id="customerId"
                                        placeholder="Enter customer ID"
                                        value={customerId}
                                        onChange={(e) => setCustomerId(e.target.value)}
                                        className="bg-gray-700 text-gray-100 rounded-lg"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description of Goods</Label>
                                    <Input
                                        id="description"
                                        placeholder="Enter description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="bg-gray-700 text-gray-100 rounded-lg"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="hsCode">HS Code</Label>
                                    <Input
                                        id="hsCode"
                                        placeholder="HS Code"
                                        value={hsCode}
                                        readOnly
                                        className="bg-gray-700 text-gray-100 rounded-lg"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="quantity">Quantity</Label>
                                    <Input
                                        id="quantity"
                                        type="number"
                                        step="0.001"
                                        placeholder="Enter quantity"
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                        className="bg-gray-700 text-gray-100 rounded-lg"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="unitPrice">Unit Price</Label>
                                    <Input
                                        id="unitPrice"
                                        type="number"
                                        step="0.001"
                                        placeholder="Enter unit price"
                                        value={unitPrice}
                                        onChange={(e) => setUnitPrice(e.target.value)}
                                        className="bg-gray-700 text-gray-100 rounded-lg"
                                        required
                                    />
                                </div>
                            </div>
                            <Button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md w-full md:w-auto">
                                Generate Invoice
                            </Button>
                        </form>
                    </CardContent>
                </Card>
                <Card className="bg-gray-800 border-gray-700 mb-4">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold">Search Invoices</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
                            <Input
                                placeholder="Enter Invoice Number or Bill To"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-gray-700 text-gray-100 rounded-lg flex-1"
                            />
                            <Button onClick={handleSearch} className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md w-full md:w-auto">
                                <Search className="h-5 w-5" />
                            </Button>
                        </div>
                        {searchResults && searchResults.length > 0 && (
                            <div className="mt-4">
                                <h3 className="text-lg font-bold">Invoice Details</h3>
                                {searchResults.map((result, index) => (
                                    <div key={index} className="mb-4 p-4 border border-gray-700 rounded-lg">
                                        <p><strong>Bill To:</strong> {result.billTo}</p>
                                        <p><strong>Ship To:</strong> {result.shipTo}</p>
                                        <p><strong>Invoice Number:</strong> {result.invoiceNumber}</p>
                                        <p><strong>Date:</strong> {result.invoiceDate}</p>
                                        <p><strong>Customer ID:</strong> {result.customerId}</p>
                                        <p><strong>Description:</strong> {result.description}</p>
                                        <p><strong>HS Code:</strong> {result.hsCode}</p>
                                        <p><strong>Quantity:</strong> {result.quantity}</p>
                                        <p><strong>Unit Price:</strong> {result.unitPrice}</p>
                                        <p><strong>Amount:</strong> {result.amount}</p>
                                        {result.pdfUrl && (
                                            <Button
                                                onClick={() => window.open(result.pdfUrl, '_blank')}
                                                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md mt-2 w-full md:w-auto"
                                            >
                                                Download Invoice
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}