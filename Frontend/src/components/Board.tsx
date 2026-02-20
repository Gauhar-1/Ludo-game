import { useEffect, useMemo, useState } from 'react';
import { PlayerColor, useGame } from '../context/GameContext';
import { basePositions, commonPath, getActualPathIndex, homePath } from '../utils/gameLogic';
import { BOARD_SIZE, getTileClass, grid } from '../utils/boardStyle';
import { AnimatePresence, motion } from 'framer-motion';
import { User, ShieldCheck, Crosshair, Zap } from 'lucide-react';

const Board = () => {
  const { turn, positions, playerColor, setSelectedPieceIndex, selectedPieceIndex, timerSync, diceValue } = useGame();
  const [timeLeft, setTimeLeft] = useState(15);

  useEffect(() => {
    if (!timerSync) return;
    const updateTimer = () => {
      const elapsed = (Date.now() - timerSync.start) / 1000;
      const remaining = Math.max(0, (timerSync.totalTime / 1000) - elapsed);
      setTimeLeft(Math.ceil(remaining));
    };
    const interval = setInterval(updateTimer, 100);
    updateTimer();
    return () => clearInterval(interval);
  }, [timerSync]);

  const isMyTurn = turn === playerColor;

  const isPiecePlayable = (playerId: string, currentStep: number) => {
    if (playerId !== playerColor || !diceValue || !isMyTurn) return false;
    if (currentStep === -1) return diceValue === 6;
    return currentStep + diceValue <= 56;
  };

  // --- STACKING ENGINE ---
  const stackedPieces = useMemo(() => {
    const map: Record<string, any[]> = {};
    Object.entries(positions).forEach(([color, pieces]: [any, any]) => {
      pieces.forEach((step: number, idx: number) => {
        if (step === -1) return; // Ignore base pieces for stacking
        const isHomeRun = step >= 51;
        const pathIndex = isHomeRun ? step - 51 : getActualPathIndex(color as PlayerColor, step);
        const [r, c] = isHomeRun ? homePath[color][pathIndex] : commonPath[pathIndex];
        const key = `${r}-${c}`;
        if (!map[key]) map[key] = [];
        map[key].push({ color, idx, step });
      });
    });
    return map;
  }, [positions]);

  const maxTime = 15;
  const progress = (timeLeft / maxTime) * 100;

  return (
    <div className="w-full flex flex-col items-center justify-center font-sans select-none">
      
      {/* 1. CYBER HUD (Timer & Status) */}
      <div className="w-full max-w-md mb-6 px-4">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-3">
            <div className={`relative h-10 w-10 rounded-xl flex items-center justify-center border-2 border-black transition-all duration-500
              ${isMyTurn ? 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-white/5 border-white/10'}`}>
              <User size={20} className={isMyTurn ? 'text-black' : 'text-white/20'} />
            </div>
            <div>
              <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-500 leading-none mb-1">System Protocol</h3>
              <p className={`text-sm font-black italic uppercase ${isMyTurn ? 'text-amber-500' : 'text-white'}`}>
                {isMyTurn ? 'Authorized' : `Syncing: ${turn}`}
              </p>
            </div>
          </div>
          <div className="text-right flex flex-col items-end">
             <span className="text-[8px] font-black text-amber-500/50 uppercase tracking-widest mb-1">Response Time</span>
             <div className="text-2xl font-mono font-black text-white leading-none tracking-tighter">
                {timeLeft}<span className="text-[10px] text-amber-500 ml-0.5">S</span>
             </div>
          </div>
        </div>

        {/* THICK GLASS PROGRESS BAR */}
        <div className="relative h-2.5 w-full bg-black rounded-sm border border-white/10 overflow-hidden backdrop-blur-sm">
          <motion.div
            initial={{ width: "100%" }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: "linear" }}
            className={`h-full relative ${
              turn === 'red' ? 'bg-rose-600' 
              : turn === 'blue' ? 'bg-blue-600' 
              : turn === 'green' ? 'bg-emerald-600' 
              : 'bg-amber-500'
            }`}
          >
            <div className="absolute top-0 right-0 bottom-0 w-12 bg-white/20 blur-md" />
          </motion.div>
        </div>
      </div>

     {/* 2. THE BOARD */}
      <div className="relative w-full aspect-square max-h-[80vh] p-1.5 bg-black rounded-2xl border-2 border-white/5 shadow-2xl">
        <div
          className="grid w-full h-full border border-black bg-[#08080a]"
          style={{
            gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
            gridTemplateRows: `repeat(${BOARD_SIZE}, 1fr)`,
          }}
        >
          {grid.flat().map((type, index) => {
            const row = Math.floor(index / BOARD_SIZE);
            const col = index % BOARD_SIZE;
            const stackAtThisTile = stackedPieces[`${row}-${col}`] || [];
            const isStacked = stackAtThisTile.length > 1;

            return type.startsWith('center-') ? (
              <div key={index} className="relative w-full border border-black bg-black">
                <div className={`absolute inset-0 opacity-40 ${type.includes('yellow') ? 'bg-amber-600' : type.includes('green') ? 'bg-emerald-700' : type.includes('blue') ? 'bg-blue-700' : 'bg-rose-700'}`} />
              </div>
            ) : (
              <div key={index} className={`relative w-full h-full border-[0.5px] border-black flex items-center justify-center ${getTileClass(type)}`}>
                
                {/* Visualizing the Grid inside the Tile if Stacked */}
                <div className={`w-full h-full relative flex items-center justify-center ${isStacked ? 'grid grid-cols-2 gap-0.5 p-0.5' : ''}`}>
                  <AnimatePresence>
                    {stackAtThisTile.map((p) => {
                      const playable = isPiecePlayable(p.color, p.step);
                      const isSelected = selectedPieceIndex === p.idx && p.color === playerColor;
                      
                      return (
                        <motion.div
                          key={`${p.color}-${p.idx}`}
                          layoutId={`${p.color}-${p.idx}`}
                          // Soothing Spring Animation
                          transition={{ type: "spring", stiffness: 300, damping: 25 }}
                          onClick={() => playable && setSelectedPieceIndex(p.idx)}
                          className={`relative rounded-full shadow-2xl border-[1.5px] border-black transition-all cursor-pointer
                            ${p.color === 'red' ? 'bg-rose-600' : p.color === 'green' ? 'bg-emerald-600' : p.color === 'yellow' ? 'bg-amber-500' : 'bg-blue-600'}
                            ${isStacked ? 'size-full' : 'size-[85%]'}
                            ${isSelected ? 'z-50 scale-125 ring-2 ring-white ring-offset-1 ring-offset-black' : 'z-20'}
                            ${playable ? 'brightness-125 ring-2 ring-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.6)]' : ''}
                            ${p.color === playerColor && !playable && diceValue ? 'opacity-40 grayscale' : ''}
                          `}
                        >
                           <div className="absolute inset-0 flex items-center justify-center">
                              <div className="size-1 bg-white/40 rounded-full" />
                           </div>

                           {/* Stack Notification Badge */}
                           {isStacked && p.idx === stackAtThisTile[0].idx && (
                             <div className="absolute -top-1 -right-1 size-3 bg-black border border-white/20 rounded-full flex items-center justify-center text-[6px] font-bold text-white uppercase">
                               S
                             </div>
                           )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>

                {/* Star Safety */}
                {type.startsWith('star-') && stackAtThisTile.length === 0 && (
                  <div className='flex justify-center items-center absolute inert-0'>
                    <ShieldCheck size={12} className="text-white/20 " />
                  </div>
                )}

                {/* Base Pieces Logic (Standalone) */}
                {Object.entries(basePositions).map(([playerId, baseArr]) =>
                  baseArr.map(([br, bc], i) => {
                    if (row === br && col === bc && positions[playerId as PlayerColor][i] === -1) {
                      const playable = isPiecePlayable(playerId, -1);
                      const isSelected = selectedPieceIndex === i && playerId === playerColor;
                      return (
                        <motion.div
                          key={`base-${playerId}-${i}`}
                          layout
                          onClick={() => playable && setSelectedPieceIndex(i)}
                          className={`absolute size-[75%] rounded-lg border-2 border-black transition-all
                            ${playerId === 'red' ? 'bg-rose-900' : playerId === 'green' ? 'bg-emerald-900' : playerId === 'yellow' ? 'bg-amber-900' : 'bg-blue-900'}
                            ${isSelected ? 'scale-110 z-40 ring-2 ring-amber-500' : 'opacity-40'}
                            ${playable ? 'opacity-100 ring-2 ring-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.5)] cursor-pointer' : ''}`}
                        >
                           {playable && <Zap size={10} className="text-amber-400 fill-amber-400 m-auto absolute inset-0 animate-pulse" />}
                        </motion.div>
                      );
                    }
                    return null;
                  })
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Safety Footer */}
      <div className="mt-8 flex flex-col items-center gap-2 opacity-30 group hover:opacity-100 transition-all duration-700">
        <div className="flex items-center gap-2">
            <Crosshair size={12} className="text-white" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Neural Match Logic</span>
        </div>
        <div className="h-[1px] w-16 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
      </div>
    </div>
  );
};

export default Board;