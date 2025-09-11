// server/index.ts
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const server = createServer(app);
const io = new Server(server, {
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
