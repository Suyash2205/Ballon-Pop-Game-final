import { useState, useCallback, useEffect } from 'react';
import StartScreen from './screens/StartScreen';
import GradeSelectScreen from './screens/GradeSelectScreen';
import GameScreen from './screens/GameScreen';
import GameOverScreen from './screens/GameOverScreen';
import audioSystem from './utils/audioSystem';
import './App.css';

const SCREENS = {
  START: 'start',
  GRADE_SELECT: 'grade_select',
  GAME: 'game',
  GAMEOVER: 'gameover'
};

const HIGH_SCORE_KEY = 'brainRacersHighScore';

function App() {
  const [currentScreen, setCurrentScreen] = useState(SCREENS.START);
  const [gameStats, setGameStats] = useState(null);
  const [gameSettings, setGameSettings] = useState({ grade: null });
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(HIGH_SCORE_KEY);
      if (saved != null) setHighScore(Math.max(0, parseInt(saved, 10)));
    } catch {
      // ignore
    }
  }, []);

  const handleStart = useCallback(() => {
    setCurrentScreen(SCREENS.GRADE_SELECT);
  }, []);

  const handleBackToHome = useCallback(() => {
    setCurrentScreen(SCREENS.START);
  }, []);

  const handleGradeSelected = useCallback((grade) => {
    setGameSettings((prev) => ({ ...prev, grade }));
    audioSystem.init();
    setCurrentScreen(SCREENS.GAME);
  }, []);

  const handleBackToGrades = useCallback(() => {
    setCurrentScreen(SCREENS.GRADE_SELECT);
  }, []);

  const handleGameOver = useCallback((stats) => {
    const score = stats?.score ?? 0;
    const prevHigh = highScore;
    if (score > prevHigh) {
      setHighScore(score);
      try {
        localStorage.setItem(HIGH_SCORE_KEY, String(score));
      } catch {
        // ignore
      }
    }
    setGameStats({ ...stats, isNewHighScore: score > prevHigh });
    setCurrentScreen(SCREENS.GAMEOVER);
  }, [highScore]);

  const handleRestart = useCallback(() => {
    setGameStats(null);
    setCurrentScreen(SCREENS.GAME);
  }, []);

  return (
    <div className="app">
      {currentScreen === SCREENS.START && (
        <StartScreen onStart={handleStart} />
      )}
      {currentScreen === SCREENS.GRADE_SELECT && (
        <GradeSelectScreen
          onGradeSelected={handleGradeSelected}
          onBack={handleBackToHome}
        />
      )}
      {currentScreen === SCREENS.GAME && gameSettings.grade != null && (
        <GameScreen
          grade={gameSettings.grade}
          onGameOver={handleGameOver}
          onBackToGrades={handleBackToGrades}
        />
      )}
      {currentScreen === SCREENS.GAMEOVER && gameStats && (
        <GameOverScreen
          stats={gameStats}
          highScore={highScore}
          onRestart={handleRestart}
          onBackToHome={handleBackToHome}
        />
      )}
    </div>
  );
}

export default App;
