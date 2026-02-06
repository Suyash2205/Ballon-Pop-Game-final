import { useState, useEffect, useCallback, useRef } from 'react';
import Timer from '../components/Timer';
import QuestionBoard from '../components/QuestionBoard';
import Balloon from '../components/Balloon';
import Feedback from '../components/Feedback';
import Particles from '../components/Particles';
import Confetti from '../components/Confetti';
import { generateQuestionForGrade, resetQuestionSession } from '../utils/mathGenerator';
import audioSystem from '../utils/audioSystem';
import './GameScreen.css';

const TOTAL_QUESTIONS = 20;

// Kid-friendly encouraging messages
const CORRECT_MESSAGES = [
  'Great job!',
  'Awesome!',
  'You got it!',
  'Amazing!',
  'Fantastic!',
  'Way to go!',
  'Super!',
  'Brilliant!',
  'Nice work!',
  'You rock!'
];

const FIRST_WRONG_MESSAGES = [
  'Try again!',
  'Almost!',
  'So close!',
  'One more try!',
  'Keep going!'
];

const SECOND_WRONG_MESSAGES = [
  "Good try! Let's move on.",
  "Nice effort! Next one!",
  "You'll get the next one!",
  "Keep going, you're doing great!"
];

const MAX_TIME_GRADE_3 = 30;
const MAX_TIME_GRADES_4_7 = 30;
const BALLOON_DURATION_SLOW = 42;
const BALLOON_DURATION_FAST = 18;
const BALLOON_START_DELAY_SLOW = 320;
const BALLOON_START_DELAY_FAST = 175;

const GameScreen = ({ grade, onGameOver, onBackToGrades }) => {
  const useSlowerBalloons = grade >= 3 && grade <= 7;
  const maxTimeForGrade = MAX_TIME_GRADES_4_7;
  // Game state
  const [score, setScore] = useState(0);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  // Keep refs in sync to avoid stale values in delayed callbacks.
  const scoreRef = useRef(score);
  const correctAnswersRef = useRef(correctAnswers);
  const bestStreakRef = useRef(bestStreak);

  // Pause state
  const [isPaused, setIsPaused] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  // Question state
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [balloonKey, setBalloonKey] = useState(0);
  const [balloonsDisabled, setBalloonsDisabled] = useState(false);
  const [forceFlyAway, setForceFlyAway] = useState(false);
  const [attempts, setAttempts] = useState(0); // Track attempts per question
  const [wrongBalloons, setWrongBalloons] = useState([]); // Track which balloons were clicked wrong

  // Timer state (initialized by nextQuestion; default for grade)
  const [timeRemaining, setTimeRemaining] = useState(maxTimeForGrade);
  const [maxTime, setMaxTime] = useState(maxTimeForGrade);
  const timerRef = useRef(null);

  // UI state
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [feedback, setFeedback] = useState({ show: false, isCorrect: false, text: '', type: 'normal' });
  const [particles, setParticles] = useState([]);
  const [showStreak, setShowStreak] = useState(false);
  const [comboText, setComboText] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Per-balloon float timing: grades 4–7 get slower rise
  const getBalloonDuration = useCallback(() => {
    return useSlowerBalloons ? BALLOON_DURATION_SLOW : BALLOON_DURATION_FAST;
  }, [useSlowerBalloons]);

  const balloonStartDelayStep = useSlowerBalloons ? BALLOON_START_DELAY_SLOW : BALLOON_START_DELAY_FAST;

  const getBalloonStartDelay = useCallback((index, totalBalloons) => {
    const indices = Array.from({ length: totalBalloons }, (_, i) => i);
    const order = [...indices].sort((a, b) => {
      const ha = (balloonKey * 17 + a * 11) % 100;
      const hb = (balloonKey * 17 + b * 11) % 100;
      return ha - hb;
    });
    const position = order.indexOf(index);
    return position * balloonStartDelayStep;
  }, [balloonKey, balloonStartDelayStep]);

  // Sync refs to latest values for reliable game-over stats.
  useEffect(() => {
    scoreRef.current = score;
    correctAnswersRef.current = correctAnswers;
    bestStreakRef.current = bestStreak;
  }, [score, correctAnswers, bestStreak]);

  // Start timer (only runs when not paused)
  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = Math.max(0, prev - 0.1);
        if (newTime <= 3 && newTime > 0 && Math.floor(newTime * 10) % 10 === 0) {
          audioSystem.playTick();
        }
        return newTime;
      });
    }, 100);
  }, []);

  // Stop timer
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Handle timeout - treat as second wrong attempt (only when not paused)
  useEffect(() => {
    if (!isPaused && timeRemaining <= 0) {
      handleMissedQuestion();
    }
  }, [timeRemaining, isPaused]);

  // Generate next question
  const nextQuestion = useCallback(() => {
    const newQuestionNumber = questionNumber + 1;
    
    if (newQuestionNumber > TOTAL_QUESTIONS) {
      // Victory!
      stopTimer();
      audioSystem.playCorrect();
      setTimeout(() => audioSystem.playStreak(), 300);
      setShowConfetti(true);
      setTimeout(() => {
        onGameOver({
          score: scoreRef.current,
          correctAnswers: correctAnswersRef.current,
          totalQuestions: TOTAL_QUESTIONS,
          bestStreak: bestStreakRef.current,
          isVictory: true
        });
      }, 2000);
      return;
    }

    setMaxTime(maxTimeForGrade);
    setTimeRemaining(maxTimeForGrade);

    // Generate question based on selected grade
    const question = generateQuestionForGrade(grade);
    setCurrentQuestion(question);
    setQuestionNumber(newQuestionNumber);
    setBalloonKey((prev) => prev + 1);
    setBalloonsDisabled(false);
    setForceFlyAway(false);
    setAttempts(0);
    setWrongBalloons([]);

    // Start timer
    startTimer();
  }, [grade, questionNumber, score, correctAnswers, bestStreak, maxTimeForGrade, stopTimer, startTimer, onGameOver]);

  // Handle correct answer
  const handleCorrectAnswer = useCallback((clickX, clickY) => {
    stopTimer();
    setBalloonsDisabled(true);

    // Play sounds
    audioSystem.playPop();
    audioSystem.playCorrect();

    // Update stats
    const newStreak = streak + 1;
    const totalScore = newStreak % 5 === 0 ? 3 : 1;

    // Create particles at click location
    if (clickX && clickY) {
      const newParticle = { id: Date.now(), x: clickX, y: clickY };
      setParticles((prev) => [...prev, newParticle]);
    }

    // Show confetti for correct answers
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 1500);

    // Update stats
    setStreak(newStreak);
    setBestStreak((prev) => Math.max(prev, newStreak));
    setCorrectAnswers((prev) => prev + 1);
    setScore((prev) => prev + totalScore);

    // Show encouraging feedback
    const message = CORRECT_MESSAGES[Math.floor(Math.random() * CORRECT_MESSAGES.length)];
    setFeedback({ show: true, isCorrect: true, text: message, type: 'celebration' });

    // Show streak if applicable
    if (newStreak >= 3) {
      setShowStreak(true);
      setComboText({ id: Date.now(), streak: newStreak });
      audioSystem.playStreak();
    }

    // Next question after delay
    setTimeout(() => nextQuestion(), 1200);
  }, [stopTimer, streak, nextQuestion]);

  // Handle first wrong attempt - soft shake, "Try again!"
  const handleFirstWrongAttempt = useCallback((answer) => {
    setAttempts(1);
    setWrongBalloons((prev) => [...prev, answer]);

    // Soft sound (not harsh)
    audioSystem.playTick();

    // Show encouraging "try again" message
    const message = FIRST_WRONG_MESSAGES[Math.floor(Math.random() * FIRST_WRONG_MESSAGES.length)];
    setFeedback({ show: true, isCorrect: false, text: message, type: 'tryAgain' });

  }, []);

  // Handle second wrong attempt - move on gracefully
  const handleSecondWrongAttempt = useCallback(() => {
    stopTimer();
    setBalloonsDisabled(true);

    // Reset streak (but no harsh sound)
    setStreak(0);
    setShowStreak(false);

    // Show kind "let's move on" message
    const message = SECOND_WRONG_MESSAGES[Math.floor(Math.random() * SECOND_WRONG_MESSAGES.length)];
    setFeedback({ show: true, isCorrect: false, text: message, type: 'moveOn' });

    // Next question after delay
    setTimeout(() => nextQuestion(), 1500);
  }, [stopTimer, nextQuestion]);

  // Handle missed question (timeout)
  const handleMissedQuestion = useCallback(() => {
    stopTimer();
    setBalloonsDisabled(true);
    setForceFlyAway(true);
    setStreak(0);
    setShowStreak(false);

    const message = "Time's up! Let's try the next one!";
    setFeedback({ show: true, isCorrect: false, text: message, type: 'moveOn' });

    setTimeout(() => nextQuestion(), 1500);
  }, [stopTimer, nextQuestion]);

  // Handle balloon pop
  const handleBalloonPop = useCallback((isCorrect, answer, event) => {
    if (isCorrect) {
      const x = event?.clientX || window.innerWidth / 2;
      const y = event?.clientY || window.innerHeight / 2;
      handleCorrectAnswer(x, y);
    } else {
      // Check if this is first or second wrong attempt
      if (attempts === 0) {
        handleFirstWrongAttempt(answer);
      } else {
        handleSecondWrongAttempt();
      }
    }
  }, [handleCorrectAnswer, handleFirstWrongAttempt, handleSecondWrongAttempt, attempts]);

  // Toggle sound
  const toggleSound = () => {
    const newEnabled = !soundEnabled;
    setSoundEnabled(newEnabled);
    audioSystem.setEnabled(newEnabled);
  };

  // Remove particle
  const removeParticle = useCallback((id) => {
    setParticles((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // Hide feedback
  const hideFeedback = useCallback(() => {
    setFeedback((prev) => ({ ...prev, show: false }));
  }, []);

  // Initialize game
  useEffect(() => {
    audioSystem.init();
    // New play session: clear question history to prevent repeats in this round.
    resetQuestionSession();
    nextQuestion();
    
    return () => {
      stopTimer();
    };
  }, []);

  // Monitor for balloons escaping (correct balloon floats away) - skip when paused
  useEffect(() => {
    if (!currentQuestion || balloonsDisabled || isPaused) return;

    const checkInterval = setInterval(() => {
      const balloonArea = document.querySelector('.balloon-area');
      const balloons = document.querySelectorAll('.balloon:not(.popping):not(.wrong)');
      
      if (balloonArea && balloons.length > 0) {
        const areaRect = balloonArea.getBoundingClientRect();
        
        for (const balloon of balloons) {
          if (balloon.dataset.correct === 'true') {
            const rect = balloon.getBoundingClientRect();
            if (rect.bottom < areaRect.top) {
              handleMissedQuestion();
              break;
            }
          }
        }
      }
    }, 100);

    return () => clearInterval(checkInterval);
  }, [currentQuestion, balloonsDisabled, isPaused, handleMissedQuestion]);

  // Back button: pause and show "Leave Game?" confirmation
  const handleBackClick = useCallback(() => {
    stopTimer();
    setIsPaused(true);
    setShowLeaveConfirm(true);
  }, [stopTimer]);

  const handleLeaveConfirmYes = useCallback(() => {
    setShowLeaveConfirm(false);
    setIsPaused(false);
    onBackToGrades();
  }, [onBackToGrades]);

  const handleLeaveConfirmCancel = useCallback(() => {
    setShowLeaveConfirm(false);
    setIsPaused(false);
    startTimer();
  }, [startTimer]);

  // Pause button: freeze game and show pause menu
  const handlePauseClick = useCallback(() => {
    stopTimer();
    setIsPaused(true);
  }, [stopTimer]);

  const handleResume = useCallback(() => {
    setIsPaused(false);
    startTimer();
  }, [startTimer]);

  const handleRestartRound = useCallback(() => {
    setScore(0);
    setCorrectAnswers(0);
    setStreak(0);
    setBestStreak(0);
    setTimeRemaining(maxTimeForGrade);
    setMaxTime(maxTimeForGrade);
    setQuestionNumber(1);
    // New round = new session for question uniqueness.
    resetQuestionSession();
    setCurrentQuestion(generateQuestionForGrade(grade));
    setBalloonKey((k) => k + 1);
    setBalloonsDisabled(false);
    setForceFlyAway(false);
    setAttempts(0);
    setWrongBalloons([]);
    setIsPaused(false);
    startTimer();
  }, [grade, maxTimeForGrade, startTimer]);

  const handlePauseBackToGrades = useCallback(() => {
    setIsPaused(false);
    onBackToGrades();
  }, [onBackToGrades]);

  const handleEndGame = useCallback(() => {
    stopTimer();
    onGameOver({
      score,
      correctAnswers,
      totalQuestions: questionNumber - 1,
      bestStreak,
      isVictory: false
    });
  }, [stopTimer, score, correctAnswers, questionNumber, bestStreak, onGameOver]);

  return (
    <div className="screen game-screen">
      {/* Back button - top left */}
      <button type="button" className="back-btn game-back-btn" onClick={handleBackClick} aria-label="Back">
        ← Back
      </button>

      {/* Side Margins */}
      <div className="side-margin left"></div>
      <div className="side-margin right"></div>

      {/* Main Game Panel */}
      <div className="game-panel">
        {/* Top Section */}
        <div className="top-section">
          <p className="prompt">Pop the correct answer!</p>
        </div>

        {/* Pause button - top right */}
        <button type="button" className="pause-btn" onClick={handlePauseClick} aria-label="Pause">
          ⏸
        </button>

        {/* Left Stats - Score */}
        <div className="left-stats">
          <div className={`score-display ${score > 0 ? 'score-pop' : ''}`}>
            <span className="coin">🪙</span>
            <span>{score}</span>
          </div>
        </div>

        {/* Right Stats */}
        <div className="right-stats">
          <div className="timer-container">
            <Timer timeRemaining={timeRemaining} maxTime={maxTime} />
          </div>
          {showStreak && streak >= 3 && (
            <div className="streak-display visible">
              🔥 {streak} Streak!
            </div>
          )}
        </div>

        {/* Question Number */}
        <div className="question-number">
          {questionNumber} / {TOTAL_QUESTIONS}
        </div>

        {/* Question Board */}
        <QuestionBoard question={currentQuestion?.question || 'Loading...'} />

        {/* Balloon Area */}
        <div className="balloon-area">
          {currentQuestion && (
            currentQuestion.answers.map((answer, index) => (
              <Balloon
                key={`${balloonKey}-${answer}`}
                answer={answer}
                isCorrect={answer === currentQuestion.correctAnswer}
                index={index}
                totalBalloons={currentQuestion.answers.length}
                duration={getBalloonDuration()}
                startDelay={getBalloonStartDelay(index, currentQuestion.answers.length)}
                onPop={(isCorrect, ans, e) => handleBalloonPop(isCorrect, ans, e)}
                disabled={balloonsDisabled || isPaused || wrongBalloons.includes(answer)}
                greyedOut={wrongBalloons.includes(answer)}
                paused={isPaused}
                forceFlyAway={forceFlyAway && !isPaused}
              />
            ))
          )}
        </div>

        {/* Sound Toggle */}
        <button className="sound-toggle" onClick={toggleSound}>
          {soundEnabled ? '🔊' : '🔇'}
        </button>

        {/* End Game button - appears after 10 questions are done */}
        {questionNumber > 10 && (
          <button
            type="button"
            className="end-game-btn"
            onClick={handleEndGame}
            disabled={balloonsDisabled}
            aria-label="End Game"
          >
            End Game
          </button>
        )}

        {/* Combo Text */}
        {comboText && (
          <div
            key={comboText.id}
            className="combo-text"
            onAnimationEnd={() => setComboText(null)}
          >
            {comboText.streak}x STREAK!
          </div>
        )}
      </div>

      {/* Leave Game? confirmation modal */}
      {showLeaveConfirm && (
        <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="leave-title">
          <div className="modal-card leave-modal">
            <h2 id="leave-title" className="modal-title">Leave Game?</h2>
            <p className="modal-text">Your progress in this round will be lost.</p>
            <div className="modal-actions">
              <button type="button" className="primary-btn" onClick={handleLeaveConfirmYes}>
                Yes, Leave
              </button>
              <button type="button" className="secondary-btn" onClick={handleLeaveConfirmCancel}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pause menu overlay */}
      {isPaused && !showLeaveConfirm && (
        <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="pause-title">
          <div className="modal-card pause-modal">
            <h2 id="pause-title" className="modal-title">Game Paused</h2>
            <div className="modal-actions pause-actions">
              <button type="button" className="primary-btn" onClick={handleResume}>
                ▶ Resume Game
              </button>
              <button type="button" className="primary-btn" onClick={handleRestartRound}>
                🔄 Restart Round
              </button>
              <button type="button" className="secondary-btn" onClick={handlePauseBackToGrades}>
                🔙 Back to Grades
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Overlay */}
      <Feedback
        show={feedback.show}
        isCorrect={feedback.isCorrect}
        text={feedback.text}
        type={feedback.type}
        onHide={hideFeedback}
      />

      {/* Confetti */}
      {showConfetti && <Confetti />}

      {/* Particles */}
      {particles.map((p) => (
        <Particles
          key={p.id}
          x={p.x}
          y={p.y}
          onComplete={() => removeParticle(p.id)}
        />
      ))}

    </div>
  );
};

export default GameScreen;
