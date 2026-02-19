import { useGame } from '../context/GameContext';
import { User, Medal, Crown, Timer, ShieldCheck, Swords, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PlayerProfileProps {
    color: 'red' | 'blue'; // Restricted to your 2v2 setup
}

const PlayerProfile = ({ color }: PlayerProfileProps) => {
    const { players, turn, positions } = useGame();

    const player = players.find((p: any) => p.color === color);
    const isTurn = turn === color;
    const isOnline = !!player;

    // Stats Logic
    const myPositions = positions[color] || [-1, -1, -1, -1];
    const inBase = myPositions.filter((p: number) => p === -1).length;
    const inHome = myPositions.filter((p: number) => p === 56).length;
    const active = 4 - inBase - inHome;

    // Professional Neon Theme
    const theme = {
        red: { 
            glow: 'shadow-[0_0_20px_rgba(225,29,72,0.4)]', 
            accent: 'text-rose-500', 
            bg: 'bg-rose-500', 
            border: 'border-rose-500/50',
            gradient: 'from-rose-500/20 to-transparent'
        },
        blue: { 
            glow: 'shadow-[0_0_20px_rgba(37,99,235,0.4)]', 
            accent: 'text-blue-500', 
            bg: 'bg-blue-500', 
            border: 'border-blue-500/50',
            gradient: 'from-blue-500/20 to-transparent'
        }
    }[color];

    return (
        <motion.div
            initial={{ opacity: 0, x: color === 'red' ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`relative w-full max-w-[160px] md:max-w-[200px] overflow-hidden rounded-[2.5rem] border-2 transition-all duration-500 
                ${isTurn ? `${theme.border} ${theme.glow} bg-[#1a1a20]` : 'border-white/5 bg-[#0f0f12] grayscale-[0.5] opacity-60'}`}
        >
            {/* 1. TOP STATUS BAR */}
            <div className={`h-1.5 w-full ${isTurn ? theme.bg : 'bg-white/5'} transition-colors duration-500`} />

            <div className="p-4 relative">
                {/* Active Pulse Decor */}
                <AnimatePresence>
                    {isTurn && (
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className={`absolute top-0 right-0 p-2 ${theme.accent} animate-pulse`}
                        >
                            <Activity size={14} />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 2. AVATAR CORE */}
                <div className="flex flex-col items-center text-center">
                    <div className="relative mb-3">
                        <div className={`h-16 w-16 rounded-full flex items-center justify-center border-4 shadow-2xl transition-transform duration-500
                            ${isTurn ? `scale-110 border-white bg-black` : 'border-white/5 bg-white/5 text-gray-600'}`}>
                            {inHome === 4 ? (
                                <Crown size={32} className="text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                            ) : (
                                <User size={32} className={isTurn ? theme.accent : 'text-gray-700'} />
                            )}
                        </div>
                        
                        {/* Connected Indicator */}
                        <div className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-[#0f0f12] 
                            ${isOnline ? 'bg-emerald-500' : 'bg-gray-700'}`} />
                    </div>

                    {/* 3. NAME & RANK */}
                    <div className="mb-4">
                        <p className={`text-[8px] font-black uppercase tracking-[0.3em] mb-1 ${isTurn ? 'text-white' : 'text-gray-600'}`}>
                            Operator
                        </p>
                        <h3 className={`text-sm font-black italic uppercase tracking-tighter transition-colors
                            ${isTurn ? 'text-white' : 'text-gray-500'}`}>
                            {color === 'red' ? 'ALPHA' : 'STRIKER'}-{color}
                        </h3>
                    </div>

                    {/* 4. TACTICAL STATS BAR (Resourceful & Compact) */}
                    <div className="w-full flex items-center justify-between gap-1 bg-black/40 p-1.5 rounded-2xl border border-white/5">
                        {/* Base Count */}
                        <div className="flex-1 flex flex-col items-center">
                             <ShieldCheck size={10} className="text-gray-600 mb-0.5" />
                             <span className="text-[10px] font-black text-white leading-none">{inBase}</span>
                        </div>
                        
                        <div className="w-px h-4 bg-white/10" />

                        {/* Active Count */}
                        <div className="flex-1 flex flex-col items-center">
                             <Swords size={10} className={active > 0 ? theme.accent : 'text-gray-600'} />
                             <span className={`text-[10px] font-black leading-none ${active > 0 ? 'text-white' : 'text-gray-500'}`}>{active}</span>
                        </div>

                        <div className="w-px h-4 bg-white/10" />

                        {/* Home Count */}
                        <div className="flex-1 flex flex-col items-center">
                             <Medal size={10} className={inHome > 0 ? 'text-amber-500' : 'text-gray-600'} />
                             <span className={`text-[10px] font-black leading-none ${inHome > 0 ? 'text-amber-500' : 'text-gray-500'}`}>{inHome}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 5. ACTIVE TURN INDICATOR */}
            <AnimatePresence>
                {isTurn && (
                    <motion.div
                        initial={{ y: 20 }} animate={{ y: 0 }} exit={{ y: 20 }}
                        className={`py-2 px-4 flex items-center justify-center gap-2 ${theme.bg}`}
                    >
                        <Timer size={12} className="text-black animate-spin-slow" />
                        <span className="text-[10px] font-black text-black uppercase tracking-widest">In Control</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default PlayerProfile;