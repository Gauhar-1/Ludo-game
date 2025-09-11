import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useGame } from '../context/GameContext';

const Home = () => {
  const navigate = useNavigate();
  
  const { roomCode, setRoomCode } = useGame();

  const handleCreate = () => {
    const id = uuidv4();
    setRoomCode(id)
    navigate(`/game/${id}`);
  };

  const handleJoin = () => {
    if (roomCode) navigate(`/game/${roomCode}`);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <button className="bg-green-600 px-6 py-2 rounded-xl text-white" onClick={handleCreate}>
        Create Game
      </button>
      <input
        className="border p-2 rounded"
        value={roomCode}
        onChange={(e) => setRoomCode(e.target.value)}
        placeholder="Enter Room Code"
      />
      <button className="bg-blue-600 px-6 py-2 rounded-xl text-white" onClick={handleJoin}>
        Join Game
      </button>
    </div>
  );
};

export default Home;