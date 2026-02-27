import { LudoGame } from '../models/Game';
import { IGame, IPlayer, PlayerColor } from '../utils/type';

export const GameService = {
  // Find or Create a room
  joinRoom: async (roomId: string, userData: Partial<IPlayer>): Promise<IGame | null> => {
    return await LudoGame.findOneAndUpdate(
      { roomId },
      { 
        $addToSet: { players: userData },
        $setOnInsert: { 
          status: 'waiting',
          turn: 'red',
          sixCount: 0
        }
      },
      { upsert: true, new: true }
    ).lean<IGame>().exec();
  },

  // Update piece positions
  updateMove: async (
    roomId: string, 
    color: PlayerColor, 
    pieceIndex: number, 
    newPosition: number, 
    nextTurn: PlayerColor
  ): Promise<IGame | null> => {
    // MongoDB positional operator to target specific piece in the array
    const updatePath = `players.$[elem].pieces.${pieceIndex}`;
    
    return await LudoGame.findOneAndUpdate(
      { roomId },
      { 
        $set: { 
          [updatePath]: newPosition, 
          turn: nextTurn,
          diceValue: null // Reset dice after move
        },
      },
      { 
        arrayFilters: [{ "elem.color": color }],
        new: true 
      }
    ).lean<IGame>().exec();
  }
};