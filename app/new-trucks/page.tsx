'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, ArrowUp } from 'lucide-react';
import { Button } from "../components/ui/button";
import Input from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { auth, database } from '../firebaseConfig'; // Import initialized Firebase services
import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth';
import { getDatabase, ref, push } from 'firebase/database';


export default function NewTruck() {
  const [truck, setTruck] = useState({
    id: '',
    owner: '',
    transporter: '',
    driver: '',
    agoComps: ['', '', ''],
    pmsComps: ['', '', ''],
  });
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [loading, setLoading] = useState(false);
  const [addMoreComps, setAddMoreComps] = useState(false);
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

  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
    router.push('/login');
  };

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof typeof truck, index?: number) => {
    const value = e.target.value;
    if (index !== undefined && (field === 'agoComps' || field === 'pmsComps')) {
      setTruck(prev => ({
        ...prev,
        [field]: prev[field].map((comp, i) => (i === index ? value : comp)),
      }));
    } else {
      setTruck(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = () => {
    if (!truck.id || !truck.owner || !truck.transporter || !truck.driver || truck.agoComps.some(comp => !comp || isNaN(Number(comp))) || truck.pmsComps.some(comp => !comp || isNaN(Number(comp)))) {
      alert('Please fill in all fields with valid data.');
      return;
    }

    setLoading(true);
    const db = getDatabase();
    const trucksRef = ref(db, 'trucks');
    const dataToSave: any = {
      truck_no: truck.id,
      owner: truck.owner,
      transporter: truck.transporter,
      driver: truck.driver,
      ago_comp_1: truck.agoComps[0],
      ago_comp_2: truck.agoComps[1],
      ago_comp_3: truck.agoComps[2],
      pms_1: truck.pmsComps[0],
      pms_2: truck.pmsComps[1],
      pms_3: truck.pmsComps[2],
    };

    if (addMoreComps) {
      dataToSave['ago_comp_4'] = truck.agoComps[3];
      dataToSave['ago_comp_5'] = truck.agoComps[4];
      dataToSave['ago_comp_6'] = truck.agoComps[5];
      dataToSave['pms_4'] = truck.pmsComps[3];
      dataToSave['pms_5'] = truck.pmsComps[4];
      dataToSave['pms_6'] = truck.pmsComps[5];
    }

    push(trucksRef, dataToSave).then(() => {
      alert('Truck added successfully!');
      setLoading(false);
      router.push('/truck-details');
    }).catch(error => {
      console.error("Error adding truck:", error);
      setLoading(false);
    });
  };

  const calculateTotal = (comps: string[]) => {
    return comps.reduce((total, comp) => total + (parseFloat(comp) || 0), 0);
  };

  const isValidNumber = (value: string) => {
    return !isNaN(Number(value)) && value.trim() !== '';
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center">
      <header className="sticky top-0 z-20 border-b border-gray-800 bg-gray-900/70 backdrop-blur-md supports-[backdrop-filter]:bg-gray-900/60 w-full">
        <div className="container flex h-16 items-center justify-between mx-auto px-4">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-100" onClick={() => router.push('/truck-details')}>
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back</span>
            </Button>
            <h1 className="text-xl font-bold">New Truck</h1>
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
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full text-blue-500" role="status"></div>
          </div>
        ) : (
          <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-200">New Truck Details</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-gray-400">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block text-gray-300">Truck No:</label>
                  <Input
                    type="text"
                    value={truck.id}
                    onChange={(e) => handleChange(e, 'id')}
                    className={`bg-gray-800 border ${truck.id.trim() ? 'border-green-500' : 'border-red-500'} text-gray-100 placeholder-gray-400 w-full`}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-300">Owner:</label>
                  <Input
                    type="text"
                    value={truck.owner}
                    onChange={(e) => handleChange(e, 'owner')}
                    className={`bg-gray-800 border ${truck.owner.trim() ? 'border-green-500' : 'border-red-500'} text-gray-100 placeholder-gray-400 w-full`}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-300">Transporter:</label>
                  <Input
                    type="text"
                    value={truck.transporter}
                    onChange={(e) => handleChange(e, 'transporter')}
                    className={`bg-gray-800 border ${truck.transporter.trim() ? 'border-green-500' : 'border-red-500'} text-gray-100 placeholder-gray-400 w-full`}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-300">Driver:</label>
                  <Input
                    type="text"
                    value={truck.driver}
                    onChange={(e) => handleChange(e, 'driver')}
                    className={`bg-gray-800 border ${truck.driver.trim() ? 'border-green-500' : 'border-red-500'} text-gray-100 placeholder-gray-400 w-full`}
                  />
                </div>
                {truck.agoComps.map((comp, index) => (
                  <div className="mb-4" key={`agoComp${index}`}>
                    <label className="block text-gray-300">{`AGO Comp ${index + 1}:`}</label>
                    <Input
                      type="text"
                      value={comp}
                      onChange={(e) => handleChange(e, 'agoComps', index)}
                      className={`bg-gray-800 border ${isValidNumber(comp) ? 'border-green-500' : 'border-red-500'} text-gray-100 placeholder-gray-400 w-full`}
                    />
                  </div>
                ))}
                {truck.pmsComps.map((comp, index) => (
                  <div className="mb-4" key={`pmsComp${index}`}>
                    <label className="block text-gray-300">{`PMS ${index + 1}:`}</label>
                    <Input
                      type="text"
                      value={comp}
                      onChange={(e) => handleChange(e, 'pmsComps', index)}
                      className={`bg-gray-800 border ${isValidNumber(comp) ? 'border-green-500' : 'border-red-500'} text-gray-100 placeholder-gray-400 w-full`}
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  checked={addMoreComps}
                  onChange={() => {
                    setAddMoreComps(!addMoreComps);
                    if (!addMoreComps) {
                      setTruck(prev => ({
                        ...prev,
                        agoComps: [...prev.agoComps, '', '', ''],
                        pmsComps: [...prev.pmsComps, '', '', ''],
                      }));
                    } else {
                      setTruck(prev => ({
                        ...prev,
                        agoComps: prev.agoComps.slice(0, 3),
                        pmsComps: prev.pmsComps.slice(0, 3),
                      }));
                    }
                  }}
                  className="mr-2"
                />
                <label className="text-gray-300">Add 3 more AGO and PMS Comps</label>
              </div>
              <div className="flex justify-end space-x-2 mt-2">
                <Button size="sm" variant="primary" className="bg-green-500/20 hover:bg-green-500/30" onClick={handleSubmit}>
                  <Save className="h-4 w-4" />
                  <span className="ml-2">Submit</span>
                </Button>
              </div>
              <div className="mt-4">
                <p className="text-gray-300">AGO Total: {calculateTotal(truck.agoComps)}</p>
                <p className="text-gray-300">PMS Total: {calculateTotal(truck.pmsComps)}</p>
              </div>
            </CardContent>
          </Card>
        )}
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