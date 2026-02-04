import { useState, useEffect, useRef } from 'react';
import './Balloon.css';

const BALLOON_COLORS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan'];

// Ease-out: fast start (rising within ~2s), gentle slowdown near top
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

const Balloon = ({ answer, isCorrect, index, totalBalloons, duration, startDelay, onPop, disabled, greyedOut, paused }) => {
  const [state, setState] = useState('floating');
  const [color] = useState(() => BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)]);
  const [bottomPosition, setBottomPosition] = useState(0);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const stepRef = useRef(0);

  // Fixed horizontal position based on index
  const leftPosition = 10 + (index * (80 / totalBalloons)) + (40 / totalBalloons);

  // Start floating animation: staggered start + ease-out (rise quickly, slow at top)
  useEffect(() => {
    if (state !== 'floating' || greyedOut || disabled || paused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    const totalDistance = 100;
    const stepTime = 50;
    const totalSteps = Math.max(1, (duration * 1000) / stepTime);
    const delay = startDelay ?? 0;

    const runInterval = () => {
      stepRef.current = 0;
      intervalRef.current = setInterval(() => {
        stepRef.current += 1;
        const progress = Math.min(1, stepRef.current / totalSteps);
        const eased = easeOutCubic(progress);
        const newPos = totalDistance * eased;
        setBottomPosition(newPos);
        if (progress >= 1 && intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }, stepTime);
    };

    if (delay > 0) {
      timeoutRef.current = setTimeout(runInterval, delay);
    } else {
      runInterval();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [state, greyedOut, disabled, paused, duration, startDelay]);

  const handleClick = (e) => {
    if (disabled || greyedOut || paused || state !== 'floating') return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (isCorrect) {
      setState('popping');
      onPop(true, answer, e);
    } else {
      setState('shake');
      onPop(false, answer, e);
    }
  };

  return (
    <div
      className={`balloon ${color} ${state} ${greyedOut ? 'greyed-out' : ''}`}
      data-correct={isCorrect}
      style={{
        left: `${leftPosition}%`,
        bottom: `${bottomPosition}%`
      }}
      onClick={handleClick}
    >
      <div className="balloon-body">
        <div className="balloon-shape">
          <span className="balloon-answer">{answer}</span>
        </div>
        <div className="balloon-string"></div>
      </div>
    </div>
  );
};

export default Balloon;
