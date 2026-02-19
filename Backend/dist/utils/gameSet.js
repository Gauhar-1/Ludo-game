"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.peiceStack = exports.getActualPathIndex = exports.homePath = exports.commonPath = exports.rooms = exports.availableColors = exports.haltIndexes = exports.colorSets = exports.basePositions = exports.startingIndexes = void 0;
/**
 * The common path index where each color enters the board from their base
 * after rolling a 6.
 */
exports.startingIndexes = {
    blue: 0, // Bottom-Left area
    red: 13, // Top-Left area
    green: 26, // Top-Right area
    yellow: 39, // Bottom-Right area
};
/**
 * Coordinate mapping for the 4 pieces inside each player's base.
 * Used for rendering pieces when their 'step' is -1.
 */
exports.basePositions = {
    red: [[2, 2], [2, 3], [3, 2], [3, 3]],
    green: [[2, 11], [2, 12], [3, 11], [3, 12]],
    yellow: [[11, 11], [11, 12], [12, 11], [12, 12]],
    blue: [[11, 2], [11, 3], [12, 2], [12, 3]],
};
/**
 * Colors assigned based on player count.
 * For 2 players, we use Blue and Yellow (opposite corners) for a fair match.
 */
exports.colorSets = {
    1: ['blue'],
    2: ['blue', 'yellow'],
    3: ['blue', 'red', 'yellow'],
    4: ['blue', 'red', 'green', 'yellow'],
};
/**
 * Indexes on the 0-51 common path that are "Safe Zones" (Stars).
 * Pieces here cannot be captured.
 */
exports.haltIndexes = [0, 8, 13, 21, 26, 34, 39, 47];
exports.availableColors = ['blue', 'red', 'green', 'yellow'];
exports.rooms = {};
/**
 * The 52-step common path around the board.
 * Coordinates are [row, column] for a 15x15 grid.
 */
exports.commonPath = [
    // Starting near Blue base (Bottom Left) moving Up
    [13, 6], [12, 6], [11, 6], [10, 6], [9, 6], [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
    [7, 0], // Index 11: Red Entrance
    [6, 0], [6, 1], [6, 2], [6, 3], [6, 4], [6, 5], [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
    [0, 7], // Index 24: Green Entrance
    [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8], [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
    [7, 14], // Index 37: Yellow Entrance
    [8, 14], [8, 13], [8, 12], [8, 11], [8, 10], [8, 9], [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
    [14, 7], // Index 50: Blue Exit to Home
    [14, 6] // Index 51
];
/**
 * The 6-step private path for each color leading to the final center.
 */
exports.homePath = {
    red: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6]],
    green: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7]],
    yellow: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9], [7, 8]],
    blue: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7], [8, 7]],
};
/**
 * Maps a player's relative 'step' (0-51) to the global 'commonPath' index (0-51).
 */
const getActualPathIndex = (color, step) => {
    const start = exports.startingIndexes[color];
    return (start + step) % 52;
};
exports.getActualPathIndex = getActualPathIndex;
/**
 * Utility to check if multiple pieces occupy the same tile.
 */
const peiceStack = (pathIndex) => {
    return exports.haltIndexes.includes(pathIndex);
};
exports.peiceStack = peiceStack;
