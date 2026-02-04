import { useEffect, useState } from 'react';
import './Particles.css';

const Particles = ({ x, y, onComplete }) => {
  const [particles] = useState(() =>
    Array.from({ length: 12 }, (_, i) => {
      const angle = (i / 12) * Math.PI * 2;
      const distance = 15 + Math.random() * 20;
      return {
        id: i,
        tx: Math.cos(angle) * distance,
        ty: Math.sin(angle) * distance
      };
    })
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 600);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="particles-container" style={{ left: x, top: y }}>
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle coin-burst"
          style={{
            '--tx': `${p.tx}px`,
            '--ty': `${p.ty}px`
          }}
        >
          🪙
        </div>
      ))}
    </div>
  );
};

export default Particles;
