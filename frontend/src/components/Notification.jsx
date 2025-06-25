import '../styles/globals.css';

const Notification = ({ type = 'info', message }) => {
  if (!message) return null;
  const typeClass = {
    success: 'alert-success',
    danger: 'alert-danger',
    info: 'alert-info',
    warning: 'alert-warning',
    primary: 'alert-primary',
  }[type] || 'alert-info';
  return <div className={`alert ${typeClass} mb-3`}>{message}</div>;
};

export default Notification;
