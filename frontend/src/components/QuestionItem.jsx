import '../styles/globals.css';

const QuestionItem = ({ question, options, selected, onSelect, disabled }) => (
  <div className="card mb-4">
    <div className="card-header font-semibold mb-2">{question}</div>
    <div className="card-body">
      {options && Object.entries(options).map(([key, value]) => (
        <label key={key} className="flex items-center gap-2 mb-2 cursor-pointer">
          <input
            type="radio"
            name="option"
            value={key}
            checked={selected === key}
            onChange={() => onSelect(key)}
            disabled={disabled}
          />
          <span>{value}</span>
        </label>
      ))}
    </div>
  </div>
);

export default QuestionItem;
