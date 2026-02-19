"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onDisconect = exports.peiceMoved = exports.rollDice = exports.roomCreation = void 0;
const gameSet_1 = require("../utils/gameSet");
const TURN_DURATION_MS = 15000; // 15 seconds
/**
 * Utility: Add a system message to the room logs
 */
function addLog(roomId, message, color) {
    if (!gameSet_1.rooms[roomId])
        return;
    const log = { message, color: (color === "system" ? "white" : color), timestamp: Date.now() };
    gameSet_1.rooms[roomId].logs.unshift(log);
    if (gameSet_1.rooms[roomId].logs.length > 50)
        gameSet_1.rooms[roomId].logs.pop();
}
/**
 * Utility: Advance the turn to the next player in the rotation
 */
function nextTurn(roomId, io) {
    const room = gameSet_1.rooms[roomId];
    if (!room)
        return;
    const currentColor = room.turn;
    const players = room.players;
    const currentIndex = players.findIndex(p => p.color === currentColor);
    const nextIndex = (currentIndex + 1) % players.length;
    const nextColor = players[nextIndex].color;
    room.turn = nextColor;
    room.diceValue = null;
    room.sixCount = 0; // Reset consecutive sixes on turn change
    startTimer(roomId, io);
    io.to(roomId).emit('update-turn', nextColor);
    io.to(roomId).emit('room-data', {
        players: room.players,
        turn: room.turn,
        logs: room.logs,
        positions: room.positions
    });
}
/**
 * Utility: Handles the 15s turn countdown
 */
function startTimer(roomId, io) {
    const room = gameSet_1.rooms[roomId];
    if (!room)
        return;
    if (room.turnTimeout)
        clearTimeout(room.turnTimeout);
    room.timerStart = Date.now();
    io.to(roomId).emit('timer-sync', {
        timeLeft: TURN_DURATION_MS,
        totalTime: TURN_DURATION_MS
    });
    room.turnTimeout = setTimeout(() => {
        if (room.turn && !room.winner) {
            addLog(roomId, `Time out for ${room.turn}`, room.turn);
            nextTurn(roomId, io);
        }
    }, TURN_DURATION_MS);
}
// --- Controller Functions ---
/**
 * Handles Room Joining and Initialization
 */
const roomCreation = (socket, io) => (roomId) => {
    if (!roomId)
        return;
    if (!gameSet_1.rooms[roomId]) {
        gameSet_1.rooms[roomId] = {
            players: [],
            gameStarted: false,
            turn: null,
            diceValue: null,
            sixCount: 0,
            positions: {
                red: [-1, -1, -1, -1],
                green: [-1, -1, -1, -1],
                yellow: [-1, -1, -1, -1],
                blue: [-1, -1, -1, -1]
            },
            logs: [],
            winner: null,
            placeHolders: new Array(52).fill('')
        };
    }
    const room = gameSet_1.rooms[roomId];
    if (room.players.length >= 4) {
        socket.emit('room-full');
        return;
    }
    const existingPlayer = room.players.find(p => p.id === socket.id);
    if (existingPlayer) {
        socket.join(roomId);
        socket.emit('room-data', {
            players: room.players,
            turn: room.turn,
            playerColor: existingPlayer.color,
            logs: room.logs,
            positions: room.positions
        });
        return;
    }
    // Assign Color (Prefer opposite colors for 2-player: Red vs Yellow or Blue vs Green)
    const usedColors = new Set(room.players.map(p => p.color));
    let colorToAssign = gameSet_1.availableColors.find(c => !usedColors.has(c));
    if (!colorToAssign)
        return;
    const player = { id: socket.id, color: colorToAssign };
    room.players.push(player);
    socket.join(roomId);
    addLog(roomId, `${colorToAssign} Joined the Arena`, colorToAssign);
    // Sync state to all
    io.to(roomId).emit('room-data', {
        players: room.players,
        turn: room.turn,
        logs: room.logs,
        positions: room.positions
    });
    // START MATCH: Triggers when 2 players have joined
    if (room.players.length === 2 && !room.gameStarted) {
        room.gameStarted = true;
        room.turn = room.players[0].color;
        addLog(roomId, "Battle Commenced!", "red");
        startTimer(roomId, io);
        io.to(roomId).emit('update-turn', room.turn);
    }
};
exports.roomCreation = roomCreation;
/**
 * Handles Dice Rolling Logic including Triple-Six Rule
 */
const rollDice = (socket, io) => ({ roomId }) => {
    const room = gameSet_1.rooms[roomId];
    if (!room || !room.gameStarted || room.winner)
        return;
    const player = room.players.find(p => p.id === socket.id);
    if (!player || room.turn !== player.color || room.diceValue !== null)
        return;
    const value = Math.ceil(Math.random() * 6);
    // Rule: 3 Consecutive Sixes cancels turn
    if (value === 6) {
        room.sixCount++;
    }
    else {
        room.sixCount = 0;
    }
    if (room.sixCount === 3) {
        addLog(roomId, `Triple 6! Turn Revoked`, player.color);
        io.to(roomId).emit('dice-rolled', { color: player.color, value: 6 });
        setTimeout(() => nextTurn(roomId, io), 1000);
        return;
    }
    room.diceValue = value;
    addLog(roomId, `${player.color} rolled ${value}`, player.color);
    io.to(roomId).emit('dice-rolled', {
        playerId: socket.id,
        color: player.color,
        value: value,
        logs: room.logs
    });
    // Auto-Pass: Check if any piece can actually move
    const currentPositions = room.positions[player.color];
    const canMove = currentPositions.some(pos => {
        if (pos === -1)
            return value === 6; // Needs 6 to exit base
        return pos + value <= 56; // Cannot overshoot home
    });
    if (!canMove) {
        addLog(roomId, `No valid moves for ${player.color}`, player.color);
        setTimeout(() => nextTurn(roomId, io), 1500);
    }
    else {
        // Restart timer to give user 15s to choose a piece
        startTimer(roomId, io);
    }
};
exports.rollDice = rollDice;
/**
 * Handles Piece Movement, Captures, and Win Conditions
 */
const peiceMoved = (socket, io) => ({ roomId, movedPieceIndex }) => {
    const room = gameSet_1.rooms[roomId];
    if (!room || room.winner)
        return;
    const player = room.players.find(p => p.id === socket.id);
    if (!player || room.turn !== player.color || !room.diceValue)
        return;
    const diceValue = room.diceValue;
    const pieceIdx = Number(movedPieceIndex);
    const currentPos = room.positions[player.color][pieceIdx];
    // 1. Logic Validation
    let newPos = -1;
    if (currentPos === -1) {
        if (diceValue === 6)
            newPos = 0;
        else
            return;
    }
    else {
        newPos = currentPos + diceValue;
        if (newPos > 56)
            return;
    }
    let extraTurn = false;
    // 2. Clear previous spot if it was on the common path
    if (currentPos >= 0 && currentPos <= 50) {
        const oldActualIdx = (0, gameSet_1.getActualPathIndex)(player.color, currentPos);
        if (room.placeHolders[oldActualIdx] === `${player.color}-${pieceIdx}`) {
            room.placeHolders[oldActualIdx] = '';
        }
    }
    // 3. Handle Capture Logic (Only on common path 0-50)
    if (newPos <= 50) {
        const actualIndex = (0, gameSet_1.getActualPathIndex)(player.color, newPos);
        const occupant = room.placeHolders[actualIndex];
        // Safe zone check (Stars/Halt points)
        if (occupant && !gameSet_1.haltIndexes.includes(actualIndex)) {
            const [oppColor, oppIdxStr] = occupant.split('-');
            const oppIdx = Number(oppIdxStr);
            if (oppColor !== player.color) {
                // KILL DETECTED: Reset opponent piece to base
                room.positions[oppColor][oppIdx] = -1;
                addLog(roomId, `${player.color} captured ${oppColor}!`, player.color);
                extraTurn = true; // Rule: Capturing gives extra turn
            }
        }
        // Update placeholder for the new spot
        room.placeHolders[actualIndex] = `${player.color}-${pieceIdx}`;
    }
    // 4. Update memory
    room.positions[player.color][pieceIdx] = newPos;
    // 5. Check Home/Win Condition
    if (newPos === 56) {
        addLog(roomId, `${player.color} reached Home!`, player.color);
        extraTurn = true; // Rule: Reaching home gives extra turn
        const allHome = room.positions[player.color].every((p) => p === 56);
        if (allHome) {
            room.winner = player.color;
            addLog(roomId, `Victory for ${player.color}!`, player.color);
            io.to(roomId).emit('declare-winner', player.color);
            return;
        }
    }
    // 6. Broadcast Movement
    io.to(roomId).emit('update-piece', {
        newPosition: room.positions,
        logs: room.logs
    });
    // 7. Turn Routing
    if (diceValue === 6 || extraTurn) {
        room.diceValue = null; // Clear dice for next roll
        addLog(roomId, `Bonus roll for ${player.color}`, player.color);
        startTimer(roomId, io);
        // Keep turn on same player
        io.to(roomId).emit('update-turn', player.color);
    }
    else {
        nextTurn(roomId, io);
    }
};
exports.peiceMoved = peiceMoved;
const onDisconect = (socket, io) => () => {
    console.log(`User disconnected: ${socket.id}`);
};
exports.onDisconect = onDisconect;
