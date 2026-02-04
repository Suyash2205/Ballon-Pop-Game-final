import { useEffect, useState } from 'react';
import './Confetti.css';

const COLORS = ['#f87171', '#60a5fa', '#4ade80', '#fde047', '#c084fc', '#fb923c', '#f472b6', '#22d3ee'];
const SHAPES = ['circle', 'square', 'triangle'];

const Confetti = () => {
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    // Generate confetti pieces
    const newPieces = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 1.5 + Math.random() * 1,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
      size: 8 + Math.random() * 8,
      rotation: Math.random() * 360
    }));
    setPieces(newPieces);
  }, []);

  return (
    <div className="confetti-container">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className={`confetti-piece ${piece.shape}`}
          style={{
            left: `${piece.left}%`,
            backgroundColor: piece.color,
            width: piece.size,
            height: piece.shape === 'triangle' ? 0 : piece.size,
            borderLeftWidth: piece.shape === 'triangle' ? piece.size / 2 : 0,
            borderRightWidth: piece.shape === 'triangle' ? piece.size / 2 : 0,
            borderBottomWidth: piece.shape === 'triangle' ? piece.size : 0,
            borderBottomColor: piece.shape === 'triangle' ? piece.color : 'transparent',
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
            '--rotation': `${piece.rotation}deg`
          }}
        />
      ))}
    </div>
  );
};

export default Confetti;
