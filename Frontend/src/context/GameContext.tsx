import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Player } from '../utils/type';

const GameContext = createContext<any>(null);

export type PlayerColor = 'red' | 'green' | 'blue' | 'yellow';

type Positions = {
  red: number[];
  green: number[];
  yellow: number[];
  blue: number[];
};


const initialPositions = {
  red: [-1, -1, -1, -1],
  green: [-1, -1, -1, -1],
  yellow: [-1, -1, -1, -1],
  blue: [-1, -1, -1, -1]
};




export const GameProvider = ({ children }: { children: React.ReactNode }) => {
  const socketRef = useRef<Socket | null>(null);
  const [turn, setTurn] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [winner, setWinner] = useState<string | null>(null);
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [positions, setPositions] = useState<Positions>(initialPositions);
  const [playerColor, setPlayerColor] = useState<'red' | 'blue' | 'green' | 'yellow' | null>(null);
  const [falseMove, setFalseMove] = useState<Boolean | null>(null);
  const [selectedPieceIndex, setSelectedPieceIndex] = useState<number | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [timerSync, setTimerSync] = useState<any>(null);
  const [userId,setUserId] = useState<string>("");
  const [name,setName] = useState<string>("");
  const [isPaused, setIsPaused] = useState(false);


  const connectSocket = (roomId: string, userId : string, name: string) => {
    if (socketRef.current) {
      return;
    }

    const SOCKET_URL = import.meta.env.VITE_LUDO_SERVER_URL || 'http://localhost:3001';

    const sock = io(SOCKET_URL, {
    transports: ["websocket", "polling"], 
    withCredentials: true
    });

    socketRef.current = sock;


    sock.on('connect', () => {
    console.log("Connected with ID:", sock.id);
    console.log("roomId, userId", roomId, userId)
    sock.emit('create-or-join', {roomId, userId, name}); 
    });

    sock.on('room-data', ({ players, turn, logs, positions }) => {
    setPlayers(players);
    setTurn(turn);
    if (logs) setLogs(logs);
    if (positions) setPositions(positions);

    const me = players.find((p: any) => p.userId === userId);
    if (me) setPlayerColor(me.color);

    const allOnline = players.every((p: any) => p.isOnline);
    if (allOnline) setIsPaused(false);
  });

  sock.on('game-paused', () => {
    setIsPaused(true);
  });

  sock.on('player-status-update', ({ userId: disconnectedId, isOnline }) => {
    setPlayers(prev => prev.map(p => 
      p.userId === disconnectedId ? { ...p, isOnline } : p
    ));
    if (!isOnline) setIsPaused(true);
  });

    sock.on('update-piece', ({ newPosition, logs }) => {
      console.log("Peice updated", newPosition);
      if (newPosition) setPositions(newPosition);
      if (logs) setLogs(logs);
    });



    sock.on('update-turn', (color) => {
      console.log("Turn is ", color);
      setTurn(color);
      setDiceValue(null); // Reset dice on turn change
    });

    sock.on('timer-sync', ({ timeLeft, totalTime }) => {
      // We can expose this to Board for syncing
      setTimerSync({ timeLeft, totalTime, start: Date.now() });
    });

    sock.on('declare-winner', (color) => {
      setWinner(color);
    });

    sock.on('dice-rolled', ({ value, logs }) => {
      setDiceValue(value);
      if (logs) setLogs(logs);
    });

    sock.on('disconnect', () => {
      setPlayers([]);
      setPositions(initialPositions);
      setTurn('');
      setPlayerColor(null);
      setDiceValue(null);
      setWinner(null);
      setLogs([]);
      setTimerSync(null);
    });
  };



 useEffect(() => {
  // If you want to connect as soon as the component mounts and you have a roomId
  if (roomCode && !socketRef.current) {
    connectSocket(roomCode, userId, name);
  }

  return () => {
    if (socketRef.current) {
      socketRef.current.off(); // Remove all listeners
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };
}, [roomCode]); // Re-run if roomCode changes



  return (
    <GameContext.Provider
      value={{
        socket: socketRef.current,
        connectSocket,
        players,
        turn,
        winner,
        diceValue,
        setDiceValue,
        positions,
        playerColor,
        setPositions,
        roomCode,
        setRoomCode,
        falseMove,
        setFalseMove,
        selectedPieceIndex,
        setSelectedPieceIndex,
        logs,
        timerSync,
        setUserId,
        setName,
        isPaused
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);
