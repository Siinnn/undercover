'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Gamepad2 } from 'lucide-react';

const PRESET_COLORS = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#22c55e', // Green
  '#0ea5e9', // Sky
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#ec4899', // Pink
];

export default function Home() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [playerColor, setPlayerColor] = useState(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]);
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const createRoom = async () => {
    if (!playerName) return alert("Saisissez votre pseudo !");
    setIsLoading(true);

    // 1. Purge automatique des salons vieux de plus de 24 heures
    // (pour ne pas supprimer les parties marathon en cours, 24h est le très bon standard pour les "party games")
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    await supabase.from('rooms').delete().lt('created_at', twentyFourHoursAgo);

    const roomCode = Math.random().toString(36).substring(2, 6).toUpperCase();

    // Insertion Room
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .insert({ code: roomCode, status: 'LOBBY' })
      .select()
      .single();

    if (roomError || !room) {
      console.error(roomError);
      setIsLoading(false);
      return alert("Erreur lors de la création du salon.");
    }

    // Insertion Host Player
    await supabase.from('players').insert({
      room_id: room.id,
      name: playerName,
      color: playerColor,
      is_host: true
    });

    router.push(`/${roomCode}?playerName=${encodeURIComponent(playerName)}`);
  };

  const joinRoom = async () => {
    if (!playerName || !code) return alert("Saisissez votre pseudo et le code du salon !");
    setIsLoading(true);

    // Verifier si le salon existe
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (roomError || !room) {
      setIsLoading(false);
      return alert("Salon introuvable.");
    }

    if (room.status !== 'LOBBY') {
      setIsLoading(false);
      return alert("La partie a déjà commencé.");
    }

    // Insertion nouveau joueur
    await supabase.from('players').insert({
      room_id: room.id,
      name: playerName,
      color: playerColor,
      is_host: false
    });

    router.push(`/${code.toUpperCase()}?playerName=${encodeURIComponent(playerName)}`);
  };

  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-10">
        <h1 className="text-5xl font-extrabold tracking-tight text-white mb-2 flex items-center justify-center gap-3">
          <Gamepad2 className="w-12 h-12 text-primary" />
          Undercover OS
        </h1>
        <p className="text-zinc-400">Le jeu de rôle silencieux. Démasquez l'imposteur.</p>
      </div>

      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white text-2xl text-center">Rejoindre / Créer</CardTitle>
          <CardDescription className="text-center">Préparez-vous à douter de vos amis.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Votre Pseudo</label>
            <Input 
              placeholder="Ex: Yanis" 
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white"
              style={{ color: playerColor }}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Couleur</label>
            <div className="flex gap-2 justify-between">
              {PRESET_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => setPlayerColor(color)}
                  className={`w-8 h-8 rounded-full transition-transform ${playerColor === color ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-zinc-900' : 'hover:scale-110'}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          
          <div className="space-y-4 pt-4 border-t border-zinc-800">
            <Button 
              onClick={createRoom} 
              disabled={isLoading || !playerName} 
              className="w-full font-bold"
            >
              Jouer une Nouvelle Partie (Hôte)
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-zinc-900 px-2 text-zinc-400">Ou rejoindre</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Input 
                placeholder="Code (Ex: XK9V)" 
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="bg-zinc-800 border-zinc-700 text-white uppercase"
                maxLength={4}
              />
              <Button 
                variant="secondary" 
                onClick={joinRoom}
                disabled={isLoading || !playerName || code.length !== 4}
                className="px-8"
              >
                Rejoindre
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <p className="mt-8 text-sm text-zinc-400 flex items-center gap-2 mb-4">
        <Users className="w-4 h-4" /> 3 à 8 Joueurs Recommandés
      </p>

      {session ? (
        <Button variant="outline" onClick={() => router.push('/dashboard')} className="text-zinc-400 border-zinc-700 bg-zinc-900 border-dashed">
          🔧 Gérer mes Thèmes personnalisés
        </Button>
      ) : (
        <Button variant="link" onClick={() => router.push('/login?mode=signup')} className="text-zinc-400">
          Créer un compte Créateur
        </Button>
      )}
    </main>
  );
}
