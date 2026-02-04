import { useEffect, useState } from 'react';
import './Timer.css';

const Timer = ({ timeRemaining, maxTime }) => {
  const seconds = Math.max(0, Math.ceil(timeRemaining));
  const circumference = 2 * Math.PI * 45;
  const progress = timeRemaining / maxTime;
  const offset = circumference * (1 - progress);

  const getTimerClass = () => {
    if (timeRemaining <= 3) return 'danger';
    if (timeRemaining <= 5) return 'warning';
    return '';
  };

  return (
    <div className={`timer-ring ${getTimerClass()}`}>
      <svg viewBox="0 0 100 100">
        <circle className="timer-bg" cx="50" cy="50" r="45"></circle>
        <circle
          className="timer-progress"
          cx="50"
          cy="50"
          r="45"
          style={{ strokeDashoffset: offset }}
        ></circle>
      </svg>
      <span className="timer-display">{seconds}</span>
    </div>
  );
};

export default Timer;
