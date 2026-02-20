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


  const connectSocket = (roomId: string) => {
    if (socketRef.current) {
      return;
    }

    const SOCKET_URL = import.meta.env.VITE_LUDO_SERVER_URL || 'http://localhost:3001';

    const sock = io(SOCKET_URL, {
    transports: ['websocket'], 
    auth: {
        token: localStorage.getItem('game_token') 
          }
    });

    socketRef.current = sock;


    sock.emit('create-or-join', roomId);
    console.log("User enter request sent");

    sock.on('room-data', ({ players, turn, logs, positions }) => {
      setPlayers(players);
      setTurn(turn);
      if (logs) setLogs(logs);
      if (positions) setPositions(positions);

      const player = players.find((player: Player) => player.id === sock.id);
      if (player) setPlayerColor(player.color);
      else {
        console.log("No player color assigned");
      }
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



  // Clean up listeners on unmount
  useEffect(() => {

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);



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
        timerSync
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);
