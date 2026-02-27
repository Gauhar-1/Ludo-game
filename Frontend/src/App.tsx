import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GameProvider } from './context/GameContext';
import Home from './pages/Home';
import Game from './pages/Game';
import WaitingRoom from './components/WaitingRoom';

function App() {
  return (
    <GameProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/game/:roomId" element={<Game />} />
          <Route path="/waiting/:roomId" element={<WaitingRoom />} />
        </Routes>
      </Router>
    </GameProvider>
  );
}

export default App;