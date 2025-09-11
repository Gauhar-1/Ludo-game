"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onDisconect = exports.peiceMoved = exports.rollDice = exports.roomCreation = void 0;
const gameSet_1 = require("../utils/gameSet");
const roomCreation = (socket, io) => (roomId) => {
    if (!roomId)
        return console.log("No room Id", roomId);
    if (!gameSet_1.rooms[roomId])
        gameSet_1.rooms[roomId] = {
            players: [],
            gameStarted: false,
            turn: null,
            DiceValues: null,
        };
    const room = gameSet_1.rooms[roomId];
    const playersInRoom = room.players;
    console.log("Player in room", playersInRoom);
    const currentCount = playersInRoom.length;
    if (currentCount >= 2) {
        socket.emit('room-full');
        return;
    }
    const allowedColors = gameSet_1.colorSets[currentCount + 1]; // +1 because we are adding one player
    const usedColors = new Set(playersInRoom.map(p => p.color));
    const remainingColors = gameSet_1.availableColors.find(c => !usedColors.has(c));
    if (!remainingColors) {
        return console.log("No remaining colors");
    }
    const player = {
        id: socket.id,
        color: remainingColors
    };
    playersInRoom.push(player);
    socket.join(roomId);
    // Tell the joining player their color and the current room state
    socket.emit('player-joined', {
        playerColor: player.color,
        players: playersInRoom,
    });
    if (playersInRoom.length === 2) {
        const firstPlayer = playersInRoom[Math.floor(Math.random() * playersInRoom.length)];
        room.turn = player.color;
        room.gameStarted = true;
        io.to(roomId).emit('room-data', {
            players: playersInRoom,
            turn: room.turn, // randomly chosen first player
        });
    }
};
exports.roomCreation = roomCreation;
const rollDice = (socket, io) => ({ value, roomId }) => {
    const room = gameSet_1.rooms[roomId];
    const playerData = room.players.find((p) => p.id === socket.id);
    if (!playerData)
        return;
    room.DiceValues = value;
    io.to(roomId).emit('dice-rolled', {
        playerId: socket.id,
        color: playerData.color,
        value,
    });
};
exports.rollDice = rollDice;
const peiceMoved = (socket, io) => ({ roomId, color, movedPieceIndex, newPosition, }) => {
    if (!roomId) {
        return console.log("No room Id (peice-moved)", roomId);
    }
    const room = gameSet_1.rooms[roomId];
    const player = room.players.find(p => p.id != socket.id);
    const turn = player === null || player === void 0 ? void 0 : player.color;
    const diceValue = room.DiceValues || 0;
    const peiceIndex = parseInt(movedPieceIndex);
    console.log("Positions Before", newPosition);
    console.log("peice to move", color + movedPieceIndex);
    const position = newPosition[color];
    position[peiceIndex] += diceValue;
    newPosition[color] = position;
    // Add position of the peice
    const step = position[peiceIndex];
    const start = gameSet_1.startingIndexes[color];
    let actualPos = step + start;
    if (actualPos > gameSet_1.placeHolders.length) {
        actualPos -= gameSet_1.placeHolders.length;
    }
    console.log("placeHolders[actualPos] =", gameSet_1.placeHolders[actualPos]);
    if (gameSet_1.placeHolders[actualPos] != '') {
        const info = gameSet_1.placeHolders[actualPos].split('-');
        console.log("Actual Pos", actualPos);
        if (color == info[0]) {
            socket.emit('false-move', { message: "Peice already present in the place" });
            return;
        }
        const Oppcolor = info[0];
        const OppIndex = parseInt(info[1]);
        const position = newPosition[Oppcolor];
        position[OppIndex] = -1;
        newPosition[Oppcolor] = position;
    }
    if (step <= 50)
        gameSet_1.placeHolders[actualPos] = `${color}-${peiceIndex}`;
    gameSet_1.placeHolders[actualPos - diceValue] = '';
    console.log("Positions After", newPosition);
    console.log("Placeholder", gameSet_1.placeHolders);
    io.to(roomId).emit('update-piece', {
        players: room.players,
        turn: room.turn,
        diceValue: diceValue,
        peiceIndex,
        newPosition
    });
    io.to(roomId).emit('update-turn', turn);
    console.log("New position");
};
exports.peiceMoved = peiceMoved;
const onDisconect = (socket, io) => () => {
    console.log(`User disconnected: ${socket.id}`);
    for (const roomId in gameSet_1.rooms) {
        const room = gameSet_1.rooms[roomId];
        const playerIndex = room.players.findIndex(p => p.id === socket.id);
        if (playerIndex !== -1) {
            const disconnectedPlayer = room.players.splice(playerIndex, 1)[0];
            // If the room is now empty, delete it to free up memory
            if (room.players.length === 0) {
                delete gameSet_1.rooms[roomId];
                console.log(`Room ${roomId} is empty and has been deleted.`);
            }
            else {
                // Notify remaining players about the departure
                io.to(roomId).emit('Player-left', {
                    disconnectedColor: disconnectedPlayer.color,
                    players: room.players
                });
                // Here you might want to add logic to handle a game in progress
                // (e.g., pause the game, skip the player's turn, or declare a winner)
            }
            break; // Player found and handled, exit loop
        }
    }
};
exports.onDisconect = onDisconect;
