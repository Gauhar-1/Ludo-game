import { useGame } from '../context/GameContext';
import { User, Medal, Crown, Timer, ShieldCheck, Swords, Activity, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Expanded to include all potential Ludo colors
interface PlayerProfileProps {
    color: 'red' | 'blue' | 'green' | 'yellow'; 
    name : string;
}

const PlayerProfile = ({ color, name }: PlayerProfileProps) => {
    const { players, turn, positions } = useGame();

    // Find player by color
    const player = players.find((p: any) => p.color === color);
    const isTurn = turn === color;
    
    // Use the online status from our persistent backend logic
    const isOnline = player?.isOnline ?? false;
    const playerName = name || (color === 'red' ? 'ALPHA' : color === 'blue' ? 'STRIKER' : color === 'green' ? 'VENOM' : 'Midas');

    // Stats Logic
    const myPositions = positions[color] || [-1, -1, -1, -1];
    const inBase = myPositions.filter((p: number) => p === -1).length;
    const inHome = myPositions.filter((p: number) => p === 56).length;
    const active = 4 - inBase - inHome;

    const theme = {
        red: { accent: 'text-rose-500', bg: 'bg-rose-500', border: 'border-rose-500/50', glow: 'shadow-[0_0_20px_rgba(225,29,72,0.4)]' },
        blue: { accent: 'text-blue-500', bg: 'bg-blue-500', border: 'border-blue-500/50', glow: 'shadow-[0_0_20px_rgba(37,99,235,0.4)]' },
        green: { accent: 'text-emerald-500', bg: 'bg-emerald-500', border: 'border-emerald-500/50', glow: 'shadow-[0_0_20px_rgba(16,185,129,0.4)]' },
        yellow: { accent: 'text-amber-500', bg: 'bg-amber-500', border: 'border-amber-500/50', glow: 'shadow-[0_0_20px_rgba(245,158,11,0.4)]' },
    }[color];

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative w-full overflow-hidden rounded-[2rem] border-2 transition-all duration-500 
                ${isTurn ? `${theme.border} ${theme.glow} bg-[#1a1a20]` : 'border-white/5 bg-[#0f0f12] opacity-80'}
                ${!isOnline ? 'grayscale blur-[0.5px]' : ''}`}
        >
            <div className={`h-1.5 w-full ${isTurn ? theme.bg : 'bg-white/5'} transition-colors duration-500`} />

            <div className="p-4 relative">
                {/* 1. STATUS INDICATORS */}
                <div className="absolute top-2 right-4 flex items-center gap-2">
                    {!isOnline && <WifiOff size={12} className="text-rose-600 animate-pulse" />}
                    {isTurn && isOnline && <Activity size={12} className={`${theme.accent} animate-pulse`} />}
                </div>

                <div className="flex flex-col items-center text-center">
                    {/* 2. AVATAR CORE */}
                    <div className="relative mb-3">
                        <div className={`h-14 w-14 rounded-full flex items-center justify-center border-4 transition-all duration-500
                            ${isTurn ? `scale-110 border-white bg-black` : 'border-white/5 bg-white/5 text-gray-600'}`}>
                            {inHome === 4 ? (
                                <Crown size={28} className="text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                            ) : (
                                <User size={28} className={isTurn ? theme.accent : 'text-gray-700'} />
                            )}
                        </div>
                        
                        <div className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-[#0f0f12] 
                            ${isOnline ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`} />
                    </div>

                    {/* 3. NAME & STATUS */}
                    <div className="mb-4">
                        <p className={`text-[7px] font-black uppercase tracking-[0.3em] mb-0.5 ${isTurn ? 'text-white/60' : 'text-gray-600'}`}>
                            {isOnline ? 'Active Operative' : 'Signal Lost'}
                        </p>
                        <h3 className={`text-xs font-black uppercase tracking-tight truncate max-w-[120px]
                            ${isTurn ? 'text-white' : 'text-gray-500'}`}>
                            {playerName}
                        </h3>
                    </div>

                    {/* 4. TACTICAL STATS */}
                    <div className="w-full flex items-center justify-between gap-1 bg-black/40 p-1.5 rounded-xl border border-white/5">
                        <StatItem icon={<ShieldCheck size={10} />} value={inBase} color="text-gray-400" />
                        <div className="w-px h-3 bg-white/10" />
                        <StatItem icon={<Swords size={10} />} value={active} color={active > 0 ? theme.accent : 'text-gray-600'} />
                        <div className="w-px h-3 bg-white/10" />
                        <StatItem icon={<Medal size={10} />} value={inHome} color={inHome > 0 ? 'text-amber-500' : 'text-gray-600'} />
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {isTurn && isOnline && (
                    <motion.div
                        initial={{ y: 20 }} animate={{ y: 0 }} exit={{ y: 20 }}
                        className={`py-1.5 flex items-center justify-center gap-2 ${theme.bg}`}
                    >
                        <Timer size={10} className="text-black animate-spin-slow" />
                        <span className="text-[9px] font-black text-black uppercase tracking-widest">Your Turn</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

const StatItem = ({ icon, value, color }: { icon: React.ReactNode, value: number, color: string }) => (
    <div className="flex-1 flex flex-col items-center">
        <span className={color}>{icon}</span>
        <span className={`text-[10px] font-black leading-none mt-0.5 ${value > 0 ? 'text-white' : 'text-gray-600'}`}>{value}</span>
    </div>
);

export default PlayerProfile;