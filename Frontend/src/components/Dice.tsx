import { useGame } from '../context/GameContext';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ShieldAlert, Cpu, Swords, RotateCcw } from 'lucide-react';

const Dice = () => {
  const {
    socket, turn, diceValue, playerColor,
    roomCode, positions, falseMove, setFalseMove, setSelectedPieceIndex, selectedPieceIndex
  } = useGame();
  const { roomId } = useParams();

  const isMyTurn = turn === playerColor;

  const rollDice = () => {
    if (!isMyTurn || !roomId || !!diceValue) return;
    socket?.emit('roll-dice', { roomId });
  };


  const movePiece = () => {
    if (isMyTurn && diceValue !== null && selectedPieceIndex !== null) {
      socket.emit('piece-moved', {
        roomId,
        movedPieceIndex: selectedPieceIndex,
        color: playerColor,
        newPosition: positions
      });
      setSelectedPieceIndex(null);
    }
  };

  const renderPips = (num: number) => {
    const dotPositions = {
      1: [4],
      2: [0, 8],
      3: [0, 4, 8],
      4: [0, 2, 6, 8],
      5: [0, 2, 4, 6, 8],
      6: [0, 2, 3, 5, 6, 8],
    };

    return (
      <div className="grid grid-cols-3 gap-1 w-8 h-8">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="flex items-center justify-center">
            {dotPositions[num as keyof typeof dotPositions]?.includes(i) && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`h-1.5 w-1.5 rounded-full ${isMyTurn ? 'bg-black' : 'bg-amber-500'}`}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full flex justify-center px-2">
      <div className="bg-[#16161a] border border-white/10 p-4 rounded-[2.5rem] shadow-2xl w-full max-w-md relative overflow-hidden">

        {/* Subtle background tech-pattern */}
        <Cpu size={100} className="absolute -right-6 -top-6 text-white/[0.02] -rotate-12 pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between gap-4">

          {/* 1. COMPACT DICE CORE */}
          <div className="relative shrink-0">
            <motion.div
              whileTap={isMyTurn && !diceValue ? { scale: 0.9 } : {}}
              onClick={rollDice}
              className={`h-16 w-16 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 cursor-pointer
                ${isMyTurn && !diceValue
                  ? 'bg-amber-500 border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                  : diceValue ? 'bg-white border-white' : 'bg-[#0b0b0d] border-white/5'}`}
            >
              <AnimatePresence mode="wait">
                {diceValue ? (
                  <motion.div key="value" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                    {renderPips(diceValue)}
                  </motion.div>
                ) : (
                  <Zap size={24} className={isMyTurn ? 'text-black animate-pulse fill-current' : 'text-gray-800'} />
                )}
              </AnimatePresence>
            </motion.div>

            {/* Status Label */}
            <p className="absolute -bottom-5 left-0 right-0 text-center text-[7px] font-black uppercase tracking-tighter text-gray-600">
              {diceValue ? 'Result Locked' : 'Generator'}
            </p>
          </div>

          {/* 2. DYNAMIC ACTION SECTION */}
          <div className="flex-1 space-y-2">
            <div className="flex justify-between items-end px-1">
              <div className="leading-none">
                <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Command Unit</p>
                <h4 className={`text-xs font-black uppercase italic ${isMyTurn ? 'text-white' : 'text-gray-700'}`}>
                  {isMyTurn ? (diceValue ? 'Awaiting Move' : 'Ready to Roll') : 'System Idle'}
                </h4>
              </div>
              {diceValue && (
                <div className="text-right">
                  <span className="text-[14px] font-mono font-black text-amber-500">VAL: 0{diceValue}</span>
                </div>
              )}
            </div>

            {/* INTEGRATED MOVEMENT BUTTON */}
            <AnimatePresence mode="wait">
              {!diceValue ? (
                /* ROLL BUTTON */
                <motion.button
                  key="roll"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  disabled={!isMyTurn}
                  onClick={rollDice}
                  className={`w-full py-3.5 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] transition-all active:scale-95 flex items-center justify-center gap-2
                    ${isMyTurn ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'bg-white/5 text-gray-700 cursor-not-allowed'}`}
                >
                  <Zap size={14} className="fill-current" /> Initiate Roll
                </motion.button>
              ) : (
                /* MOVE BUTTON (Replaces Roll Button after dice value exists) */
                <motion.button
                  key="move"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  disabled={!isMyTurn || falseMove}
                  onClick={() => !falseMove ? movePiece() : setFalseMove(false)}
                  className={`w-full py-3.5 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg
                    ${falseMove
                      ? 'bg-rose-600 text-white shadow-rose-600/20'
                      : 'bg-blue-600 text-white shadow-blue-600/20'}`}
                >
                  {falseMove ? (
                    <><RotateCcw size={14} /> Retry Move</>
                  ) : (
                    <><Swords size={14} /> Execute Maneuver</>
                  )}
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* 3. ERROR HUD (Only shows on false move) */}
        <AnimatePresence>
          {falseMove && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-3 overflow-hidden"
            >
              <div className="bg-rose-500/10 border border-rose-500/20 p-2 rounded-lg flex items-center gap-2">
                <ShieldAlert size={12} className="text-rose-500" />
                <span className="text-[8px] font-black uppercase text-rose-500 tracking-widest">
                  Invalid Trajectory: Select different piece
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Dice;