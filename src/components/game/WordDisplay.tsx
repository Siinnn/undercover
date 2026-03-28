'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '../ui/card';

interface WordDisplayProps {
  word: string | null;
}

export function WordDisplay({ word }: WordDisplayProps) {
  const [isRevealed, setIsRevealed] = useState(false);

  return (
    <div className="flex flex-col items-center gap-6 p-4">
      <h2 className="text-xl font-medium text-zinc-400">Votre mot secret</h2>
      
      <div 
        className="relative w-64 h-40 cursor-pointer perspective-1000"
        onClick={() => setIsRevealed(!isRevealed)}
      >
        <motion.div
          className="w-full h-full preserve-3d"
          animate={{ rotateX: isRevealed ? 180 : 0 }}
          transition={{ duration: 0.6, type: "tween", ease: "easeInOut" }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* FACE AVANT (CACHÉE) */}
          <Card className="absolute w-full h-full backface-hidden flex items-center justify-center bg-zinc-800 border-zinc-700 shadow-xl" style={{ backfaceVisibility: 'hidden' }}>
            <CardContent className="p-0 flex items-center justify-center text-center">
              <span className="text-zinc-400 font-semibold select-none flex flex-col gap-2">
                Tapez pour révéler
              </span>
            </CardContent>
          </Card>

          {/* FACE ARRIÈRE (MOT RÉVÉLÉ) */}
          <Card className="absolute w-full h-full backface-hidden flex items-center justify-center bg-zinc-100 border-zinc-200 shadow-2xl" style={{ backfaceVisibility: 'hidden', transform: 'rotateX(180deg)' }}>
            <CardContent className="p-0">
              <span className="text-3xl font-bold text-zinc-900 select-none tracking-tight">
                {word || "???"}
              </span>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <p className="text-sm text-zinc-400 max-w-xs text-center">
        Attention, assurez-vous que personne ne regarde votre écran.
      </p>
    </div>
  );
}
