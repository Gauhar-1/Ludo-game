"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const gameControllers_1 = require("./controllers/gameControllers");
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*',
    },
});
io.on('connection', (socket) => {
    console.log("User connected", socket.id);
    socket.on('create-or-join', (0, gameControllers_1.roomCreation)(socket, io));
    socket.on('roll-dice', (0, gameControllers_1.rollDice)(socket, io));
    socket.on('piece-moved', (0, gameControllers_1.peiceMoved)(socket, io));
    // socket.on('declare-winner', ({ roomId, id }: { roomId: string; id: string }) => {
    //   const playerData = rooms[roomId]?.find((p) => p.id === id);
    //   if (playerData) {
    //     io.to(roomId).emit('winner', { id, color: playerData.color });
    //   }
    // });
    socket.on('disconnect', (0, gameControllers_1.onDisconect)(socket, io));
});
server.listen(3001, () => console.log('Server running on http://localhost:3001'));
