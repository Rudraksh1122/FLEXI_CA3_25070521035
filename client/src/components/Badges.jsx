const LABELS = { low: 'Low', medium: 'Medium', high: 'High' };

export const PriorityBadge = ({ priority }) => (
  <span className={`badge badge-${priority}`}>{LABELS[priority]} priority</span>
);
