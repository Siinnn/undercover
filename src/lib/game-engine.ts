export type Role = 'CIVILIAN' | 'IMPOSTER' | 'UNASSIGNED';

export interface PlayerDefinition {
  id: string;
  name: string;
  role: Role;
  word: string | null;
  score: number;
  last_score_gained?: number;
  voted_for: string | null;
  is_alive: boolean;
  has_voted: boolean;
}

export interface WordPair {
  civilian: string;
  imposter: string;
}

/**
 * Assigne les rôles aléatoirement à une liste de joueurs
 */
export function assignRoles(players: PlayerDefinition[], imposterCount: number = 1): PlayerDefinition[] {
  if (players.length < 3) {
    throw new Error("Il faut au moins 3 joueurs pour démarrer une partie.");
  }

  // Mélanger les indices pour choisir l'imposteur
  const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
  
  return shuffledPlayers.map((player, index) => {
    return {
      ...player,
      role: index < imposterCount ? 'IMPOSTER' : 'CIVILIAN',
    };
  });
}

/**
 * Distribue les mots de la paire sélectionnée en fonction du rôle
 */
export function distributeWords(playersWithRoles: PlayerDefinition[], wordPair: WordPair): PlayerDefinition[] {
  return playersWithRoles.map(player => ({
    ...player,
    word: player.role === 'IMPOSTER' ? wordPair.imposter : wordPair.civilian
  }));
}

/**
 * Calcule les scores à la fin d'un round selon les règles strictes:
 * - Si tous les civils votent l'imposteur : Civils +100 pts, Imposteur 0.
 * - Si 1 seul civil a trouvé (Trouvé en solo) : Ce civil +150 pts.
 * - Si quelques civils ont trouvé (mais pas tous ni seul) : Ces civils +100 pts.
 * - Si personne ne vote l'imposteur : Imposteur +200 pts.
 * 
 * Note: Prend en charge 1 imposteur dans la logique actuelle.
 */
export function calculateScores(players: PlayerDefinition[]): PlayerDefinition[] {
  const imposter = players.find(p => p.role === 'IMPOSTER');
  const civilians = players.filter(p => p.role === 'CIVILIAN');
  
  if (!imposter) return players;

  const votesAgainstImposter = civilians.filter(c => c.voted_for === imposter.id);
  const everyoneVotedImposter = votesAgainstImposter.length === civilians.length && civilians.length > 0;
  const noOneVotedImposter = votesAgainstImposter.length === 0;

  return players.map(player => {
    let gainedPoints = 0;

    if (player.role === 'CIVILIAN') {
      const votedCorrectly = player.voted_for === imposter.id;
      if (everyoneVotedImposter) {
        gainedPoints = 100;
      } else if (votedCorrectly && votesAgainstImposter.length === 1) {
        gainedPoints = 150; // Trouvé en solo !
      } else if (votedCorrectly) {
        gainedPoints = 100; // Trouvé mais pas tous, ni seul
      }
    } else if (player.role === 'IMPOSTER') {
      if (noOneVotedImposter) {
        gainedPoints = 200;
      }
      // Sinon l'imposteur a été démasqué, il ne gagne rien (0)
    }

    return {
      ...player,
      score: player.score + gainedPoints,
      last_score_gained: gainedPoints
    };
  });
}
