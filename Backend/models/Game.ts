import mongoose, { model, Model } from 'mongoose';
import { IGame } from '../utils/type';

const GameSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  players: [{ 
    id: String,       
    userId: String,
    name: String,    
    color: String, 
    isOnline: { type: Boolean, default: true   }
   }],
  gameStarted: { type: Boolean, default: false },
  turn: String,
  diceValue: { type: Number, default: null },
  sixCount: { type: Number, default: 0 },
  positions: {
    red: [Number], green: [Number], yellow: [Number], blue: [Number]
  },
  logs: [{ message: String, color: String, timestamp: Number }],
  winner: String,
  placeHolders: [String]
}, { timestamps: true });

export const LudoGame: Model<IGame> = model<IGame>('LudoGame', GameSchema);