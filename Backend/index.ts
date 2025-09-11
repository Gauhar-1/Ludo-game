import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { onDisconect, peiceMoved, rollDice, roomCreation } from './controllers/gameControllers';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});





io.on('connection', (socket) => {
  console.log("User connected", socket.id);
  socket.on('create-or-join', roomCreation(socket, io));
  

  socket.on('roll-dice', rollDice(socket, io));
  

  socket.on( 'piece-moved', peiceMoved(socket, io));


  // socket.on('declare-winner', ({ roomId, id }: { roomId: string; id: string }) => {
  //   const playerData = rooms[roomId]?.find((p) => p.id === id);
  //   if (playerData) {
  //     io.to(roomId).emit('winner', { id, color: playerData.color });
  //   }
  // });

  socket.on('disconnect', onDisconect(socket, io));
});

server.listen(3001, () => console.log('Server running on http://localhost:3001'));
