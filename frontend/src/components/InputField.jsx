import '../styles/globals.css';

const InputField = ({ label, type = 'text', name, value, onChange, error, disabled }) => (
  <div className="form-group">
    <label htmlFor={name}>{label}</label>
    <input
      type={type}
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      className={error ? 'border-danger' : ''}
      disabled={disabled}
      autoComplete="off"
    />
    {error && <div className="form-error">{error}</div>}
  </div>
);

export default InputField;
