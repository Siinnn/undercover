import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useGameStore } from './useGameStore';
import { RoomState, PlayerState, PlayedWord } from '@/lib/types';

export function useGameSync(roomCode: string) {
  const setRoom = useGameStore(state => state.setRoom);
  const setPlayers = useGameStore(state => state.setPlayers);
  const setPlayedWords = useGameStore(state => state.setPlayedWords);

  useEffect(() => {
    if (!roomCode) return;

    // Load initial state
    const loadInitialState = async () => {
      // 1. Fetch Room
      const { data: roomData, error: roomErr } = await supabase
        .from('rooms')
        .select('*')
        .eq('code', roomCode)
        .single();
      
      if (roomErr) {
        console.error("Erreur chargement room:", roomErr);
        return;
      }
      setRoom(roomData as RoomState);

      // 2. Fetch Players
      if (roomData) {
        const { data: playersData, error: playersErr } = await supabase
          .from('players')
          .select('*')
          .eq('room_id', roomData.id)
          .order('created_at', { ascending: true });

        if (!playersErr && playersData) {
          setPlayers(playersData as PlayerState[]);
        }

        // 3. Fetch Played Words
        const { data: wordsData, error: wordsErr } = await supabase
          .from('played_words')
          .select('*')
          .eq('room_id', roomData.id)
          .order('created_at', { ascending: true });

        if (!wordsErr && wordsData) {
          setPlayedWords(wordsData as PlayedWord[]);
        }
      }
    };

    loadInitialState();

    // Subscribe to Room changes
    const roomSub = supabase.channel(`room_${roomCode}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'rooms',
        filter: `code=eq.${roomCode}`
      }, (payload) => {
        if (payload.new && Object.keys(payload.new).length > 0) {
          setRoom(payload.new as RoomState);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(roomSub);
    };
  }, [roomCode, setRoom, setPlayers]);

  // We need a separate effect to subscribe to players, since we need room ID.
  // We can get room_id from the store or derive it in the first effect.
  // To avoid complexity, let's subscribe to all players changes and filter in UI, 
  // or use another channel once we have roomId.
}

// Hook that subscribes to players once room is known
export function usePlayersSync() {
  const room = useGameStore(state => state.room);
  const setPlayers = useGameStore(state => state.setPlayers);

  useEffect(() => {
    if (!room?.id) return;

    const playersSub = supabase.channel(`players_${room.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'players',
        filter: `room_id=eq.${room.id}`
      }, async () => {
        // Au lieu de traiter chaque delta, on fetch tout pour garder l'ordre correct
        const { data } = await supabase
          .from('players')
          .select('*')
          .eq('room_id', room.id)
          .order('created_at', { ascending: true });
        
        if (data) setPlayers(data as PlayerState[]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(playersSub);
    }
  }, [room?.id, setPlayers]);
}

export function usePlayedWordsSync() {
  const room = useGameStore(state => state.room);
  const setPlayedWords = useGameStore(state => state.setPlayedWords);

  useEffect(() => {
    if (!room?.id) return;

    const wordsSub = supabase.channel(`words_${room.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'played_words',
        filter: `room_id=eq.${room.id}`
      }, async () => {
        const { data } = await supabase
          .from('played_words')
          .select('*')
          .eq('room_id', room.id)
          .order('created_at', { ascending: true });
        
        if (data) setPlayedWords(data as PlayedWord[]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(wordsSub);
    }
  }, [room?.id, setPlayedWords]);
}
