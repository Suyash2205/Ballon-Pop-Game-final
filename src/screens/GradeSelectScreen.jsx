import './GradeSelectScreen.css';

const GRADES = [3, 4, 5, 6, 7];

const GradeSelectScreen = ({ onGradeSelected, onBack }) => {
  return (
    <div className="screen grade-select-screen">
      <button type="button" className="back-btn" onClick={onBack} aria-label="Back">
        ← Back
      </button>
      <div className="grade-select-content">
        <h1 className="grade-title">Choose Your Grade</h1>
        <p className="grade-subtitle">We'll adjust the question difficulty for you!</p>
        <div className="grade-buttons">
          {GRADES.map((grade) => (
            <button
              key={grade}
              className="primary-btn grade-btn"
              onClick={() => onGradeSelected(grade)}
            >
              Grade {grade}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GradeSelectScreen;
