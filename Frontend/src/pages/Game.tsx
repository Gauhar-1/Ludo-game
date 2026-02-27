import { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import Board from '../components/Board';
import Dice from '../components/Dice';
import GameHistory from '../components/GameHistory';
import PlayerProfile from '../components/PlayerProfile';
import { ShieldCheck, ChevronLeft, Hash, Gamepad2, Settings } from 'lucide-react';


import WinnerModal from '../components/WinnerModal';
// import { useLudoBridge } from '../hooks/useLudo';

const Game = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const hasConnected = useRef(false);
  const urlParams = new URLSearchParams(window.location.search);
  const myUserId = urlParams.get('userId'); 
  const myName = decodeURIComponent(urlParams.get('name') || "Player")
  const { connectSocket, players, isPaused, socket } = useGame();
  // const { isAuthorizing, error } = useLudoBridge();

  useEffect(() => {
    if (roomId && !hasConnected.current) {
      connectSocket(roomId);
      hasConnected.current = true;
    }
  }, [roomId, connectSocket]);

  useEffect(()=>{
     if(!socket)
      navigate(`/waiting/${roomId}?userId=${myUserId}&name=${encodeURIComponent(myName)}`) 
      return;
  },[socket])

  // Identify opponents
  // For 2 player game, usually Blue and Yellow, or Red and Green?
  // Backend assigns available color.
  // We can just iterate players.
  // If waiting for players, show placeholders.

//   if (isAuthorizing) {
//   return (
//     <div className="h-screen w-full flex items-center justify-center bg-[#0b0b0d]">
//       <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-purple-500" />
//       <p className="ml-4 text-gray-400">Verifying Battle Access...</p>
//     </div>
//   );
// }

// if (error) {
//   return (
//     <div className="h-screen w-full flex flex-col items-center justify-center bg-[#0b0b0d] p-6 text-center">
//       <h2 className="text-2xl font-bold text-red-500 mb-4">Access Denied</h2>
//       <p className="text-gray-400 mb-6">{error}</p>
//       <button onClick={() => navigate('/')} className="bg-white/5 px-6 py-2 rounded-xl text-white">
//         Back to Home
//       </button>
//     </div>
//   );
// }

  return (
    <div className="min-h-screen bg-[#0b0b0d] text-gray-100 font-sans flex flex-col md:flex-row overflow-hidden">
      {isPaused && (
       <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md">
          <div className="text-center p-10 border-2 border-amber-500 rounded-3xl bg-[#111115]">
             <h2 className="text-amber-500 text-3xl font-black italic">BATTLE PAUSED</h2>
             <p className="text-gray-400 mt-2">Waiting for commander to return...</p>
          </div>
       </div>
    )}

      {/* 1. LEFT SIDEBAR (Desktop) / TOP (Mobile) */}
      <aside className="w-full md:w-80 bg-[#111115] border-r border-white/5 p-6 flex flex-col gap-6 z-20 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="p-3 bg-white/5 rounded-2xl text-gray-400 hover:bg-white/10 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 rounded-full border border-amber-500/20">
            <Hash size={12} className="text-amber-500" />
            <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">
              {roomId}
            </span>
          </div>
        </div>

        {/* Players Area */}
        <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar">
          <div className="flex items-center gap-2 mb-2">
            <Gamepad2 size={14} className="text-gray-500" />
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
              Commanders ({players.length}/2)
            </span>
          </div>


          <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
              {players.map((p: any) => (
                <PlayerProfile key={p.userId} color={p.color} name={p.name} />
              ))}
            </div>
        </div>

        {/* Settings / Footer */}
        <div className="pt-4 border-t border-white/5 flex items-center justify-between text-gray-600">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Secured</span>
          </div>
          <Settings size={14} className="hover:text-white cursor-pointer" />
        </div>
      </aside>

      {/* 2. MAIN CENTER AREA */}
      <main className="flex-1 relative flex flex-col items-center justify-center p-2 md:p-8 overflow-hidden">
        {/* Ambient Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-radial-gradient from-indigo-500/5 via-purple-500/5 to-transparent blur-[100px]" />
        </div>

        {/* Board Container */}
        <div className="relative z-10 w-full max-w-xl aspect-square flex flex-col justify-center">
          <Board />
        </div>
      </main>

      {/* 3. RIGHT SIDEBAR (Desktop) / BOTTOM (Mobile) */}
      <aside className="w-full md:w-96 bg-[#111115] border-l border-white/5 p-6 flex flex-col gap-6 z-20 shadow-2xl">

        {/* Control Area (Dice) */}
        <div className="flex-shrink-0">
          <div className="flex items-center gap-2 mb-4">
            <span className="h-px flex-1 bg-white/5" />
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
              Control Center
            </span>
            <span className="h-px flex-1 bg-white/5" />
          </div>
          <Dice />
        </div>

        {/* History Area */}
        <div className="flex-1 min-h-[200px] overflow-hidden">
          <GameHistory />
        </div>

      </aside>
      <WinnerModal />
    </div>
  );
};

export default Game;