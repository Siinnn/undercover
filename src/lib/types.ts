import { Role } from './game-engine';

export type RoomStatus = 'LOBBY' | 'PLAYING' | 'VOTING' | 'FINISHED';

export interface RoomState {
  id: string;
  code: string;
  status: RoomStatus;
  round_number: number;
  current_turn_player_id: string | null;
  turn_order: string[]; // UUIDs des joueurs
  turn_index: number;
  max_rounds: number;
  turn_duration: number;
  created_at: string;
}

export interface PlayedWord {
  id: string;
  room_id: string;
  player_id: string;
  content: string;
  created_at: string;
}

export interface Theme {
  id: string;
  name: string;
  slug: string;
  is_official: boolean;
  user_id?: string;
  created_at: string;
}

export interface WordPair {
  id: string;
  theme_id: string;
  word_civil: string;
  word_imposter: string;
}

export interface PlayerState {
  id: string;
  room_id: string;
  name: string;
  color: string;
  is_host: boolean;
  role: Role;
  word: string | null;
  score: number;
  last_score_gained: number;
  is_alive: boolean;
  has_voted: boolean;
  voted_for: string | null;
}
