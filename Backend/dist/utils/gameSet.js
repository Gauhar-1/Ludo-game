"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.placeHolders = exports.rooms = exports.availableColors = exports.colorSets = exports.startingIndexes = void 0;
exports.startingIndexes = {
    red: 13,
    blue: 0,
    green: 26,
    yellow: 39,
};
exports.colorSets = {
    1: ['blue'],
    2: ['blue', 'yellow'], // opposite corners
    3: ['blue', 'green', 'yellow'],
    4: ['blue', 'green', 'yellow', 'red'],
};
exports.availableColors = ['red', 'blue', 'green', 'yellow'];
exports.rooms = {};
exports.placeHolders = new Array(52).fill('');
