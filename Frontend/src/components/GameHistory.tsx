import { useRef, useEffect } from "react";
import { useGame } from "../context/GameContext";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollText, Activity, Terminal } from "lucide-react";

const GameHistory = () => {
    const { logs } = useGame();
    const scrollRef = useRef<HTMLDivElement>(null);

    // Force scroll to top whenever a new log entry is detected
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [logs]);

    return (
        <div className="bg-[#16161a] border border-white/5 rounded-[2.5rem] shadow-2xl h-[500px] flex flex-col overflow-hidden w-full max-w-xs mx-auto relative">
            
            {/* 1. FIXED HEADER */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-b from-[#1c1c21] to-transparent z-10 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500 border border-amber-500/20">
                        <Terminal size={16} />
                    </div>
                    <div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white leading-none">
                            Battle Log
                        </h3>
                        <p className="text-[8px] text-amber-500/60 font-bold uppercase mt-1 tracking-widest">
                            Live Telemetry
                        </p>
                    </div>
                </div>
                <Activity size={14} className="text-amber-500 animate-pulse opacity-50" />
            </div>

            {/* 2. SCROLLABLE FEED CONTAINER */}
            <div 
                ref={scrollRef} 
                className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar bg-[#16161a]"
            >
                <AnimatePresence initial={false} mode="popLayout">
                    {logs.map((log: any, i: number) => (
                        <motion.div
                            key={log.timestamp + i}
                            initial={{ y: -20, opacity: 0, scale: 0.95 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            className={`p-3 rounded-2xl border-l-4 shadow-sm flex items-start gap-3 transition-colors
                                ${log.color === 'red' ? 'bg-rose-500/5 border-rose-500 text-rose-200'
                                : log.color === 'blue' ? 'bg-blue-500/5 border-blue-500 text-blue-200'
                                : log.color === 'green' ? 'bg-emerald-500/5 border-emerald-500 text-emerald-200'
                                : log.color === 'yellow' ? 'bg-amber-500/5 border-amber-500 text-amber-200'
                                : 'bg-white/5 border-gray-500 text-gray-300'}`}
                        >
                            {/* Visual indicator for the log type */}
                            <div className={`mt-1 h-1.5 w-1.5 rounded-full shrink-0
                                ${log.color === 'red' ? 'bg-rose-500' 
                                : log.color === 'blue' ? 'bg-blue-500' 
                                : log.color === 'green' ? 'bg-emerald-500' 
                                : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'}`} 
                            />
                            
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] font-black uppercase tracking-tight leading-tight italic">
                                    {log.message}
                                </span>
                                <span className="text-[8px] opacity-30 font-mono">
                                    {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </span>
                            </div>
                        </motion.div>
                    ))}

                    {logs.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 opacity-10">
                            <ScrollText size={32} />
                            <p className="mt-2 text-[10px] font-black uppercase tracking-widest">Initialization Pending</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* 3. FADE GRADIENT AT BOTTOM */}
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#16161a] to-transparent pointer-events-none" />
        </div>
    );
};

export default GameHistory;