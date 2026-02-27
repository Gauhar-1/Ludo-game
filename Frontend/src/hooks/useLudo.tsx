import { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext'; // Your existing GameContext

export const useLudoBridge = () => {
  const { connectSocket, socket } = useGame();
  const [isAuthorizing, setIsAuthorizing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Parse URL parameters (?room=XYZ&token=ABC)
    const params = new URLSearchParams(window.location.search);
    const roomId = params.get('room');
    const token = params.get('token');

    if (!roomId || !token) {
      setError("Invalid Match Link. Please join from the Home Page.");
      setIsAuthorizing(false);
      return;
    }

    // 2. Save token for the Socket.io Handshake
    localStorage.setItem('game_token', token);

    // 3. Initiate Connection
    try {
      connectSocket(roomId);
      setIsAuthorizing(false);
    } catch (err) {
      setError("Failed to connect to Game Server.");
      setIsAuthorizing(false);
    }

    // 4. Cleanup on unmount
    return () => {
      socket?.disconnect();
    };
  }, []);

  return { isAuthorizing, error, socket };
};