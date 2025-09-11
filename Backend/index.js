"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*',
    },
});
const rooms = {};
io.on('connection', (socket) => {
    socket.on('create-or-join', (roomId) => {
        if (!rooms[roomId])
            rooms[roomId] = [];
        if (rooms[roomId].length < 2) {
            rooms[roomId].push(socket.id);
            socket.join(roomId);
            io.to(roomId).emit('room-data', {
                players: rooms[roomId],
                turn: rooms[roomId][0],
            });
        }
    });
    socket.on('piece-moved', (pos) => {
        const roomId = [...socket.rooms][1];
        if (pos >= 57)
            io.to(roomId).emit('winner', socket.id);
    });
    socket.on('declare-winner', (id) => {
        const roomId = [...socket.rooms][1];
        io.to(roomId).emit('winner', id);
    });
    socket.on('roll-dice', (value) => {
        socket.broadcast.emit('dice-rolled', value);
    });
    socket.on('disconnect', () => {
        Object.entries(rooms).forEach(([roomId, players]) => {
            rooms[roomId] = players.filter((id) => id !== socket.id);
        });
    });
});
server.listen(3001, () => console.log('Server running on http://localhost:3001'));
