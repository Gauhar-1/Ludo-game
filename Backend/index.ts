import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { onDisconect, peiceMoved, rollDice, roomCreation } from './controllers/gameControllers';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  },
});


io.on('connection', (socket) => {
  console.log("User connected", socket.id);
  socket.on('create-or-join', roomCreation(socket, io));
  

  socket.on('roll-dice', rollDice(socket, io));
  

  socket.on( 'piece-moved', peiceMoved(socket, io));


  socket.on('disconnect', onDisconect(socket, io));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
