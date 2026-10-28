// Date helpers. Due dates are stored as "end of the chosen local day" so a task
// due today is not shown as overdue until the day is over.
const pad = (n) => String(n).padStart(2, '0');

export const toInputDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const fromInputDate = (value) => {
  if (!value) return null;
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d, 23, 59, 59).toISOString();
};

export const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '';

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const isOverdue = (task) => task.status === 'pending' && !!task.dueDate && new Date(task.dueDate) < new Date();

export function dueLabel(task) {
  if (!task.dueDate) return 'No due date';
  if (task.status === 'completed') return `Completed (was due ${formatDate(task.dueDate)})`;
  const diff = Math.round((startOfDay(new Date(task.dueDate)) - startOfDay(new Date())) / 86400000);
  if (diff < 0) return `Overdue by ${-diff} day${diff === -1 ? '' : 's'}`;
  if (diff === 0) return 'Due today';
  if (diff === 1) return 'Due tomorrow';
  return `Due in ${diff} days (${formatDate(task.dueDate)})`;
}

export const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
};
