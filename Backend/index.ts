import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import {  handleDisconnect, peiceMoved, rollDice, roomCreation } from './controllers/gameControllers';
import connectDB from './config/db';

const app = express();
const server = createServer(app);

connectDB();

const origins = [
  "http://localhost:4000", 
  "http://localhost:5173"
];

if (process.env.FRONTEND_URL) {
  origins.push(process.env.FRONTEND_URL);
}

const io = new Server(server, {
  cors: {
    origin: origins,
    methods: ["GET", "POST"],
    credentials: true
  },
});


io.on('connection', (socket) => {
  console.log("User connected", socket.id);
  socket.on('create-or-join', roomCreation(socket, io));
  

  socket.on('roll-dice', rollDice(socket, io));
  

  socket.on( 'piece-moved', peiceMoved(socket, io));


  socket.on("disconnect", handleDisconnect(socket, io));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));