import { Socket, Server } from "socket.io";
import { availableColors, colorSets, haltIndexes, placeHolders, rooms, startingIndexes } from "../utils/gameSet";
import { PlayerColor, PlayerData, Positions } from "../utils/type";

export const roomCreation = (socket: Socket , io: Server) => (roomId: string) => {
    if(!roomId) return console.log("No room Id", roomId)
    if (!rooms[roomId]) 
      rooms[roomId] = {
        players: [],
        gameStarted: false,
        turn: null,
        DiceValues: null,
      };

    const room = rooms[roomId];
    const playersInRoom = room.players;
    console.log("Player in room", playersInRoom);
    const currentCount = playersInRoom.length;
  
    if (currentCount >= 2) {
      socket.emit('room-full');
      return;
    }
  
    const allowedColors = colorSets[currentCount + 1]; // +1 because we are adding one player
    const usedColors = new Set(playersInRoom.map(p => p.color));
    const remainingColors = availableColors.find(c => !usedColors.has(c));

    if(!remainingColors){
      return console.log("No remaining colors");
    }
  
     const player: PlayerData= {
         id: socket.id,
        color: remainingColors
      }
    playersInRoom.push(player);
    socket.join(roomId);

    // Tell the joining player their color and the current room state
    socket.emit('player-joined', {
      playerColor: player.color,
      players: playersInRoom,
    });

    if(playersInRoom.length === 2){
      const firstPlayer = playersInRoom[Math.floor(Math.random() * playersInRoom.length)]

      room.turn = player.color;
      room.gameStarted = true;

      io.to(roomId).emit('room-data', {
      players: playersInRoom,
      turn: room.turn, // randomly chosen first player
      });
    }
  }

  export const rollDice =(socket: Socket , io: Server) => ({ value, roomId }: { value: number; roomId: string }) => {
    const room = rooms[roomId];
    const playerData = room.players.find((p) => p.id === socket.id);
    if (!playerData) return;
    room.DiceValues = value;
  
    io.to(roomId).emit('dice-rolled', {
      playerId: socket.id,
      color: playerData.color,
      value,
    });
  
  }

  export const peiceMoved =(socket: Socket , io: Server) => ({ roomId, color, movedPieceIndex, newPosition,}: {
      roomId: string;
      color: 'red' | 'blue';
      pieceId: number;
      movedPieceIndex: string;
      newPosition: Positions;
    }) => {
      if(!roomId){
      return console.log("No room Id (peice-moved)", roomId);
    }
      const room = rooms[roomId];
      const player = room.players.find( p => p.id != socket.id) 
      const turn = player?.color
      const diceValue = room.DiceValues || 0;
      const peiceIndex = parseInt(movedPieceIndex);
      console.log("Positions Before", newPosition);
      console.log("peice to move",color + movedPieceIndex );
      
      const position = newPosition[color];
      position[peiceIndex] += diceValue;
      newPosition[color] = position;

      // Add position of the peice
      const step = position[peiceIndex];
      const start = startingIndexes[color];
      let actualPos = step + start;
      if(actualPos > placeHolders.length){
           actualPos -= placeHolders.length;
        }
        
      console.log("placeHolders[actualPos] =", placeHolders[actualPos]);
      if(placeHolders[actualPos] != '' && !haltIndexes.includes(actualPos)){

        const info = placeHolders[actualPos].split('-');
        console.log("Actual Pos", actualPos);

        if(color == info[0]){
          socket.emit('false-move' , { message : "Peice already present in the place"});
          return; 
        }
          const Oppcolor = info[0] as PlayerColor;
          const OppIndex = parseInt(info[1]);

          const position = newPosition[Oppcolor];
          position[OppIndex] = -1;
          newPosition[Oppcolor] = position;
        }
        
      if(step <= 50 && !haltIndexes.includes(actualPos)) placeHolders[actualPos] =`${color}-${peiceIndex}`;
      placeHolders[actualPos - diceValue] = '';

      console.log("Positions After", newPosition);
      console.log("Placeholder", placeHolders);
      
      io.to(roomId).emit('update-piece', {
        players: room.players,
        turn: room.turn,
        diceValue: diceValue,
        peiceIndex,
        newPosition
      });

      io.to(roomId).emit('update-turn', turn);
      console.log("New position");

    }

    export const onDisconect =(socket: Socket , io: Server)=> () => {
   console.log(`User disconnected: ${socket.id}`);

   for(const roomId in rooms){
    const room = rooms[roomId];
    const playerIndex = room.players.findIndex(p => p.id === socket.id);

    if(playerIndex !== -1){
      const disconnectedPlayer = room.players.splice(playerIndex, 1)[0];

      // If the room is now empty, delete it to free up memory
      if(room.players.length === 0){
        delete rooms[roomId];
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
