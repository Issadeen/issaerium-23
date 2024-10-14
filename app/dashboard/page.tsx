'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, onAuthStateChanged, signOut, updateProfile } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Bell, ChevronDown, Sun, Truck, Clipboard, PlusCircle, Wallet, Edit3 } from 'lucide-react';
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";


const useTypewriter = (text: string, speed = 50) => {
  const [displayText, setDisplayText] = useState('');
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text.charAt(index));
        setIndex(index + 1);
      }, speed);
      return () => clearTimeout(timeout);
    }
  }, [index, text, speed]);

  return displayText;
};

interface DashboardCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  href: string;
}

const DashboardCard = ({ icon: Icon, title, description, href }: DashboardCardProps) => (
  <a href={href} className="flex-1">
    <Card className="flex-1 h-full bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gray-900/70 backdrop-blur-md supports-[backdrop-filter]:bg-gray-900/60">
        <CardTitle className="text-sm font-medium text-gray-200">{title}</CardTitle>
        <div className="rounded-full bg-blue-500/20 p-2">
          <Icon className="h-4 w-4 text-blue-400" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-gray-400">{description}</p>
      </CardContent>
    </Card>
  </a>
);

const MovingBackground = () => (
  <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-gray-800 text-[12vw] font-bold whitespace-nowrap animate-marquee relative">
        ISSAERIUM-23
      </div>
    </div>
  </div>
);

export default function Dashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [isEditingProfilePic, setIsEditingProfilePic] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();
  const welcomeText = useTypewriter("Welcome to your Issaerium 23 dashboard");
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user) {
        setIsLoggedIn(true);
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
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
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

  const handleProfilePicChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const storage = getStorage();
      const storageRef = ref(storage, `profile-pics/${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        await updateProfile(user, { photoURL: downloadURL });
        setProfilePic(downloadURL);
        setIsEditingProfilePic(false);
      }
      setIsUploading(false);
    }
  };

  if (!isLoggedIn) return null;

  return (
    <div className="relative min-h-screen bg-gray-900 text-gray-100 overflow-hidden">
      <MovingBackground />
      <header className={`fixed top-0 left-0 w-full z-20 border-b border-gray-800 ${isScrolled ? 'bg-gray-900/30' : 'bg-gray-900/70'} backdrop-blur-md supports-[backdrop-filter]:bg-gray-900/60 transition-colors duration-300`}>
        <div className="container flex h-16 items-center mx-auto px-4">
          <div className="mr-4 flex">
            <a className="mr-6 flex items-center space-x-2" href="/">
              <span className="font-bold sm:inline-block">Issaerium-23</span>
            </a>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-2">
            <button className="rounded bg-transparent hover:bg-gray-800 px-3 py-1.5 text-base text-gray-400 hover:text-gray-100 transition-all duration-200" onClick={handleLogout}>
              Logout
            </button>
            <button className="rounded bg-transparent hover:bg-gray-800 px-3 py-1.5 text-base text-gray-400 hover:text-gray-100 transition-all duration-200" onClick={() => setIsEditingProfilePic(true)}>
              <div className="h-10 w-10 rounded-full overflow-hidden">
                <img src={profilePic || "https://github.com/shadcn.png"} alt="Profile Picture" className="object-cover h-full w-full" />
                <div className="flex items-center justify-center bg-gray-600 text-white h-full w-full">CN</div>
              </div>
            </button>
          </div>
        </div>
      </header>
      <main className="container py-24 relative z-10 mx-auto px-4"> {/* Changed padding-top to 24 */}
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl text-blue-400 mb-8">
          {welcomeText}
        </h1>
        <p className="text-xl text-gray-400 mb-8">Here you can manage your:</p>
        <h2 className="scroll-m-20 border-b border-gray-800 pb-2 text-3xl font-semibold tracking-tight first:mt-0 mb-4 text-gray-200">
          Dashboard
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <DashboardCard icon={Truck} title="Truck Details" description="View and manage truck information." href="/truck-details" />
          <DashboardCard icon={Clipboard} title="Work Details" description="Track and review work assignments." href="/work-details" />
          <DashboardCard icon={PlusCircle} title="New Trucks" description="Add and register new trucks." href="/new-trucks" />
          <DashboardCard icon={Wallet} title="Wallet" description="Manage your wallet and transactions." href="/wallet" />
        </div>
      </main>
      {isEditingProfilePic && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg text-center">
            <Avatar className="mx-auto mb-4 h-48 w-48">
              <AvatarImage src={profilePic || "https://github.com/shadcn.png"} alt="Profile Picture" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <input type="file" accept="image/*" onChange={handleProfilePicChange} />
            {isUploading && (
              <div className="mt-4 flex justify-center">
                <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12"></div>
              </div>
            )}
            <div className="mt-4 flex justify-center">
              <Button onClick={() => setIsEditingProfilePic(false)} variant="ghost">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}