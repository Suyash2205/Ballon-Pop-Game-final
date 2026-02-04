import './QuestionBoard.css';

const QuestionBoard = ({ question }) => {
  return (
    <div className="question-board">
      <div className="board-inner">
        <p className="question-text">{question}</p>
      </div>
    </div>
  );
};

export default QuestionBoard;
