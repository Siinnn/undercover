'use client';

import { Suspense, use, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useGameStore } from '@/hooks/useGameStore';
import { Theme } from '@/lib/types';
import { useGameSync, usePlayersSync, usePlayedWordsSync } from '@/hooks/useGameSync';
import { assignRoles, distributeWords, calculateScores } from '@/lib/game-engine';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { WordDisplay } from '@/components/game/WordDisplay';
import { VoteCard } from '@/components/game/VoteCard';
import { Leaderboard } from '@/components/game/Leaderboard';
import { Card, CardContent } from '@/components/ui/card';
import { Copy, Users, Send } from 'lucide-react';
import { toast } from 'sonner';

function GameRoomContent({ params }: { params: Promise<{ roomCode: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const playerName = searchParams.get('playerName');
  
  // Custom hooks (WebSockets & Store)
  useGameSync(resolvedParams.roomCode);
  usePlayersSync();
  usePlayedWordsSync();

  const room = useGameStore(state => state.room);
  const players = useGameStore(state => state.players);
  const playedWords = useGameStore(state => state.playedWords);
  const currentPlayer = players.find(p => p.name === playerName);
  const isHost = currentPlayer?.is_host;

  const [localVoteId, setLocalVoteId] = useState<string | null>(null);
  const [typedWord, setTypedWord] = useState('');
  const [maxRounds, setMaxRounds] = useState<number>(3); // Choix par défaut Hôte
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectedThemeIds, setSelectedThemeIds] = useState<string[]>([]);
  const [playedWordPairIds, setPlayedWordPairIds] = useState<string[]>([]);

  useEffect(() => {
    if (isHost && room?.status === 'LOBBY') {
      const loadThemes = async () => {
        // Optionnellement, on pourrait filtrer, mais pour l'instant on veut tous les thèmes, 
        // y compris ceux insérés en SQL au tout début (qui n'ont pas de user_id).
        const { data } = await supabase.from('themes').select('*').order('name');
        if (data) setThemes(data as Theme[]);
      };
      loadThemes();
    }
  }, [isHost, room?.status]);

  useEffect(() => {
    // Passage automatique à FINISHED si tout le monde a voté
    if (isHost && room?.status === 'VOTING' && !isFinishing) {
      if (players.length > 0 && players.every(p => p.has_voted)) {
        setIsFinishing(true);
        finishVoting();
      }
    }
  }, [players, room?.status, isHost, isFinishing]);

  // Helper pour savoir qui doit jouer (déplacé ici pour être accessible dans useEffect)
  const currentTurnPlayerId = room?.turn_order?.[room?.turn_index];
  const isMyTurn = currentTurnPlayerId === currentPlayer?.id;
  const currentTurnPlayer = players.find(p => p.id === currentTurnPlayerId);

  useEffect(() => {
    if (!playerName && room) {
      router.push('/');
    }
  }, [playerName, room, router]);

  useEffect(() => {
    if (isMyTurn && room?.status === 'PLAYING') {
      toast.success("C'est à votre tour de jouer !", { duration: 4000 });
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const ctx = new AudioContextClass();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, ctx.currentTime);
          gain.gain.setValueAtTime(0.1, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.5);
        }
      } catch (e) {
        // Ignorer les erreurs Web Audio API
      }
    }
  }, [isMyTurn, room?.status]);

  if (!room || !currentPlayer) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">Connexion...</div>;
  }

  // == ACTIONS DU HOST ==
  const startGame = async () => {
    if (players.length < 3) {
      return toast("Il faut au moins 3 joueurs !");
    }

    try {
      // 1. Choix du mot via la base de données
      let wordsQuery = supabase.from('word_pairs').select('id, word_civil, word_imposter');
      if (selectedThemeIds.length > 0) {
        wordsQuery = wordsQuery.in('theme_id', selectedThemeIds);
      }
      
      const { data: wordsData, error: wordsError } = await wordsQuery;
        
      if (wordsError || !wordsData || wordsData.length === 0) {
        return toast("Erreur: Aucun mot trouvé dans la base de données.");
      }

      let availableWords = wordsData.filter(row => !playedWordPairIds.includes(row.id));
      
      if (availableWords.length === 0) {
        toast("Déjà vu ! Tous les mots de cette sélection ont été joués. Réinitialisation de la liste.");
        setPlayedWordPairIds([]);
        availableWords = wordsData;
      }
      
      const randomRow = availableWords[Math.floor(Math.random() * availableWords.length)];
      setPlayedWordPairIds(prev => [...prev, randomRow.id]);
      
      // On tire à pile ou face quel mot sera celui des civils et celui de l'imposteur
      // pour éviter qu'un joueur ne devine son rôle s'il retombe sur la même paire.
      const isFlipped = Math.random() > 0.5;

      const selectedWordPair = {
        civilian: isFlipped ? randomRow.word_civil : randomRow.word_imposter,
        imposter: isFlipped ? randomRow.word_imposter : randomRow.word_civil
      };

      // Assigner Rôles et Distribuer
      const updatedPlayersBase = assignRoles(players, 1);
      const finalPlayers = distributeWords(updatedPlayersBase, selectedWordPair);

      for (const p of finalPlayers) {
        await supabase.from('players').update({ 
          role: p.role, 
          word: p.word,
          is_alive: true,
          has_voted: false,
          voted_for: null
        }).eq('id', p.id);
      }

      // Nettoyer les anciens mots si on relance
      if (playedWords.length > 0) {
        await supabase.from('played_words').delete().eq('room_id', room.id);
      }

      // 4. Mélanger l'ordre des tours
      const turnOrder = finalPlayers.map(p => p.id).sort(() => Math.random() - 0.5);

      await supabase.from('rooms').update({ 
        status: 'PLAYING', 
        round_number: 1,
        max_rounds: maxRounds,
        turn_order: turnOrder,
        turn_index: 0
      }).eq('id', room.id);

      setIsFinishing(false);

    } catch (e) {
      console.error(e);
      toast("Erreur lancement jeu");
    }
  };

  const forceVoting = async () => {
    await supabase.from('rooms').update({ status: 'VOTING' }).eq('id', room.id);
    toast("Passage à la phase de vote !");
  };

  const finishVoting = async () => {
    // Calcul et maj des scores
    const newScores = calculateScores(players);
    for (const p of newScores) {
      await supabase.from('players').update({ 
        score: p.score, 
        last_score_gained: p.last_score_gained || 0 
      }).eq('id', p.id);
    }
    
    await supabase.from('rooms').update({ status: 'FINISHED' }).eq('id', room.id);
  };

  const nextRound = async () => {
    // Nettoyer les mots joués de la partie qui vient de se terminer
    await supabase.from('played_words').delete().eq('room_id', room.id);
    await supabase.from('rooms').update({ status: 'LOBBY' }).eq('id', room.id);
  };

  // == ACTIONS JOUEURS EN COURS DE PARTIE ==
  const submitWord = async () => {
    if (!typedWord.trim() || !isMyTurn) return;
    setIsSubmitting(true);

    try {
      // 1. Ajouter le mot
      await supabase.from('played_words').insert({
        room_id: room.id,
        player_id: currentPlayer.id,
        content: typedWord.trim()
      });

      // 2. Calculer le prochain tour
      let nextIndex = room.turn_index + 1;
      let nextRoundNumber = room.round_number;
      let nextStatus = room.status;

      if (nextIndex >= room.turn_order.length) {
        // Fin d'un tour complet
        nextIndex = 0;
        nextRoundNumber++;
        if (nextRoundNumber > room.max_rounds) {
          nextStatus = 'VOTING'; // On a fait tous les mots, on passe au vote
        }
      }

      await supabase.from('rooms').update({
        turn_index: nextIndex,
        round_number: nextRoundNumber,
        status: nextStatus
      }).eq('id', room.id);

      setTypedWord('');
    } catch (error) {
      toast("Erreur lors de l'envoi du mot");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectVote = (targetId: string) => {
    if (currentPlayer.has_voted) return;
    setLocalVoteId(targetId);
  };

  const confirmVote = async () => {
    if (!localVoteId || currentPlayer.has_voted) return;
    setIsSubmitting(true);
    try {
      await supabase.from('players').update({ 
        has_voted: true, 
        voted_for: localVoteId 
      }).eq('id', currentPlayer.id);
      toast("Vote validé définitif !");
    } catch {
      toast("Erreur lors du vote");
    } finally {
      setIsSubmitting(false);
    }
  };

  // == VUES ==
  return (
    <main className="min-h-screen bg-zinc-950 text-white p-4 flex flex-col items-center">
      {/* HEADER GLOBALE */}
      <header className="w-full max-w-2xl flex items-center justify-between py-4 border-b border-zinc-800 mb-6">
        <div className="flex gap-4 items-center">
          <Badge text={room.status} />
          <h1 className="text-xl font-bold tracking-tight">Salle: {room.code}</h1>
        </div>
        <div className="flex bg-zinc-900 border border-zinc-700 px-3 py-1 rounded-full text-sm items-center gap-2 cursor-pointer hover:bg-zinc-800 transition-colors" 
             onClick={() => {
               navigator.clipboard.writeText(room.code);
               toast('Code copié !');
             }}>
          Code <Copy className="w-3 h-3" />
        </div>
      </header>

      {/* VUE LOBBY */}
      {room.status === 'LOBBY' && (
        <section className="w-full max-w-2xl animate-in fade-in zoom-in-95">
          <Card className="bg-zinc-900 border-zinc-800 mb-6">
            <CardContent className="p-6 flex flex-col items-center text-center gap-4">
              <Users className="w-12 h-12 text-primary" />
              <h2 className="text-2xl font-semibold">En attente de joueurs...</h2>
              <p className="text-zinc-400">({players.length}/8 joueurs présents)</p>
              
              <div className="flex flex-wrap gap-2 justify-center mt-4 w-full">
                {players.map(p => (
                  <div key={p.id} className="bg-zinc-800 px-4 py-2 rounded-lg flex items-center gap-2 font-medium">
                    {p.name} {p.is_host && '👑'}
                  </div>
                ))}
              </div>

              {isHost && (
                 <div className="mt-8 pt-4 border-t border-zinc-800 w-full">
                   <label className="text-sm text-zinc-400 mb-2 block">Nombre de mots par joueur :</label>
                   <Input 
                     type="number" 
                     min={1} 
                     max={10} 
                     value={maxRounds} 
                     onChange={(e) => setMaxRounds(parseInt(e.target.value) || 3)}
                     className="w-24 text-center mx-auto text-white bg-zinc-800 border-zinc-700"
                   />
                   <div className="mt-4">
                     <label className="text-sm text-zinc-400 mb-2 block">Thèmes de la partie :</label>
                     <div className="flex flex-wrap gap-3">
                       <label 
                         className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-colors border ${
                           selectedThemeIds.length === 0 
                             ? 'bg-primary/10 text-primary border-primary/50 shadow-[0_0_10px_rgba(var(--primary),0.1)]' 
                             : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                         }`}
                       >
                         <input 
                           type="checkbox" 
                           className="accent-primary w-4 h-4 cursor-pointer"
                           checked={selectedThemeIds.length === 0}
                           onChange={() => setSelectedThemeIds([])}
                         />
                         🎲 Tous (Mix global)
                       </label>
                       {themes.map(t => {
                         const isSelected = selectedThemeIds.includes(t.id);
                         return (
                           <label 
                             key={t.id}
                             className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-colors border ${
                               isSelected 
                                 ? 'bg-primary/10 text-primary border-primary/50 shadow-[0_0_10px_rgba(var(--primary),0.1)]' 
                                 : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                             }`}
                           >
                             <input 
                               type="checkbox" 
                               className="accent-primary w-4 h-4 cursor-pointer"
                               checked={isSelected}
                               onChange={(e) => {
                                 if (e.target.checked) {
                                   setSelectedThemeIds(prev => [...prev, t.id]);
                                 } else {
                                   setSelectedThemeIds(prev => prev.filter(id => id !== t.id));
                                 }
                               }}
                             />
                             {t.name} {t.is_official && <span title="Thème Officiel">⭐</span>}
                           </label>
                         );
                       })}
                     </div>
                   </div>
                 </div>
              )}
            </CardContent>
          </Card>
          
          {isHost ? (
            <Button size="lg" className="w-full font-bold text-lg" onClick={startGame}>
              Démarrer la partie
            </Button>
          ) : (
            <p className="text-center text-zinc-500 italic">En attente du lancement par l'hôte...</p>
          )}
        </section>
      )}

      {/* VUE JEU EN COURS (TOURS DE PAROLE) */}
      {room.status === 'PLAYING' && (
        <section className="w-full max-w-2xl flex flex-col gap-8 animate-in slide-in-from-bottom-4">
          
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-1 relative shadow-inner overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-primary/20" />
             <WordDisplay word={currentPlayer.word} />
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between text-zinc-400 text-sm">
                <span>Tour {room.round_number} sur {room.max_rounds}</span>
                {currentTurnPlayer && (
                   <span className="text-primary animate-pulse">C'est le tour de {currentTurnPlayer.name} !</span>
                )}
            </div>

            {/* Affichage des joueurs et de leurs mots joués */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {players.map(p => {
                const pWords = playedWords.filter(pw => pw.player_id === p.id);
                const isCurrentTurn = currentTurnPlayerId === p.id;
                return (
                  <Card key={p.id} className={`bg-zinc-900/50 transition-all ${isCurrentTurn ? 'border-primary ring-1 ring-primary shadow-lg scale-105' : 'border-zinc-800'}`}>
                    <CardContent className="p-4 flex flex-col gap-3">
                       <span className={`font-bold flex items-center gap-2 ${isCurrentTurn ? 'text-primary' : 'text-zinc-300'}`}>
                         {p.name}
                         {isCurrentTurn && <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                       </span>
                       <div className="flex flex-col gap-1 min-h-[40px]">
                         {pWords.length === 0 ? (
                           <span className="italic text-zinc-600 text-sm">En attente...</span>
                         ) : (
                           pWords.map((pw, i) => (
                             <div key={i} className="bg-zinc-800/80 px-2 py-1 rounded text-white text-sm break-words">
                               {pw.content}
                             </div>
                           ))
                         )}
                       </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Input si c'est notre tour */}
            {isMyTurn ? (
               <div className="flex gap-2">
                 <Input 
                   placeholder="Décrivez votre mot secrètement..." 
                   className="flex-1 bg-zinc-800 border-zinc-700 focus:border-primary"
                   value={typedWord}
                   onChange={e => setTypedWord(e.target.value)}
                   onKeyDown={e => e.key === 'Enter' && submitWord()}
                   autoFocus
                 />
                 <Button onClick={submitWord} disabled={!typedWord.trim() || isSubmitting}>
                   <Send className="w-4 h-4" />
                 </Button>
               </div>
            ) : (
               <div className="p-3 border border-zinc-800 bg-zinc-900 rounded-md text-center text-zinc-500 text-sm">
                 Patientez pendant que {currentTurnPlayer?.name} écrit son mot...
               </div>
            )}
          </div>

          {isHost && (
            <div className="pt-8 border-t border-zinc-800 text-center">
              <Button onClick={forceVoting} variant="destructive" className="w-full font-bold">
                Mettre fin au tour et lancer le Vote
              </Button>
            </div>
          )}
        </section>
      )}

      {/* VUE VOTE (NOUVELLE) */}
      {room.status === 'VOTING' && (
         <section className="w-full max-w-2xl flex flex-col gap-8 animate-in slide-in-from-bottom-4">
           {/* Rappel des mots (petit) */}
           <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs max-h-32 overflow-y-auto mb-2 text-zinc-400">
              <p className="font-bold text-zinc-300 mb-2">Récapitulatif des mots :</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                 {players.map(p => {
                    const pWords = playedWords.filter(pw => pw.player_id === p.id).map(pw => pw.content).join(', ');
                    if (!pWords) return null;
                    return <span key={p.id}><b>{p.name}</b>: {pWords}</span>
                 })}
              </div>
           </div>

           <div className="text-center">
            <h3 className="text-lg font-medium mb-2 text-zinc-100">C'est l'heure du verdict. Qui est l'imposteur ?</h3>
            <p className="text-sm font-bold text-primary mb-6 animate-pulse">
                {players.filter(p => p.has_voted).length} / {players.length} joueurs ont voté
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {players.filter(p => p.id !== currentPlayer.id).map(p => (
                <VoteCard 
                  key={p.id} 
                  player={p} 
                  isSelectable={!currentPlayer.has_voted}
                  isSelected={localVoteId === p.id || currentPlayer.voted_for === p.id}
                  onSelect={selectVote}
                />
              ))}
            </div>

            {!currentPlayer.has_voted && localVoteId && (
               <div className="mt-8 animate-in slide-in-from-bottom border-t border-zinc-800 pt-6">
                 <Button 
                   size="lg" 
                   variant="destructive"
                   className="w-full font-bold max-w-xs mx-auto shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:shadow-[0_0_30px_rgba(220,38,38,0.4)] transition-shadow" 
                   onClick={confirmVote}
                   disabled={isSubmitting}
                 >
                   🚨 Valider mon choix définitif
                 </Button>
               </div>
            )}

            {currentPlayer.has_voted && (
               <p className="mt-8 text-primary font-medium animate-pulse">Vote bloqué. En attente des autres joueurs...</p>
            )}
          </div>

          {isHost && (
            <div className="pt-8 border-t border-zinc-800 text-center">
              <Button onClick={() => { setIsFinishing(true); finishVoting(); }} variant="destructive">
                Révéler les résultats (Forcer)
              </Button>
            </div>
          )}
         </section>
      )}

      {/* VUE RESULTAT ET LEADERBOARD */}
      {room.status === 'FINISHED' && (
        <section className="w-full max-w-2xl animate-in fade-in">
          <Leaderboard players={players} />
          
          <div className="mt-8">
            <h3 className="text-xl font-bold mb-4 text-center">Les rôles de ce round :</h3>
            <div className="grid grid-cols-2 gap-4 mb-8">
              {players.map(p => (
                 <VoteCard 
                  key={p.id} 
                  player={p} 
                  isSelectable={false}
                  isSelected={false}
                  onSelect={() => {}}
                  showRole={true}
                />
              ))}
            </div>
          </div>

          {isHost ? (
            <Button className="w-full" size="lg" onClick={nextRound}>Nouveau Round</Button>
          ) : (
             <p className="text-center text-zinc-500">L'hôte prépare le round suivant...</p>
          )}
        </section>
      )}
    </main>
  );
}

// Petit composant helper pour les badges de statuts
function Badge({ text }: { text: string }) {
  const colors: Record<string, string> = {
    'LOBBY': 'bg-blue-500/20 text-blue-400 border-blue-500/50',
    'PLAYING': 'bg-red-500/20 text-red-400 border-red-500/50',
    'VOTING': 'bg-orange-500/20 text-orange-400 border-orange-500/50',
    'FINISHED': 'bg-green-500/20 text-green-400 border-green-500/50'
  };
  return (
    <span className={`px-2 py-1 text-xs font-bold uppercase rounded-md border ${colors[text] || 'bg-zinc-800'}`}>
      {text}
    </span>
  );
}

export default function GameRoom({ params }: { params: Promise<{ roomCode: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">Chargement du salon...</div>}>
      <GameRoomContent params={params} />
    </Suspense>
  );
}
