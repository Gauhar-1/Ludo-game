import { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import Board from '../components/Board';
import Dice from '../components/Dice';

const Game = () => {
  const { roomId } = useParams();
  const hasConnected = useRef(false);
  const { connectSocket, turn, winner } = useGame();

  useEffect(() => {
    if (roomId && !hasConnected.current){ 
      console.log("Called socket connections")
      connectSocket(roomId);

      hasConnected.current = true;
    }
    else if(!roomId) console.log("No room card");

    return ()=>{
      if(hasConnected.current){
        console.log("Cleanup: Disconnecting socket.")
        hasConnected.current = false;
      }
    }
  }, [roomId]);

  return (
    <div className="flex flex-col items-center p-4">
      <h1 className="text-2xl font-bold mb-4">Room: {roomId}</h1>
      <Board />
      <Dice />
      <div className="mt-4">
        {winner ? (
          <p className="text-xl text-green-600">Winner: {winner}</p>
        ) : (
          turn && (
            <p className="text-xl">
              Turn: <span className={`font-semibold text-${turn.color}-500`}>{turn.color}</span>
            </p>
          )
        )}
      </div>
    </div>
  );
};

export default Game;
