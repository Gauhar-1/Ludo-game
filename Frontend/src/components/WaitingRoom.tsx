import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';

const WaitingRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const urlParams = new URLSearchParams(window.location.search);
  const myUserId = urlParams.get('userId'); 
  const myName = decodeURIComponent(urlParams.get('name') || "Player")

  const { players, connectSocket, socket,setUserId, playerColor, setName } = useGame();

  useEffect(() => {
    // Pass the userId to the connect function
    if (roomId && myUserId) {
      connectSocket(roomId, myUserId, myName); 
    }
  }, [roomId, myUserId, connectSocket]);

  useEffect(() => {
  const allReady = players.length >= 2 && players.every((p: any) => p.isOnline);
  if (allReady) {
    const timer = setTimeout(() => navigate(`/game/${roomId}?userId=${myUserId}`), 1500);
    return () => clearTimeout(timer);
  }
}, [players, navigate, roomId, myUserId]);

useEffect(()=>{
  if(!myUserId || !myName) return;

  setUserId(myUserId);
  setName(myName);
}, [myUserId, myName]);

  // Identify based on persistent userId, not transient socket.id
  const me = players.find((p: any) => p.userId === myUserId);
  const opponent = players.find((p: any) => p.userId !== myUserId);

  return (
    <div className="min-h-screen bg-[#1a0506] bg-[radial-gradient(circle,_#2c0b0e_0%,_#1a0506_100%)] flex flex-col items-center justify-center p-6 font-sans">
      
      {/* Logo / Header */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-black text-[#D4AF37] tracking-widest uppercase italic drop-shadow-md">
          Tauji<span className="text-white">Ludo</span>
        </h1>
        <div className="mt-4 flex items-center justify-center gap-3 bg-white/5 border border-[#D4AF37]/30 py-2 px-4 rounded-full backdrop-blur-sm">
          <p className="text-[#f3e5ab] text-sm uppercase tracking-wider">Room Code: <span className="text-white font-mono font-bold ml-2">{roomId}</span></p>
        </div>
      </div>

      {/* Main Status Card */}
      <div className="w-full max-w-lg bg-white/5 backdrop-blur-md border-2 border-[#D4AF37] rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-center">
        <h2 className="text-2xl font-semibold text-[#f3e5ab] mb-10">
          {players.length < 2 ? "Seeking Worthy Opponent..." : "Match Confirmed!"}
        </h2>

        <div className="flex items-center justify-between px-4 mb-10">
          {/* Current Player (You) */}
          <div className="flex flex-col items-center gap-4 group">
<div className={`w-20 h-20 rounded-full border-4 border-white shadow-lg flex items-center justify-center transition-transform group-hover:scale-110 
  ${playerColor === 'red' ? 'bg-red-500 shadow-red-500/50' : 
    playerColor === 'green' ? 'bg-green-500 shadow-green-500/50' : 
    playerColor === 'blue' ? 'bg-blue-500 shadow-blue-500/50' : 
    'bg-yellow-500 shadow-yellow-500/50'}`}>
  <span className="text-white text-3xl font-bold">
    {me?.name ? me.name.charAt(0).toUpperCase() : "Y"}
  </span>
</div>
            <p className="text-white font-medium">{myName}</p>
          </div>

          {/* VS Divider */}
          <div className="text-[#D4AF37] text-4xl font-black italic opacity-40">VS</div>

          {/* Opponent Player */}
          <div className="flex flex-col items-center gap-4 group">
            {players.length >= 2 ? (
  <div className="flex flex-col items-center gap-4 group relative">
    {/* Show an "OFFLINE" badge if they are reconnecting */}
    {!opponent?.isOnline && (
      <span className="absolute -top-2 bg-red-600 text-[10px] text-white px-2 py-0.5 rounded-full animate-pulse z-10">
        RECONNECTING...
      </span>
    )}
    
    <div className={`w-20 h-20 rounded-full border-4 border-white shadow-lg flex items-center justify-center transition-transform group-hover:scale-110
      ${!opponent?.isOnline ? 'grayscale opacity-50' : ''} 
      ${opponent?.color === 'red' ? 'bg-red-500 shadow-red-500/50' : 
        opponent?.color === 'green' ? 'bg-green-500 shadow-green-500/50' : 
        opponent?.color === 'blue' ? 'bg-blue-500 shadow-blue-500/50' : 
        'bg-yellow-500 shadow-yellow-500/50'}`}>
       <span className="text-white text-3xl font-bold">
         {opponent?.name?.charAt(0) || '?'}
       </span>
    </div>
    <p className="text-white font-medium">{opponent?.name || 'Opponent'}</p>
  </div>
): (
              <>
                <div className="w-20 h-20 rounded-full border-4 border-dashed border-gray-600 flex items-center justify-center animate-pulse">
                   <div className="w-12 h-12 rounded-full bg-gray-800"></div>
                </div>
                <p className="text-gray-500 font-medium italic animate-pulse">Waiting...</p>
              </>
            )}
          </div>
        </div>

        {/* Action Footer */}
        <div className="pt-6 border-t border-white/10">
          {players.length >= 2 ? (
            <div className="flex items-center justify-center gap-2 text-green-400 font-bold animate-bounce">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              GET READY!
            </div>
          ) : (
            <p className="text-gray-400 text-sm">
              The game will automatically transition to the board once your friend joins.
            </p>
          )}
        </div>
      </div>

      {/* Decorative Footer */}
      <footer className="mt-12 text-[#D4AF37]/40 text-[10px] tracking-[0.3em] uppercase">
        TaujiLudo &bull; Royal Gaming Experience
      </footer>
    </div>
  );
};

export default WaitingRoom;