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
  const [ falseMove, setFalseMove ] = useState<Boolean | null>(null);


  const connectSocket = (roomId: string) => {
    if (socketRef.current) {
      return;
    }
   
    const sock = io('http://localhost:3001');

    socketRef.current = sock;
    

    sock.emit('create-or-join', roomId);
    console.log("User enter request sent");

     sock.on('room-data', ({ players, turn }: { players: Player[], turn: PlayerColor, playerColor: PlayerColor }) => {
      setPlayers(players); 
      setTurn(turn);       
     const player = players.find( player => player.id === sock.id);
     if(player)
      setPlayerColor(player.color);
    else {
      console.log("No player color assigned");
    }
    
      // Initialize all colors, default to [-1, -1, -1, -1]
      const defaultPositions: { [key in PlayerColor]: number[] } = {
        red: [-1, -1, -1, -1],
        green: [-1, -1, -1, -1],
        yellow: [-1, -1, -1, -1],
        blue: [-1, -1, -1, -1],
      };
    
      players.forEach((player: { id: string; color: PlayerColor }) => {
        defaultPositions[player.color] = [0, 0, 0, 0]; // Set to 0s for active players
      });
    
      setPositions(defaultPositions); // ✅ Now fully typed and safe
    });

     sock.on('update-piece', ({ newPosition }: { newPosition: Positions}) => {
      console.log("Peice updated", newPosition);
      setPositions(newPosition); // ✅ Now fully typed and safe
    });
    
    
      
    sock.on('update-turn', (color) => {
      console.log("Turn is ", color);
        setTurn(color);
      });
    
      sock.on('assign-player', (color: string) => {
        if (['red', 'green', 'blue', 'yellow'].includes(color)) {
          setPlayerColor(color as PlayerColor);
        } else {
          console.warn(`Received invalid player color: ${color}`);
        }
      });

      sock.on('room-full', () => {
        alert('Room is full. Please try a different room.');
        sock.disconnect();
      });
      
      

      sock.on('state-update', (updatedPositions: Record<string, number[]>) => {
      
        setPositions({
          red: updatedPositions.red ?? [-1, 10, -1, -1],
          green: updatedPositions.green ?? [-1, -1, -1, -1],
          yellow: updatedPositions.yellow ?? [-1, -1, -1, -1],
          blue: updatedPositions.blue ?? [-1, -1, -1, -1],
        });
        
      });
      

    sock.on('declare-winner', (id: string) => {
      setWinner(id);
    });

    sock.on('winner', (name: string) => {
      setWinner(name);
    });

    sock.on('dice-rolled', ({ value }) => {
      setDiceValue(value);
    });

    sock.on('false-move', ()=>{
      setFalseMove(true);
    })

    sock.on('disconnect', () => {
      setPlayers([]);
      setPositions(initialPositions);
      setTurn('');
      setPlayerColor(null);
      setDiceValue(null);
      setWinner(null);
    });

     sock.on('piece-moved', (data : any)=>{
      const {  playerId, color, pieceId, newPosition } = data;
      if(!newPosition){
        return console.log("No new positions");
      }
      setPositions(newPosition);
      console.log("New Positions", newPosition)
  })
  };

  const disconnectSocket = () => {
      if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
      }
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
        socket : socketRef.current,
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
        setFalseMove
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);
