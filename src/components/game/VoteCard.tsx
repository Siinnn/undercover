'use client';

import { PlayerState } from '@/lib/types';
import { Card, CardContent } from '../ui/card';
import { motion } from 'framer-motion';

interface VoteCardProps {
  player: PlayerState;
  isSelectable: boolean;
  isSelected: boolean;
  onSelect: (playerId: string) => void;
  showRole?: boolean;
}

export function VoteCard({ player, isSelectable, isSelected, onSelect, showRole }: VoteCardProps) {
  return (
    <motion.div
      whileHover={isSelectable && !isSelected ? { scale: 1.02 } : {}}
      whileTap={isSelectable ? { scale: 0.98 } : {}}
      onClick={() => isSelectable && onSelect(player.id)}
    >
      <Card className={`
        relative overflow-hidden cursor-pointer transition-colors duration-200
        ${!player.is_alive ? 'opacity-50 grayscale' : ''}
        ${isSelected ? 'bg-primary border-primary' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'}
      `}>
        <CardContent className="p-4 flex flex-col items-center gap-2">
          {/* Avatar simple textuel */}
          <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-lg font-bold">
            {player.name.charAt(0).toUpperCase()}
          </div>
          
          <div className="text-center">
            <h3 className={`font-medium ${isSelected ? 'text-primary-foreground' : 'text-zinc-100'}`}>
              {player.name}
            </h3>
            {showRole && (
              <p className={`text-xs mt-1 font-bold ${player.role === 'IMPOSTER' ? 'text-red-500' : 'text-blue-400'}`}>
                {player.role === 'IMPOSTER' ? 'Imposteur' : 'Civil'}
              </p>
            )}
            {!player.is_alive && (
              <p className="text-xs text-red-500 mt-1 uppercase tracking-wider font-bold">Éliminé</p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
