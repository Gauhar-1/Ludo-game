import {  useEffect, useState } from 'react';
import { PlayerColor, useGame } from '../context/GameContext';
import { basePositions, commonPath, getActualPathIndex, homePath, peiceStack } from '../utils/gameLogic';
import { BOARD_SIZE, getTileClass, getTileType, grid } from '../utils/boardStyle';

const Board = () => {
    const { turn, socket, diceValue, positions, falseMove, setFalseMove, playerColor, roomCode } = useGame();

    const [selectedPieceIndex, setSelectedPieceIndex] = useState<number | null>(null);
  
  

  const [timeLeft, setTimeLeft] = useState(10); // 10 seconds to roll

  useEffect(() => {
    // Reset and start countdown when it's player's turn
    if (turn === playerColor) {
      setTimeLeft(10);
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setTimeLeft(0); // stop countdown if not player's turn
    }
  }, [turn, playerColor]);

  const isMyTurn = turn === playerColor;


  const movePiece = () => {
    if (
      turn === playerColor &&
      diceValue !== null &&
      selectedPieceIndex !== null
    ) {

      socket.emit('piece-moved', {
          roomId: roomCode,
          movedPieceIndex: selectedPieceIndex,
          color: playerColor,
          newPosition: positions
        });
  
      setSelectedPieceIndex(null);
    }
    else{
      alert('Please select a peice');
    }
  };


  return (
    <div className="flex flex-col items-center">
      <div
        className="grid w-[600px] h-[600px] border-4 shadow-xl"
        style={{
          gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
          gridTemplateRows: `repeat(${BOARD_SIZE}, 1fr)`,
        }}
      >
        {grid.flat().map((type, index) => {
          const row = Math.floor(index / BOARD_SIZE);
          const col = index % BOARD_SIZE;

          return type.startsWith('center-') ? (
            <div key={index} className="relative w-full">
              <div className={`absolute inset-0 ${
                type === 'center-yellow' ? 'bg-yellow-400'
                : type === 'center-green' ? 'bg-green-600'
                : type === 'center-blue' ? 'bg-blue-600'
                : 'bg-red-600'
              }`} />
              <div className={`absolute inset-0 ${
                type === 'center-red' ? 'clip-triangle-br bg-green-600'
                : type === 'center-green' ? 'clip-triangle-tl bg-yellow-400'
                : type === 'center-blue' ? 'clip-triangle-bl bg-red-600'
                : 'clip-triangle-tr bg-blue-600'
              }`} />
            </div>
          ) : (
            <div key={index} className={`relative w-full h-full  ${getTileClass(type)}`}>

            {type.startsWith('star-') && (
            <div key={index} className='p-0.5'>
            <div
              className={`flex p-1 absolute z-0  items-center rounded-3xl border-2 ${
                type === 'star-yellow-stop' ? 'bg-yellow-500'
                : type === 'star-green-stop' ? 'bg-green-600'
                : type === 'star-blue-stop' ? 'bg-blue-600'
                : 'bg-red-600'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="black" className="size-6">
                <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
              </svg>
            </div>
            </div>
          )}

              {Object.entries(positions).map(([playerId, pieces]) =>
  (pieces as number[]).map((step: number, i: number) => {
    // Piece is on the common path
    if (step >= 0) {

      const isHomeRun = step >= 51;

      const pathIndex = isHomeRun ? step - 51 : getActualPathIndex(playerId as PlayerColor, step);

      const path: number[] = isHomeRun ? homePath[playerId][pathIndex] : commonPath[pathIndex];
      const ishalt = isHomeRun ? null : peiceStack(pathIndex);

      const [pieceRow, pieceCol] = path

      if (row === pieceRow && col === pieceCol) {
        return (
          <div
            key={`${playerId}-${i}`}
            onClick={() =>  setSelectedPieceIndex(i)}
            className={`absolute size-4 md:size-5 rounded-full z-10 cursor-pointer text-white flex  justify-center items-center ${
              playerId === 'red' ? 'bg-red-800'
              : playerId === 'green' ? 'bg-green-800'
              : playerId === 'yellow' ? 'bg-yellow-700'
              : 'bg-blue-800'
            }`}
            style={ ishalt?  {
              top: `${(i % 2) * 50}%`,
              left: `${Math.floor(i / 2) * 50}%`,
            } : {
              position: 'absolute',
              top: '50%',
              left: '50%',
              padding: '16px',
              transform: 'translate(-50%, -50%)',
            }}
          >{i}</div>
        );
      }
    } else {
      // Piece is still in base
      const [baseRow, baseCol] = basePositions[playerId][i];
      if (row === baseRow && col === baseCol) {
        return (
          <div
            key={`${playerId}-base-${i}`}
            onClick={() => playerId === playerColor && setSelectedPieceIndex(i)}
            className={`absolute size-7 md:size-5 rounded-full z-10 cursor-pointer  ${
              playerId === 'red' ? 'bg-red-800'
              : playerId === 'green' ? 'bg-green-800'
              : playerId === 'yellow' ? 'bg-yellow-700'
              : 'bg-blue-800'
            }`}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />
        );
      }
    }

    return null;
  })
)}

            </div>
          );
        })}
      </div>

      <div className=" mt-4">
      <div
      className={` ${
        playerColor === 'red'
          ? 'top-0 left-0'
          : playerColor === 'blue'
          ? 'top-0 left-0'
          : playerColor === 'green'
          ? 'bottom-0 left-0'
          : 'bottom-0 right-0'
      } p-4 m-2 rounded-xl shadow-md w-44 text-white transition-all duration-300 ${
        isMyTurn ? 'bg-green-600' : 'bg-gray-700'
      }`}
    >
      <div className="font-semibold text-lg">{isMyTurn ?  'You' : "Him"}</div>
      <div className="text-sm">Color: {playerColor}</div>
      <div className="text-sm">
        Turn: <span className="font-bold">{turn}</span>
      </div>
      <div className="text-sm">
        Selected Peice: <span className="font-bold">{selectedPieceIndex}</span>
      </div>
      {isMyTurn && (
        <div className="mt-2 text-sm">
          ⏳ Roll in: <span className="font-mono">{timeLeft}s</span>
        </div>
      )}
      {diceValue && <div className="mt-2 text-sm">🎲 Dice Rolled: {diceValue}</div>}
      <button className='bg-green-500 font-bold p-2 rounded-lg mt-2 ' onClick={()=>{
        if(!falseMove){
          movePiece()
        }
        else{
          setFalseMove(false);
        }
      }}>Move</button>
    </div>
      </div>
      <div className="mt-4 relative">
        {isMyTurn ? (
          <div className="text-lg font-semibold text-green-700 animate-pulse">
            🎲 Your Turn! Roll within {timeLeft}s
          </div>
        ) : (
          <div className="text-lg font-semibold text-gray-500">
            ⏳ Waiting for opponent...
          </div>
        )}
      </div>
      {falseMove && <div className='p-2 text-2xl text-red-400 font-black'>It is a false move, play again</div>}
    </div>
  );
};

export default Board;
