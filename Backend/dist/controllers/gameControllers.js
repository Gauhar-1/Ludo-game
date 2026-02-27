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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleDisconnect = exports.peiceMoved = exports.rollDice = exports.roomCreation = void 0;
const gameSet_1 = require("../utils/gameSet");
const Game_1 = require("../models/Game");
const axios_1 = __importDefault(require("axios"));
const TURN_DURATION_MS = 15000; // 15 seconds
/**
 * Utility: Persist logs to DB
 */
function addLog(roomId, message, color) {
    return __awaiter(this, void 0, void 0, function* () {
        const log = {
            message,
            color: (color === "system" ? "white" : color),
            timestamp: Date.now()
        };
        yield Game_1.LudoGame.updateOne({ roomId }, {
            $push: {
                logs: { $each: [log], $position: 0, $slice: 50 }
            }
        });
    });
}
/**
 * Utility: Advance turn via DB
 */
function nextTurn(roomId, io) {
    return __awaiter(this, void 0, void 0, function* () {
        const room = yield Game_1.LudoGame.findOne({ roomId }).lean();
        if (!room)
            return;
        const currentColor = room.turn;
        const players = room.players;
        const currentIndex = players.findIndex(p => p.color === currentColor);
        const nextIndex = (currentIndex + 1) % players.length;
        const nextColor = players[nextIndex].color;
        const updatedRoom = yield Game_1.LudoGame.findOneAndUpdate({ roomId }, {
            $set: {
                turn: nextColor,
                diceValue: null,
                sixCount: 0
            }
        }, { returnDocument: 'after' }).lean();
        startTimer(roomId, io);
        io.to(roomId).emit('update-turn', nextColor);
        io.to(roomId).emit('room-data', updatedRoom);
    });
}
/**
 * Utility: Handles the 15s turn countdown
 * (Timeouts remain in RAM, but state is fetched from DB on trigger)
 */
const turnTimeouts = {};
function startTimer(roomId, io) {
    if (turnTimeouts[roomId])
        clearTimeout(turnTimeouts[roomId]);
    io.to(roomId).emit('timer-sync', {
        timeLeft: TURN_DURATION_MS,
        totalTime: TURN_DURATION_MS
    });
    turnTimeouts[roomId] = setTimeout(() => __awaiter(this, void 0, void 0, function* () {
        const room = yield Game_1.LudoGame.findOne({ roomId }).lean();
        if (room && room.turn && !room.winner) {
            yield addLog(roomId, `Time out for ${room.turn}`, room.turn);
            yield nextTurn(roomId, io);
        }
    }), TURN_DURATION_MS);
}
const COLOR_PAIRS = {
    red: 'yellow',
    yellow: 'red',
    blue: 'green',
    green: 'blue'
};
// --- Controller Functions ---
/**
 * Handles Room Joining and Initialization
 */
const roomCreation = (socket, io) => (_a) => __awaiter(void 0, [_a], void 0, function* ({ roomId, userId, name }) {
    if (!roomId || !userId || !name)
        return;
    let room = null;
    room = yield Game_1.LudoGame.findOne({ roomId });
    // 1. Initial Room Setup if it doesn't exist
    if (!room) {
        room = yield Game_1.LudoGame.findOneAndUpdate({ roomId }, {
            $setOnInsert: {
                roomId,
                players: [], // Start empty to "claim" slots below
                gameStarted: false,
                turn: null,
                diceValue: null,
                sixCount: 0,
                positions: { red: [-1, -1, -1, -1], green: [-1, -1, -1, -1], yellow: [-1, -1, -1, -1], blue: [-1, -1, -1, -1] },
                logs: [],
                winner: null,
                placeHolders: new Array(52).fill('')
            }
        }, { upsert: true, returnDocument: 'after' }).lean();
    }
    // 2. Identify if user is an original player or a newcomer
    const existingPlayer = room.players.find(p => p.userId === userId);
    if (existingPlayer) {
        // RECONNECTION: Map the new socket.id to the persistent userId
        if (room.gameStarted && !room.winner) {
            startTimer(roomId, io);
        }
        room = yield Game_1.LudoGame.findOneAndUpdate({ roomId, "players.userId": userId }, { $set: { "players.$.id": socket.id, "players.$.isOnline": true, "players.$.name": name } }, { returnDocument: 'after' }).lean();
        yield addLog(roomId, `${existingPlayer.color} returned!`, "system");
    }
    else {
        // NEW PLAYER: Only allow if room isn't "locked" (started) or full
        if (room.gameStarted || room.players.length >= 2) {
            return socket.emit('error', 'Room is full or already in progress.');
        }
        let colorToAssign;
        // Use room.players.length from the fetched document to decide
        if (room.players.length === 0) {
            // First player: Pick Red or Blue as the starting seed
            colorToAssign = Math.random() > 0.5 ? 'red' : 'blue';
        }
        else {
            // Second player: MUST check the specific color of the player already in the DB
            const firstPlayer = room.players[0];
            const firstColor = firstPlayer.color;
            // Force the pair: Red -> Yellow, Blue -> Green
            colorToAssign = COLOR_PAIRS[firstColor];
            console.log(`Pairing Logic: Player 1 is ${firstColor}, assigning ${colorToAssign} to Player 2`);
        }
        room = yield Game_1.LudoGame.findOneAndUpdate({ roomId }, { $push: { players: { id: socket.id, userId, name, color: colorToAssign, isOnline: true } } }, { returnDocument: 'after' }).lean();
        yield addLog(roomId, `${name} (${colorToAssign}) joined`, colorToAssign);
    }
    if (!room)
        return console.log("No Room found");
    socket.join(roomId);
    // 3. Start game logic (Only start if BOTH players are present and online)
    if (room.players.length === 2 && !room.gameStarted) {
        room = yield Game_1.LudoGame.findOneAndUpdate({ roomId }, { $set: { gameStarted: true, turn: room.players[0].color } }, { returnDocument: 'after' }).lean();
        startTimer(roomId, io);
    }
    io.to(roomId).emit('room-data', room);
});
exports.roomCreation = roomCreation;
/**
 * Handles Dice Rolling Logic
 */
const rollDice = (socket, io) => (_a) => __awaiter(void 0, [_a], void 0, function* ({ roomId }) {
    const room = yield Game_1.LudoGame.findOne({ roomId }).lean();
    if (!room || !room.gameStarted || room.winner)
        return;
    const player = room.players.find(p => p.id === socket.id);
    if (!player || room.turn !== player.color || room.diceValue !== null)
        return;
    const value = Math.ceil(Math.random() * 6);
    const newSixCount = value === 6 ? room.sixCount + 1 : 0;
    if (newSixCount === 3) {
        yield addLog(roomId, `Triple 6! Turn Revoked`, player.color);
        yield Game_1.LudoGame.updateOne({ roomId }, { $set: { sixCount: 0, diceValue: null } });
        io.to(roomId).emit('dice-rolled', { color: player.color, value: 6 });
        setTimeout(() => nextTurn(roomId, io), 1000);
        return;
    }
    const updatedRoom = yield Game_1.LudoGame.findOneAndUpdate({ roomId }, { $set: { diceValue: value, sixCount: newSixCount } }, { returnDocument: 'after' }).lean();
    io.to(roomId).emit('dice-rolled', {
        playerId: socket.id,
        color: player.color,
        value: value,
        logs: updatedRoom === null || updatedRoom === void 0 ? void 0 : updatedRoom.logs
    });
    const colorKey = player.color;
    const currentPositions = updatedRoom.positions[colorKey];
    const canMove = currentPositions.some(pos => (pos === -1 ? value === 6 : pos + value <= 56));
    if (!canMove) {
        yield addLog(roomId, `No valid moves for ${player.color}`, player.color);
        setTimeout(() => nextTurn(roomId, io), 1500);
    }
    else {
        startTimer(roomId, io);
    }
});
exports.rollDice = rollDice;
/**
 * Handles Piece Movement, Captures, and Win Conditions
 */
const peiceMoved = (socket, io) => (_a) => __awaiter(void 0, [_a], void 0, function* ({ roomId, movedPieceIndex }) {
    const id = roomId.slice(0, 6);
    const room = yield Game_1.LudoGame.findOne({ roomId: id }).lean();
    if (!room || room.winner)
        return;
    const player = room.players.find(p => p.id === socket.id);
    // Type Guard for player and turn
    if (!player || !player.color || room.turn !== player.color || !room.diceValue)
        return;
    const diceValue = room.diceValue;
    const pieceIdx = Number(movedPieceIndex);
    // Cast player.color to PlayerColor to satisfy Record indexing
    const color = player.color;
    const currentPos = room.positions[color][pieceIdx];
    // Logic Validation
    let newPos = currentPos === -1 ? (diceValue === 6 ? 0 : -1) : currentPos + diceValue;
    if (newPos === -1 || newPos > 56)
        return;
    let extraTurn = false;
    // Clone objects to avoid mutation errors
    const newPositions = Object.assign({}, room.positions);
    const newPlaceHolders = [...room.placeHolders];
    // 1. Clear previous spot
    if (currentPos >= 0 && currentPos <= 50) {
        const oldActualIdx = (0, gameSet_1.getActualPathIndex)(color, currentPos);
        if (newPlaceHolders[oldActualIdx] === `${color}-${pieceIdx}`) {
            newPlaceHolders[oldActualIdx] = '';
        }
    }
    // 2. Handle Capture Logic
    if (newPos <= 50) {
        const actualIndex = (0, gameSet_1.getActualPathIndex)(color, newPos);
        const occupant = newPlaceHolders[actualIndex];
        if (occupant && !gameSet_1.haltIndexes.includes(actualIndex)) {
            const [oppColor, oppIdxStr] = occupant.split('-');
            if (oppColor !== color) {
                const oppIdx = Number(oppIdxStr);
                // Cast oppColor to PlayerColor
                const opponentColorKey = oppColor;
                // Update clones
                newPositions[opponentColorKey][oppIdx] = -1;
                yield addLog(roomId, `${color} captured ${oppColor}!`, color);
                extraTurn = true;
            }
        }
        newPlaceHolders[actualIndex] = `${color}-${pieceIdx}`;
    }
    newPositions[color][pieceIdx] = newPos;
    // 3. Check Win Condition
    let winner = room.winner;
    if (newPos === 56) {
        yield addLog(roomId, `${color} reached Home!`, color);
        extraTurn = true;
        if (newPositions[color].every(p => p === 56)) {
            winner = color;
            const winningPlayer = room.players.find(p => p.color === color);
            yield addLog(roomId, `Victory for ${color}!`, color);
            io.to(roomId).emit('declare-winner', color);
            if (winningPlayer) {
                notifyTaujiLudoWinner(roomId, winningPlayer.userId);
            }
        }
    }
    // 4. Update Database
    const finalRoom = yield Game_1.LudoGame.findOneAndUpdate({ roomId }, { $set: { positions: newPositions, placeHolders: newPlaceHolders, winner } }, { returnDocument: 'after' }).lean();
    io.to(roomId).emit('update-piece', {
        newPosition: finalRoom === null || finalRoom === void 0 ? void 0 : finalRoom.positions,
        logs: finalRoom === null || finalRoom === void 0 ? void 0 : finalRoom.logs
    });
    // 5. Turn Routing
    if ((diceValue === 6 || extraTurn) && !winner) {
        yield Game_1.LudoGame.updateOne({ roomId }, { $set: { diceValue: null } });
        yield addLog(roomId, `Bonus roll for ${color}`, color);
        startTimer(roomId, io);
        io.to(roomId).emit('update-turn', color);
    }
    else if (!winner) {
        yield nextTurn(roomId, io);
    }
});
exports.peiceMoved = peiceMoved;
function notifyTaujiLudoWinner(roomId, winnerUserId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield axios_1.default.post(`${process.env.TAUJILUDO_API_URL}/api/battles/settle`, {
                roomId,
                winnerUserId,
                secretKey: process.env.GAME_SECRET_KEY // Shared secret for security
            });
            console.log(`Payout triggered for User: ${winnerUserId}`);
        }
        catch (err) {
            console.error("Payout failed to sync with TaujiLudo:", err);
        }
    });
}
// Add this to your handleDisconnect in gameControllers.ts
const handleDisconnect = (socket, io) => () => __awaiter(void 0, void 0, void 0, function* () {
    const room = yield Game_1.LudoGame.findOneAndUpdate({ "players.id": socket.id }, { $set: { "players.$.isOnline": false } }, { returnDocument: 'after' }).lean();
    if (room) {
        // 1. STOP THE TIMER
        if (turnTimeouts[room.roomId]) {
            clearTimeout(turnTimeouts[room.roomId]);
            delete turnTimeouts[room.roomId];
        }
        const player = room.players.find(p => p.id === socket.id);
        // 2. EMIT PAUSE (Tell frontend to show the waiting card)
        io.to(room.roomId).emit('game-paused', {
            userId: player === null || player === void 0 ? void 0 : player.userId,
            message: `${player === null || player === void 0 ? void 0 : player.color} disconnected. Game Paused.`
        });
        yield addLog(room.roomId, `Game Paused: ${player === null || player === void 0 ? void 0 : player.color} left.`, "system");
    }
});
exports.handleDisconnect = handleDisconnect;
