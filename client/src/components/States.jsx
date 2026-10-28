import Icon from './Icon.jsx';

export const Spinner = ({ label = 'Loading' }) => (
  <div className="state" role="status">
    <div className="spinner" />
    <p>{label}…</p>
  </div>
);

export const ErrorState = ({ message, onRetry }) => (
  <div className="state state-error" role="alert">
    <Icon name="alert" size={28} />
    <p>{message}</p>
    {onRetry && <button className="btn btn-secondary" onClick={onRetry}>Try again</button>}
  </div>
);

export const EmptyState = ({ icon = 'tasks', title, text, action }) => (
  <div className="state">
    <div className="empty-icon"><Icon name={icon} size={28} /></div>
    <h3>{title}</h3>
    <p>{text}</p>
    {action}
  </div>
);
