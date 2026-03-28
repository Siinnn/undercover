'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Gamepad2 } from 'lucide-react';
import { toast } from 'sonner';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(searchParams.get('mode') === 'signup');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast("Compte créé avec succès ! Vous pouvez vous connecter.");
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast("Connexion réussie !");
        router.push('/dashboard');
      }
    } catch (error: any) {
      toast.error(error.message || "Erreur d'authentification");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
      <div className="mb-8 cursor-pointer" onClick={() => router.push('/')}>
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <Gamepad2 className="w-8 h-8 text-primary" /> Undercover OS
        </h1>
      </div>

      <Card className="w-full max-w-sm bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white text-xl text-center flex items-center justify-center gap-2">
            <span className={!isSignUp ? 'text-primary' : 'text-zinc-400'}>Connexion</span>
            <span className="text-zinc-500">|</span>
            <span className={isSignUp ? 'text-primary' : 'text-zinc-400'}>Inscription</span>
          </CardTitle>
          <CardDescription className="text-center">
            {isSignUp 
              ? "Créez votre compte pour construire vos propres listes de mots." 
              : "Connectez-vous pour accéder à vos thèmes."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex bg-zinc-800/50 p-1 rounded-lg mb-6 border border-zinc-800">
             <button
                className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${!isSignUp ? 'bg-zinc-700 text-white shadow' : 'text-zinc-400 hover:text-zinc-300'}`}
                onClick={() => setIsSignUp(false)}
             >
               Se connecter
             </button>
             <button
                className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${isSignUp ? 'bg-zinc-700 text-white shadow' : 'text-zinc-400 hover:text-zinc-300'}`}
                onClick={() => setIsSignUp(true)}
             >
               Créer un compte
             </button>
          </div>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-zinc-300">Email</label>
              <Input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-zinc-300">Mot de passe</label>
              <Input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>

            <Button type="submit" className="w-full font-bold" disabled={isLoading}>
              {isLoading ? "Chargement..." : isSignUp ? "S'inscrire" : "Se connecter"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">Chargement...</div>}>
      <LoginContent />
    </Suspense>
  );
}
