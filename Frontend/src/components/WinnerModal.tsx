import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { Trophy, Crown, Home } from 'lucide-react';

const WinnerModal = () => {
    const { winner } = useGame();

    return (
        <AnimatePresence>
            {winner && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ scale: 0.5, y: 50, rotateX: 20 }}
                        animate={{ scale: 1, y: 0, rotateX: 0 }}
                        exit={{ scale: 0.5, y: 50, opacity: 0 }}
                        className={`w-full max-w-md p-8 rounded-[3rem] border-4 shadow-[0_0_100px_rgba(0,0,0,0.5)] text-center relative overflow-hidden
              ${winner === 'red' ? 'bg-rose-600 border-rose-400 shadow-rose-600/50'
                                : winner === 'blue' ? 'bg-blue-600 border-blue-400 shadow-blue-600/50'
                                    : winner === 'green' ? 'bg-emerald-600 border-emerald-400 shadow-emerald-600/50'
                                        : 'bg-amber-500 border-amber-300 shadow-amber-500/50'}`}
                    >
                        {/* Confetti/Sparkles Background */}
                        <div className="absolute inset-0 pointer-events-none">
                            {[...Array(20)].map((_, i) => (
                                <div
                                    key={i}
                                    className="absolute h-2 w-2 bg-white rounded-full animate-pulse"
                                    style={{
                                        top: `${Math.random() * 100}%`,
                                        left: `${Math.random() * 100}%`,
                                        animationDelay: `${Math.random() * 2}s`
                                    }}
                                />
                            ))}
                        </div>

                        <div className="relative z-10 flex flex-col items-center gap-6">

                            <div className="h-24 w-24 rounded-full bg-white/20 flex items-center justify-center border-4 border-white/50 shadow-xl">
                                <Trophy size={48} className="text-white drop-shadow-md" />
                            </div>

                            <div>
                                <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white drop-shadow-lg mb-2">
                                    Victory!
                                </h2>
                                <div className="flex items-center justify-center gap-2 text-white/90">
                                    <Crown size={20} className="fill-current" />
                                    <p className="text-lg font-bold uppercase tracking-widest">
                                        {winner} Conqueror
                                    </p>
                                </div>
                            </div>

                            <div className="w-full flex flex-col gap-3 mt-4">
                                <button
                                    onClick={() => window.location.href = `${import.meta.env.VITE_TAUJILUDO_URL}/`}
                                    className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase tracking-[0.25em] hover:scale-105 transition-transform flex items-center justify-center gap-2 shadow-xl"
                                >
                                    <Home size={18} /> Return to Base
                                </button>
                                {/* Add Play Again logic if supported by backend later */}
                            </div>

                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default WinnerModal;
