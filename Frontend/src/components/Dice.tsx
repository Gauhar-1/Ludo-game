import { useGame } from '../context/GameContext';
import { useParams } from 'react-router-dom';

const Dice = () => {
  const { socket, turn, diceValue,  playerColor } = useGame();
  const { roomId } = useParams();

  const isMyTurn = turn ===  playerColor;
  // const isMyTurn = true;

  const rollDice = () => {
    if (!isMyTurn || !roomId) return;

    const value = Math.ceil(Math.random() * 6);
    socket?.emit('roll-dice', { value, roomId });
  };


  return (
    <div className="flex flex-col items-center mt-4">
      <button
        onClick={rollDice}
        className={`px-6 py-3 rounded-lg font-medium transition duration-300 ${
          isMyTurn
            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
        disabled={!isMyTurn}
      >
        🎲 Roll Dice
      </button>

      

      <div className="mt-2 text-xl font-semibold text-gray-800">
        🎯 Dice Value: <span className="text-indigo-700">{diceValue ?? '-'}</span>
      </div>
    </div>
  );
};

export default Dice;
