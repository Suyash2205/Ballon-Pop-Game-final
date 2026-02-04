import './GameOverScreen.css';

const GameOverScreen = ({ stats, highScore = 0, onRestart, onBackToHome }) => {
  const { score, correctAnswers, totalQuestions, bestStreak, isVictory, isNewHighScore } = stats;
  
  const accuracy = totalQuestions > 0 
    ? Math.round((correctAnswers / totalQuestions) * 100) 
    : 0;

  const handleShare = () => {
    const text = `🧠 Brain Racers Balloon Pop!\n\n` +
      `Total Coins: ${score}\n` +
      `Highest Coins Earned: ${highScore}\n` +
      `Correct: ${correctAnswers}/${totalQuestions}\n` +
      `Best Streak: ${bestStreak}x\n\n` +
      `Can you beat my score?`;

    if (navigator.share) {
      navigator.share({
        title: 'Brain Racers',
        text: text
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => {
        alert('Results copied to clipboard!');
      }).catch(() => {});
    }
  };

  return (
    <div className="screen gameover-screen">
      <div className="gameover-content">
        <h2 className={isVictory ? 'victory' : ''}>
          {isVictory ? 'Victory!' : 'Game Over'}
        </h2>
        <div className={`high-score-display stat-item ${isNewHighScore ? 'high-score-new' : ''}`}>
          <span className="stat-label">Highest Coins Earned</span>
          <span className="stat-value">
            {highScore}
            {isNewHighScore && <span className="new-badge">New!</span>}
          </span>
        </div>
        <div className="final-stats">
          <div className="stat-item">
            <span className="stat-label">Total Coins</span>
            <span className="stat-value">{score}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Questions Answered</span>
            <span className="stat-value">{correctAnswers}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Accuracy</span>
            <span className="stat-value">{accuracy}%</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Best Streak</span>
            <span className="stat-value">{bestStreak}</span>
          </div>
        </div>
        <button className="primary-btn" onClick={onRestart}>
          PLAY AGAIN
        </button>
        <button className="secondary-btn" onClick={handleShare}>
          SHARE
        </button>
        <button className="secondary-btn" onClick={onBackToHome}>
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default GameOverScreen;
