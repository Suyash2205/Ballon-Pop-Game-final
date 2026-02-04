import { useEffect } from 'react';
import './Feedback.css';

const Feedback = ({ show, isCorrect, text, type = 'normal', onHide }) => {
  useEffect(() => {
    if (show) {
      const duration = type === 'tryAgain' ? 600 : 1000;
      const timer = setTimeout(() => {
        onHide();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, onHide, type]);

  if (!show) return null;

  const getIcon = () => {
    if (type === 'celebration') return '🎉';
    if (type === 'tryAgain') return '💪';
    if (type === 'moveOn') return '👍';
    return isCorrect ? '🎉' : '💪';
  };

  const getClassName = () => {
    if (type === 'celebration') return 'celebration';
    if (type === 'tryAgain') return 'try-again';
    if (type === 'moveOn') return 'move-on';
    return isCorrect ? 'correct' : 'wrong';
  };

  return (
    <div className={`feedback-overlay ${type}`}>
      <div className={`feedback-content ${getClassName()}`}>
        <div className="feedback-icon">{getIcon()}</div>
        <p className="feedback-text">{text}</p>
      </div>
    </div>
  );
};

export default Feedback;
