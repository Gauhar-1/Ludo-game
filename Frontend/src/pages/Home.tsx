import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { Swords, Users, Trophy, Activity, PlusCircle, ArrowRight } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();
  const { roomCode, setRoomCode } = useGame();

  const generateShortId = () => Math.floor(100000 + Math.random() * 900000).toString();

  const handleCreate = () => {
    const id = generateShortId();
    setRoomCode(id);
    navigate(`/game/${id}`);
  };

  return (
    <div className="min-h-screen bg-[#0b0b0d] text-gray-100 flex flex-col items-center p-4 pb-12 font-sans selection:bg-amber-500 selection:text-black">
      
      {/* 1. TOP BRANDING / HUD */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-md pt-12 text-center"
      >
        <h1 className="text-5xl font-black tracking-tighter italic text-white leading-none">
          TAUJILUDO
        </h1>
        <div className="flex items-center justify-center gap-2 mt-2">
          <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
          <p className="text-[10px] font-bold text-amber-500 uppercase tracking-[0.3em]">
            The King's Arena
          </p>
        </div>
      </motion.div>

      {/* 2. MAIN ACTIONS CONTAINER */}
      <div className="w-full max-w-md mt-12 space-y-6">
        
        {/* HOST MATCH CARD */}
        <motion.div
          whileTap={{ scale: 0.98 }}
          className="bg-[#16161a] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-500">
                <PlusCircle size={28} />
              </div>
              <h2 className="text-xl font-black uppercase italic text-white tracking-tight">
                Host Match
              </h2>
            </div>
            <p className="text-xs text-gray-500 font-medium mb-6 leading-relaxed">
              Create a secured private room and challenge your circle to a match.
            </p>
            <button
              onClick={handleCreate}
              className="w-full bg-amber-500 hover:bg-amber-400 text-black py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2"
            >
              Initialize Room <ArrowRight size={18} />
            </button>
          </div>
          <Swords size={120} className="absolute -right-8 -bottom-8 text-white/[0.02] -rotate-12 group-hover:text-amber-500/[0.03] transition-colors" />
        </motion.div>

        {/* JOIN MATCH CARD */}
        <motion.div
          whileTap={{ scale: 0.98 }}
          className="bg-[#16161a] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-500">
              <Users size={28} />
            </div>
            <h2 className="text-xl font-black uppercase italic text-white tracking-tight">
              Join Arena
            </h2>
          </div>
          
          <div className="space-y-4">
            <div className="relative group">
              <input
                type="tel"
                maxLength={6}
                placeholder="000 000"
                className="w-full bg-[#0b0b0d] border border-white/5 p-5 rounded-2xl text-center text-3xl font-mono font-black text-white tracking-[0.3em] focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-gray-800"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
              />
              <p className="text-[10px] text-center font-black uppercase tracking-widest text-gray-600 mt-2">
                Enter 6-Digit Protocol Code
              </p>
            </div>

            <button
              disabled={roomCode.length < 6}
              onClick={() => navigate(`/game/${roomCode}`)}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2"
            >
              Sync & Enter <Activity size={18} />
            </button>
          </div>
        </motion.div>
      </div>

      {/* 3. LIVE HUD STATS (Mobile Optimized) */}
      <div className="mt-auto w-full max-w-md pt-12">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/[0.02] border border-white/5 p-4 rounded-3xl text-center">
            <p className="text-xl font-black text-white italic">12.5K</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-600">Active Players</p>
          </div>
          <div className="bg-white/[0.02] border border-white/5 p-4 rounded-3xl text-center">
            <p className="text-xl font-black text-amber-500 italic">₹4.2M+</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-600">Daily Payouts</p>
          </div>
        </div>
        
        {/* TRUST BADGE */}
        <div className="mt-8 flex items-center justify-center gap-2 opacity-30">
          <Trophy size={14} />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Verified Secure Arena</span>
        </div>
      </div>
    </div>
  );
};

export default Home;