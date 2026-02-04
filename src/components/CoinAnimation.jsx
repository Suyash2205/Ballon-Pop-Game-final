import { useEffect, useState, useRef } from 'react';
import './CoinAnimation.css';

const CoinAnimation = ({ startX, startY, targetRef, onComplete }) => {
  const [targetPos, setTargetPos] = useState(null);
  const coinRef = useRef(null);

  useEffect(() => {
    if (targetRef?.current) {
      const rect = targetRef.current.getBoundingClientRect();
      setTargetPos({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
    }
  }, [targetRef]);

  useEffect(() => {
    if (!targetPos) return;
    const timer = setTimeout(() => {
      onComplete?.();
    }, 700);
    return () => clearTimeout(timer);
  }, [targetPos, onComplete]);

  if (!targetPos) return null;

  const deltaX = targetPos.x - startX;
  const deltaY = targetPos.y - startY;

  return (
    <div
      ref={coinRef}
      className="coin-animation"
      style={{
        left: startX,
        top: startY,
        '--delta-x': `${deltaX}px`,
        '--delta-y': `${deltaY}px`,
      }}
      aria-hidden
    >
      🪙
    </div>
  );
};

export default CoinAnimation;
