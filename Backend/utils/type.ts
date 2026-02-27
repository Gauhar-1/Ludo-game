import { Types } from "mongoose";

export type PlayerColor = 'red' | 'blue' | 'green' | 'yellow';

export type PlayerData = {
  id: string;
  color: PlayerColor;
  name?: string; // Useful for displaying "John (Red)"
};

export interface GameLog {
  message: string;
  color: PlayerColor | 'white'; // 'white' for system messages like "Game Started"
  timestamp: number;
}

export type Positions = {
  red: number[];
  green: number[];
  yellow: number[];
  blue: number[];
};

export interface Room {
  players: PlayerData[];
  gameStarted: boolean;
  turn: PlayerColor | null;
  diceValue: number | null;
  sixCount: number; // MISSING: Track consecutive sixes (0-3)
  positions: Positions;
  logs: GameLog[];
  turnTimeout?: NodeJS.Timeout;
  timerStart?: number;
  winner: PlayerColor | null;
  placeHolders: string[]; 
}

export type Rooms = Record<string, Room>;

// --- NEW: Socket Payload Types ---

export interface TimerSyncPayload {
  timeLeft: number;
  totalTime: number;
  start: number; // Timestamp when timer started
}

export interface DiceRolledPayload {
  playerId: string;
  color: PlayerColor;
  value: number;
  logs: GameLog[];
}

export interface UpdatePiecePayload {
  newPosition: Positions;
  logs: GameLog[];
}

export interface UpdateTurnPayload {
  nextColor: PlayerColor;
}

export interface RoomDataPayload {
  players: PlayerData[];
  turn: PlayerColor | null;
  playerColor?: PlayerColor; // Sent to individual player on join
  logs: GameLog[];
  positions: Positions;
  winner?: PlayerColor | null;
}

export interface IPlayer {
  id: string; // Socket ID
  userId: string;
  name: string;
  color: PlayerColor;
  pieces: number[];
  isOnline: boolean;
}

export interface IGame {
  _id?: Types.ObjectId; 
  roomId: string;
  players: IPlayer[];
  gameStarted: boolean;
  turn: PlayerColor | null;
  diceValue: number | null;
  sixCount: number;
  positions: Record<PlayerColor, number[]>;
  logs: any[];
  winner: PlayerColor | null;
  placeHolders: string[];
}