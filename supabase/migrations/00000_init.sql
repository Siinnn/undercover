-- Création de la table des salons (Rooms)
CREATE TABLE public.rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL, -- Ex: "XK9V"
  status TEXT DEFAULT 'LOBBY' CHECK (status IN ('LOBBY', 'PLAYING', 'FINISHED')),
  round_number INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  current_turn_player_id UUID -- Peut être nul en phase de lobby ou résultat global
);

-- Création de la table des joueurs (Players)
CREATE TABLE public.players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_host BOOLEAN DEFAULT false,
  role TEXT CHECK (role IN ('CIVILIAN', 'IMPOSTER', 'UNASSIGNED')) DEFAULT 'UNASSIGNED',
  word TEXT,
  score INTEGER DEFAULT 0,
  is_alive BOOLEAN DEFAULT true,
  has_voted BOOLEAN DEFAULT false,
  voted_for UUID REFERENCES public.players(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_players_room_id ON public.players(room_id);
CREATE INDEX idx_rooms_code ON public.rooms(code);

-- Activation de Realtime pour synchroniser l'état
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.players;

-- Policies RLS (Row Level Security) - Ouvert pour le proto local
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

-- Autoriser la lecture, insertion et modification globale sur les tables. 
-- *En prod, il vaut mieux restreindre via auth JWT "anon".*
CREATE POLICY "Allow public read access to rooms" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "Allow public insert to rooms" ON public.rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to rooms" ON public.rooms FOR UPDATE USING (true);

CREATE POLICY "Allow public read access to players" ON public.players FOR SELECT USING (true);
CREATE POLICY "Allow public insert to players" ON public.players FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to players" ON public.players FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to players" ON public.players FOR DELETE USING (true);
