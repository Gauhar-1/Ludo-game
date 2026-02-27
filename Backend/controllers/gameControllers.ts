import { Socket, Server } from "socket.io";
import { availableColors, haltIndexes, rooms, startingIndexes, getActualPathIndex } from "../utils/gameSet";
import { PlayerColor, PlayerData, GameLog, IGame } from "../utils/type";
import { LudoGame } from "../models/Game";
import axios from "axios";

const TURN_DURATION_MS = 15000; // 15 seconds

/**
 * Utility: Persist logs to DB
 */
async function addLog(roomId: string, message: string, color: PlayerColor | "system") {
  const log: GameLog = { 
    message, 
    color: (color === "system" ? "white" : color) as PlayerColor | "white", 
    timestamp: Date.now() 
  };
  
  await LudoGame.updateOne(
    { roomId },
    { 
      $push: { 
        logs: { $each: [log], $position: 0, $slice: 50 } 
      } 
    }
  );
}

/**
 * Utility: Advance turn via DB
 */
async function nextTurn(roomId: string, io: Server) {
  const room = await LudoGame.findOne({ roomId }).lean();
  if (!room) return;

  const currentColor = room.turn;
  const players = room.players;
  const currentIndex = players.findIndex(p => p.color === currentColor);
  const nextIndex = (currentIndex + 1) % players.length;
  const nextColor = players[nextIndex].color;

  const updatedRoom = await LudoGame.findOneAndUpdate(
    { roomId },
    { 
      $set: { 
        turn: nextColor, 
        diceValue: null, 
        sixCount: 0 
      } 
    },
    { returnDocument: 'after' }
  ).lean();

  startTimer(roomId, io);

  io.to(roomId).emit('update-turn', nextColor);
  io.to(roomId).emit('room-data', updatedRoom);
}

/**
 * Utility: Handles the 15s turn countdown
 * (Timeouts remain in RAM, but state is fetched from DB on trigger)
 */
const turnTimeouts: Record<string, NodeJS.Timeout> = {};

function startTimer(roomId: string, io: Server) {
  if (turnTimeouts[roomId]) clearTimeout(turnTimeouts[roomId]);

  io.to(roomId).emit('timer-sync', {
    timeLeft: TURN_DURATION_MS,
    totalTime: TURN_DURATION_MS
  });

  turnTimeouts[roomId] = setTimeout(async () => {
    const room = await LudoGame.findOne({ roomId }).lean();
    if (room && room.turn && !room.winner) {
      await addLog(roomId, `Time out for ${room.turn}`, room.turn as PlayerColor);
      await nextTurn(roomId, io);
    }
  }, TURN_DURATION_MS);
}

const COLOR_PAIRS: Record<PlayerColor, PlayerColor> = {
  red: 'yellow',
  yellow: 'red',
  blue: 'green',
  green: 'blue'
};

// --- Controller Functions ---

/**
 * Handles Room Joining and Initialization
 */
export const roomCreation = (socket: Socket, io: Server) => 
  async ({ roomId, userId, name }: { roomId: string, userId: string, name: string }) => {
  if (!roomId || !userId || !name) return;

  let room: IGame | null = null;
   
  room = await LudoGame.findOne({ roomId });

  // 1. Initial Room Setup if it doesn't exist
  if (!room) {
    room = await LudoGame.findOneAndUpdate(
      { roomId },
      {
        $setOnInsert: {
          roomId,
          players: [], // Start empty to "claim" slots below
          gameStarted: false,
          turn: null,
          diceValue: null,
          sixCount: 0,
          positions: { red: [-1,-1,-1,-1], green: [-1,-1,-1,-1], yellow: [-1,-1,-1,-1], blue: [-1,-1,-1,-1] },
          logs: [],
          winner: null,
          placeHolders: new Array(52).fill('')
        }
      },
      { upsert: true, returnDocument: 'after' }
    ).lean();
  }

  // 2. Identify if user is an original player or a newcomer
  const existingPlayer = room.players.find(p => p.userId === userId);
  
  if (existingPlayer) {
    // RECONNECTION: Map the new socket.id to the persistent userId
    if (room.gameStarted && !room.winner) {
    startTimer(roomId, io); 
  }

    room = await LudoGame.findOneAndUpdate(
      { roomId, "players.userId": userId },
      { $set: { "players.$.id": socket.id, "players.$.isOnline": true, "players.$.name": name } },
      { returnDocument: 'after' }
    ).lean();
    await addLog(roomId, `${existingPlayer.color} returned!`, "system" as any);
  } 
  
  else {
    // NEW PLAYER: Only allow if room isn't "locked" (started) or full
    if (room.gameStarted || room.players.length >= 2) {
      return socket.emit('error', 'Room is full or already in progress.');
    }

  let colorToAssign: PlayerColor;

    // Use room.players.length from the fetched document to decide
    if (room.players.length === 0) {
      // First player: Pick Red or Blue as the starting seed
      colorToAssign = Math.random() > 0.5 ? 'red' : 'blue';
    } else {
      // Second player: MUST check the specific color of the player already in the DB
      const firstPlayer = room.players[0];
      const firstColor = firstPlayer.color as PlayerColor;
      
      // Force the pair: Red -> Yellow, Blue -> Green
      colorToAssign = COLOR_PAIRS[firstColor];
      
      console.log(`Pairing Logic: Player 1 is ${firstColor}, assigning ${colorToAssign} to Player 2`);
    }

    room = await LudoGame.findOneAndUpdate(
      { roomId },
      { $push: { players: { id: socket.id, userId, name, color: colorToAssign, isOnline: true } } },
      { returnDocument: 'after' }
    ).lean();

    await addLog(roomId, `${name} (${colorToAssign}) joined`, colorToAssign);
  }

   if(!room) return console.log("No Room found");
  
   socket.join(roomId);


  // 3. Start game logic (Only start if BOTH players are present and online)
  if (room.players.length === 2 && !room.gameStarted) {
    room = await LudoGame.findOneAndUpdate(
      { roomId },
      { $set: { gameStarted: true, turn: room.players[0].color } },
      { returnDocument: 'after' }
    ).lean();
    startTimer(roomId, io);
  }

  io.to(roomId).emit('room-data', room);
};

/**
 * Handles Dice Rolling Logic
 */
export const rollDice = (socket: Socket, io: Server) => async ({ roomId }: { roomId: string }) => {
  const room = await LudoGame.findOne({ roomId }).lean();
  if (!room || !room.gameStarted || room.winner) return;

  const player = room.players.find(p => p.id === socket.id);
  if (!player || room.turn !== player.color || room.diceValue !== null) return;

  const value = Math.ceil(Math.random() * 6);
  const newSixCount = value === 6 ? room.sixCount + 1 : 0;

  if (newSixCount === 3) {
    await addLog(roomId, `Triple 6! Turn Revoked`, player.color as PlayerColor);
    await LudoGame.updateOne({ roomId }, { $set: { sixCount: 0, diceValue: null } });
    io.to(roomId).emit('dice-rolled', { color: player.color, value: 6 });
    setTimeout(() => nextTurn(roomId, io), 1000);
    return;
  }

  const updatedRoom = await LudoGame.findOneAndUpdate(
    { roomId },
    { $set: { diceValue: value, sixCount: newSixCount } },
    { returnDocument: 'after' }
  ).lean();

  io.to(roomId).emit('dice-rolled', {
    playerId: socket.id,
    color: player.color,
    value: value,
    logs: updatedRoom?.logs
  });

  const colorKey = player.color as PlayerColor;
  const currentPositions = updatedRoom!.positions[colorKey];
  const canMove = currentPositions.some(pos => (pos === -1 ? value === 6 : pos + value <= 56));

  if (!canMove) {
    await addLog(roomId, `No valid moves for ${player.color}`, player.color as PlayerColor);
    setTimeout(() => nextTurn(roomId, io), 1500);
  } else {
    startTimer(roomId, io);
  }
};

/**
 * Handles Piece Movement, Captures, and Win Conditions
 */
export const peiceMoved = (socket: Socket, io: Server) => async ({ roomId, movedPieceIndex }: { roomId: string; movedPieceIndex: number }) => {
  const room = await LudoGame.findOne({ roomId }).lean();
  if (!room || room.winner) return;

  const player = room.players.find(p => p.id === socket.id);
  // Type Guard for player and turn
  if (!player || !player.color || room.turn !== player.color || !room.diceValue) return;

  const diceValue = room.diceValue;
  const pieceIdx = Number(movedPieceIndex);
  
  // Cast player.color to PlayerColor to satisfy Record indexing
  const color = player.color as PlayerColor;
  const currentPos = room.positions[color][pieceIdx];

  // Logic Validation
  let newPos = currentPos === -1 ? (diceValue === 6 ? 0 : -1) : currentPos + diceValue;
  if (newPos === -1 || newPos > 56) return;
  let extraTurn = false;
  
  // Clone objects to avoid mutation errors
  const newPositions = { ...room.positions } as Record<PlayerColor, number[]>;
  const newPlaceHolders = [...room.placeHolders] as string[];
  
  // 1. Clear previous spot
  if (currentPos >= 0 && currentPos <= 50) {
    const oldActualIdx = getActualPathIndex(color, currentPos);
    if (newPlaceHolders[oldActualIdx] === `${color}-${pieceIdx}`) {
      newPlaceHolders[oldActualIdx] = '';
    }
  }
  
  // 2. Handle Capture Logic
  if (newPos <= 50) {
    const actualIndex = getActualPathIndex(color, newPos);
    const occupant = newPlaceHolders[actualIndex];
    
    if (occupant && !haltIndexes.includes(actualIndex)) {
      const [oppColor, oppIdxStr] = occupant.split('-');
      if (oppColor !== color) {
        const oppIdx = Number(oppIdxStr);
        // Cast oppColor to PlayerColor
        const opponentColorKey = oppColor as PlayerColor;
        
        // Update clones
        newPositions[opponentColorKey][oppIdx] = -1;
        
        await addLog(roomId, `${color} captured ${oppColor}!`, color);
        extraTurn = true;
      }
    }
    newPlaceHolders[actualIndex] = `${color}-${pieceIdx}`;
  }
  
  newPositions[color][pieceIdx] = newPos;
  
  // 3. Check Win Condition
  let winner: PlayerColor | null = room.winner;
  if (newPos === 56) {
    await addLog(roomId, `${color} reached Home!`, color);
    extraTurn = true;
    if (newPositions[color].every(p => p === 56)) {
      winner = color;
      const winningPlayer = room.players.find(p => p.color === color);
      await addLog(roomId, `Victory for ${color}!`, color);
      io.to(roomId).emit('declare-winner', color);

      if (winningPlayer) {
      notifyTaujiLudoWinner(roomId, winningPlayer.userId);
    }
    }
  }

  // 4. Update Database
  const finalRoom = await LudoGame.findOneAndUpdate(
    { roomId },
    { $set: { positions: newPositions, placeHolders: newPlaceHolders, winner } },
    { returnDocument: 'after' }
  ).lean();

  io.to(roomId).emit('update-piece', { 
    newPosition: finalRoom?.positions, 
    logs: finalRoom?.logs 
  });


  // 5. Turn Routing
  if ((diceValue === 6 || extraTurn) && !winner) {
    await LudoGame.updateOne({ roomId }, { $set: { diceValue: null } });
    await addLog(roomId, `Bonus roll for ${color}`, color);
    startTimer(roomId, io);
    io.to(roomId).emit('update-turn', color);
  } else if (!winner) {
    await nextTurn(roomId, io);
  }
};

async function notifyTaujiLudoWinner(roomId: string, winnerUserId: string) {
  try {
    await axios.post(`${process.env.TAUJILUDO_API_URL}/api/auth/battles/settleBattle`, {
      roomId,
      winnerUserId,
      secretKey: process.env.GAME_SECRET_KEY // Shared secret for security
    });
    console.log(`Payout triggered for User: ${winnerUserId}`);
  } catch (err) {
    console.error("Payout failed to sync with TaujiLudo:", err);
  }
}

// Add this to your handleDisconnect in gameControllers.ts
export const handleDisconnect = (socket: Socket, io: Server) => async () => {
  const room = await LudoGame.findOneAndUpdate(
    { "players.id": socket.id },
    { $set: { "players.$.isOnline": false } },
    { returnDocument: 'after' }
  ).lean();

  if (room) {
    // 1. STOP THE TIMER
    if (turnTimeouts[room.roomId]) {
      clearTimeout(turnTimeouts[room.roomId]);
      delete turnTimeouts[room.roomId];
    }

    const player = room.players.find(p => p.id === socket.id);
    
    // 2. EMIT PAUSE (Tell frontend to show the waiting card)
    io.to(room.roomId).emit('game-paused', {
      userId: player?.userId,
      message: `${player?.color} disconnected. Game Paused.`
    });

    await addLog(room.roomId, `Game Paused: ${player?.color} left.`, "system" as any);
  }
};

