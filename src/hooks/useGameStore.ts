import { create } from 'zustand';
import { RoomState, PlayerState, PlayedWord } from '@/lib/types';

interface GameStore {
  // État local synchronisé
  room: RoomState | null;
  players: PlayerState[];
  playedWords: PlayedWord[];
  currentPlayerId: string | null; // L'ID du joueur actuel sur ce device
  
  // Actions
  setRoom: (room: RoomState | null) => void;
  setPlayers: (players: PlayerState[]) => void;
  setPlayedWords: (words: PlayedWord[]) => void;
  setCurrentPlayerId: (id: string | null) => void;
  
  // Helpers dérivés
  getCurrentPlayer: () => PlayerState | undefined;
  getIsHost: () => boolean;
}

export const useGameStore = create<GameStore>((set, get) => ({
  room: null,
  players: [],
  playedWords: [],
  currentPlayerId: null,

  setRoom: (room) => set({ room }),
  setPlayers: (players) => set({ players }),
  setPlayedWords: (playedWords) => set({ playedWords }),
  setCurrentPlayerId: (id) => set({ currentPlayerId: id }),

  getCurrentPlayer: () => {
    const { players, currentPlayerId } = get();
    return players.find(p => p.id === currentPlayerId);
  },

  getIsHost: () => {
    const player = get().getCurrentPlayer();
    return player?.is_host || false;
  }
}));
