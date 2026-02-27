"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameService = void 0;
const Game_1 = require("../models/Game");
exports.GameService = {
    // Find or Create a room
    joinRoom: (roomId, userData) => __awaiter(void 0, void 0, void 0, function* () {
        return yield Game_1.LudoGame.findOneAndUpdate({ roomId }, {
            $addToSet: { players: userData },
            $setOnInsert: {
                status: 'waiting',
                turn: 'red',
                sixCount: 0
            }
        }, { upsert: true, new: true }).lean().exec();
    }),
    // Update piece positions
    updateMove: (roomId, color, pieceIndex, newPosition, nextTurn) => __awaiter(void 0, void 0, void 0, function* () {
        // MongoDB positional operator to target specific piece in the array
        const updatePath = `players.$[elem].pieces.${pieceIndex}`;
        return yield Game_1.LudoGame.findOneAndUpdate({ roomId }, {
            $set: {
                [updatePath]: newPosition,
                turn: nextTurn,
                diceValue: null // Reset dice after move
            },
        }, {
            arrayFilters: [{ "elem.color": color }],
            new: true
        }).lean().exec();
    })
};
