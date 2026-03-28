'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Home, LogOut, FileText, Settings, KeySquare, Plus } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login');
      } else {
        setSession(session);
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push('/login');
      } else {
        setSession(session);
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mb-4" />
        <p className="text-zinc-400">Authentification en cours...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col font-sans">
      <nav className="w-full bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-6">
            <h1 
              className="text-xl font-bold text-white flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => router.push('/dashboard')}
            >
              <KeySquare className="text-primary w-5 h-5" />
              <span className="hidden sm:inline">Espace Créateur</span>
              <span className="sm:hidden">Créateur</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <Button 
              variant="outline" 
              onClick={() => router.push('/')} 
              className="bg-zinc-900 border-zinc-700 text-zinc-300 hover:text-white"
            >
              <Home className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Créer / Rejoindre une partie</span>
            </Button>
            
            <div className="w-px h-6 bg-zinc-800 mx-2 hidden sm:block" />
            
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-md bg-zinc-900 border border-zinc-800 text-sm text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              {session?.user?.email}
            </div>

            <Button 
              variant="ghost" 
              onClick={logout}
              className="text-zinc-400 hover:text-red-400 hover:bg-red-500/10 px-2 sm:px-4"
              title="Se déconnecter"
            >
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Déconnexion</span>
            </Button>
          </div>
        </div>
      </nav>

      <main className="flex-1 w-full relative">
        {children}
      </main>
    </div>
  );
}
