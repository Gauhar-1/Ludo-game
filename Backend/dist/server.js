"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// server/index.ts
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server, {
    cors: { origin: '*' },
});
io.on('connection', (socket) => {
    console.log('User connected', socket.id);
    socket.on('create-room', (roomId) => {
        socket.join(roomId);
        io.to(roomId).emit('room-joined', { players: [socket.id] });
    });
    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        io.to(roomId).emit('player-joined', { id: socket.id });
    });
    socket.on('roll-dice', ({ roomId, value }) => {
        io.to(roomId).emit('dice-rolled', value);
    });
    socket.on('move-piece', ({ roomId, move }) => {
        io.to(roomId).emit('piece-moved', move);
    });
    socket.on('disconnect', () => {
        console.log('User disconnected', socket.id);
    });
});
server.listen(3001, () => console.log('Server running on 3001'));
