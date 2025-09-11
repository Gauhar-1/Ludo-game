import { PlayerColor, Rooms } from "./type";

export  const startingIndexes: Record<PlayerColor, number> = {
      red: 13,
      blue: 0,
      green: 26,
      yellow: 39,
    };

export const colorSets: Record<number, PlayerColor[]> = {
  1: ['blue'],
  2: ['blue', 'yellow'], // opposite corners
  3: ['blue', 'green', 'yellow'],
  4: ['blue', 'green', 'yellow', 'red'],
};

export  const haltIndexes: number[]  = [ 0, 8, 13, 21, 26, 34, 39, 47 ];

export const availableColors: PlayerColor[] = ['red', 'blue', 'green', 'yellow'];

export const rooms: Rooms = {};
export const placeHolders: String[] = new Array(52).fill('');