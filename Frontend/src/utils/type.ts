import { PlayerColor } from "../context/GameContext";

export type Player = {   id: string; // Socket ID
  userId: string;
  name: string;
  color: PlayerColor;
  pieces: number[];
  isOnline: boolean; };