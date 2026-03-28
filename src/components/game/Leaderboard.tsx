'use client';

import { PlayerState } from '@/lib/types';
import { motion } from 'framer-motion';

export function Leaderboard({ players }: { players: PlayerState[] }) {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="w-full max-w-md mx-auto space-y-4 p-4 text-zinc-100">
      <h2 className="text-2xl font-bold text-center text-primary mb-6">Leaderboard final</h2>
      
      <div className="flex flex-col gap-3">
        {sortedPlayers.map((player, index) => (
          <motion.div
            key={player.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`
              flex items-center justify-between p-4 rounded-xl border
              ${index === 0 ? 'bg-amber-900/20 border-amber-500/50 text-amber-500' : 'bg-zinc-900 border-zinc-800'}
            `}
          >
            <div className="flex items-center gap-4">
              <span className={`text-xl font-bold w-6 ${index === 0 ? 'text-amber-500' : 'text-zinc-400'}`}>
                {index + 1}
              </span>
              <div className="flex flex-col text-left">
                <span className="font-semibold text-lg">{player.name}</span>
                <span className="text-xs opacity-70">
                  {player.role === 'IMPOSTER' ? 'Imposteur' : 'Civil'}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="font-bold text-xl">{player.score}</span>
              <span className="text-zinc-400 text-sm ml-1">pts</span>
              {player.last_score_gained !== undefined && (
                <span className={`block text-xs font-bold ${player.last_score_gained > 0 ? 'text-green-500' : 'text-zinc-400'}`}>
                  +{player.last_score_gained}
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="mt-8 text-center text-sm text-zinc-400 flex flex-col gap-1">
        <p>🎯 Civils (Trouvé en solo) : <strong className="text-zinc-300">+150pts</strong></p>
        <p>🤝 Civils (En groupe) : <strong className="text-zinc-300">+100pts</strong></p>
        <p>🥷 Imposteur (Caché) : <strong className="text-zinc-300">+200pts</strong></p>
      </div>
    </div>
  );
}
