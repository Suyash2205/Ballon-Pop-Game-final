import './StartScreen.css';

const StartScreen = ({ onStart }) => {
  return (
    <div className="screen start-screen">
      <div className="start-content">
        <div className="logo">
          <div className="logo-icon">🧠</div>
          <h1>BRAIN<br />RACERS</h1>
        </div>
        <p className="tagline">Pop the correct answer!</p>
        <button className="primary-btn" onClick={onStart}>
          START GAME
        </button>
        <div className="instructions">
          <p>
            Solve math problems by popping the balloon with the correct answer
            before it floats away!
          </p>
        </div>
      </div>
    </div>
  );
};

export default StartScreen;
