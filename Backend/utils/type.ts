export type PlayerColor = 'red' | 'blue' | 'green' | 'yellow';

export type PlayerData = {
  id: string;
  color: PlayerColor;
};

export interface Room {
  players: PlayerData[];
  gameStarted: boolean;
  turn: PlayerColor | null; 
  DiceValues: number | null;
}

export type Rooms = Record<string, Room>;

export type Positions = {
  red: number[];
  green: number[];
  yellow: number[];
  blue: number[];
};