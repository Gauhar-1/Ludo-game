import { PlayerColor, useGame } from "../context/GameContext";
import { Player } from "./type";

export const getNextPosition = (pos: number, roll: number) => {
    return pos + roll > 57 ? pos : pos + roll;
  };

export const commonPath: [number, number][] = [
      [13, 6], [12, 6], [11, 6], [10, 6], [9, 6], [8, 5],
      [8, 4], [8, 3], [8, 2], [8, 1], [8, 0], [7, 0],
      [6, 0], [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
      [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
      [0, 7], [0, 8], [1, 8], [2, 8], [3, 8], [4, 8],
      [5, 8], [6, 9], [6, 10], [6, 11], [6, 12], [6, 13],
      [6, 14], [7, 14], [8, 14], [8, 13], [8, 12], [8, 11],
      [8, 10], [8, 9], [9, 8], [10, 8], [11, 8], [12, 8],
      [13, 8], [14, 8], [14, 7], [14, 6], [13, 6]
    ];
  
export const basePositions: Record<string, [number, number][]> = {
      red: [[1, 1], [1, 4], [4, 1], [4, 4]],
      green: [[1, 10], [1, 13], [4, 10], [4, 13]],
      yellow: [[10, 10], [10, 13], [13, 10], [13, 13]],
      blue: [[10, 1], [10, 4], [13, 1], [13, 4]],
    };

export const homePath: Record<string, [number, number][]> = {
      red: [[7, 1], [7, 2], [7, 3], [7, 4],[7, 5], [7, 6]],
      green: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6,7]],
      yellow: [[7, 13], [7, 12], [7, 11], [7, 10],[7, 9], [7, 8]],
      blue: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7], [8, 7]],
    };

  
export  const startingIndexes: Record<PlayerColor, number> = {
      red: 13,
      blue: 0,
      green: 26,
      yellow: 39,
    };

export  const haltIndexes: number[]  = [ 0, 8, 13, 21, 26, 34, 39, 47 ];
    
export  const getActualPathIndex = (color: PlayerColor, step: number) => {
      const start = startingIndexes[color];
      return (start + step) % commonPath.length;
    };

// Halt check
export const peiceStack = (actualindex : number)=>{
  
  const hasMatch = haltIndexes.some( num => num == actualindex);

  return hasMatch;
}