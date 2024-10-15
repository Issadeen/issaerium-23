'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Truck, Copy, Edit, Trash2, ArrowLeft, Check, ArrowUp } from 'lucide-react';
import { Button } from "../components/ui/button";
import Input from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { auth, database } from '../firebaseConfig'; // Import initialized Firebase services
import { signOut, onAuthStateChanged, getAuth } from 'firebase/auth';
import { ref, onValue, remove, get } from 'firebase/database';


interface TruckDetail {
  key: string;
  id: string;
  driver: string;
  transporter: string;
  agoComp: string;
  pms: string;
}

const TruckCard = ({ truck, onDelete, onEdit }: { truck: TruckDetail, onDelete: (key: string) => void, onEdit: (key: string) => void }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const textToCopy = `
      ${truck.id}
      Driver: ${truck.driver}
      Transporter: ${truck.transporter}
      AGO Comp: ${truck.agoComp}
      PMS: ${truck.pms}
    `;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-200">{truck.id}</CardTitle>
        <div className="rounded-full bg-blue-500/20 p-2">
          <Truck className="h-4 w-4 text-blue-400" />
        </div>
      </CardHeader>
      <CardContent className="text-xs text-gray-400">
        <p><span className="font-semibold text-gray-300">Driver:</span> {truck.driver}</p>
        <p><span className="font-semibold text-gray-300">Transporter:</span> {truck.transporter}</p>
        <p><span className="font-semibold text-gray-300">AGO Comp:</span> {truck.agoComp}</p>
        <p><span className="font-semibold text-gray-300">PMS:</span> {truck.pms}</p>
        <div className="flex justify-end space-x-2 mt-2">
          <Button size="sm" variant="ghost" className="bg-blue-500/20 hover:bg-blue-500/30" onClick={handleCopy}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
          <Button size="sm" variant="primary" className="bg-green-500/20 hover:bg-green-500/30" onClick={() => onEdit(truck.key)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" className="bg-red-500/20 hover:bg-red-500/30" onClick={() => onDelete(truck.key)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default function TruckDetails() {
  const [searchTerm, setSearchTerm] = useState('');
  const [trucks, setTrucks] = useState<TruckDetail[]>([]);
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth();
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
        const auth = getAuth();
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

  useEffect(() => {
    const db = database;
    const trucksRef = ref(db, 'trucks');
    onValue(trucksRef, (snapshot) => {
      const data = snapshot.val();
      const truckList = Object.keys(data).map(key => {
        const truck = data[key];
        const agoComp = [truck.ago_comp_1, truck.ago_comp_2, truck.ago_comp_3, truck.ago_comp_4].filter(Boolean).join(', ');
        const pms = [truck.pms_1, truck.pms_2, truck.pms_3, truck.pms_4].filter(Boolean).join(', ');
        return {
          key,
          id: truck.truck_no,
          driver: truck.driver,
          transporter: truck.transporter,
          agoComp: `${agoComp}, (Total: ${[truck.ago_comp_1, truck.ago_comp_2, truck.ago_comp_3, truck.ago_comp_4].reduce((acc, val) => acc + (parseFloat(val) || 0), 0)})`,
          pms: `${pms}, (Total: ${[truck.pms_1, truck.pms_2, truck.pms_3, truck.pms_4].reduce((acc, val) => acc + (parseFloat(val) || 0), 0)})`
        };
      });
      setTrucks(truckList);
    });
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 200) {
        setShowScrollToTop(true);
      } else {
        setShowScrollToTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
    router.push('/login');
  };

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const validateWorkId = async (inputWorkId: string) => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      const db = database;
      const userRef = ref(db, `users/${user.uid}`);
      const snapshot = await get(userRef);
      const userData = snapshot.val();
      return userData.workId === inputWorkId;
    }
    return false;
  };

  const handleEdit = async (key: string) => {
    const workId = prompt("Please enter your work ID:");
    if (workId && await validateWorkId(workId)) {
      router.push(`/edit-truck/${key}`);
    } else {
      alert("Invalid work ID. Please enter a valid work ID.");
    }
  };

  const handleDelete = async (key: string) => {
    const workId = prompt("Please enter your work ID:");
    if (workId && await validateWorkId(workId)) {
      const db = database;
      const truckRef = ref(db, `trucks/${key}`);
      remove(truckRef).then(() => {
        setTrucks(prevTrucks => prevTrucks.filter(truck => truck.key !== key));
      }).catch(error => {
        console.error("Error deleting truck:", error);
      });
    } else {
      alert("Invalid work ID. Please enter a valid work ID.");
    }
  };

  const filteredTrucks = trucks.filter(truck =>
    truck.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center">
      <header className="sticky top-0 z-20 border-b border-gray-800 bg-gray-900/70 backdrop-blur-md supports-[backdrop-filter]:bg-gray-900/60 w-full">
        <div className="container flex h-16 items-center justify-between mx-auto px-4">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-100" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back</span>
            </Button>
            <h1 className="text-xl font-bold">Truck Details</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="md" className="text-gray-400 hover:text-gray-100" onClick={handleLogout}>
              Logout
            </Button>
            <Button variant="ghost" size="md" className="text-gray-400 hover:text-gray-100">
              <Avatar>
                <AvatarImage src={profilePic || "https://github.com/shadcn.png"} alt="Profile Picture" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
            </Button>
          </div>
        </div>
      </header>
      <main className="container py-6 mx-auto px-4 flex-grow">
        <div className="mb-6 w-full">
          <Input
            type="text"
            placeholder="Search by truck no..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-400 w-full"
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 w-full">
          {filteredTrucks.map(truck => (
            <TruckCard key={truck.key} truck={truck} onDelete={handleDelete} onEdit={handleEdit} />
          ))}
        </div>
      </main>
      {showScrollToTop && (
        <button
          onClick={handleScrollToTop}
          className="fixed bottom-4 right-4 p-2 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-all duration-300"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}