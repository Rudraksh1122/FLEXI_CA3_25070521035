import { Link } from 'react-router-dom';
import Icon, { Logo } from '../components/Icon.jsx';

const FEATURES = [
  { icon: 'tasks', title: 'Tasks with deadlines', text: 'Add assignments, set a priority and a due date, then tick them off as you finish.' },
  { icon: 'notes', title: 'Notes by subject', text: 'Keep lecture notes and revision points in one searchable place.' },
  { icon: 'clock', title: 'Overdue warnings', text: 'See what slipped past its deadline and what is due next, straight from your dashboard.' },
  { icon: 'search', title: 'Search and filter', text: 'Find any task by keyword, status or priority and sort by deadline.' },
  { icon: 'user', title: 'Your own account', text: 'Every task and note belongs to you. Nobody else can open them.' },
  { icon: 'grid', title: 'Works on your phone', text: 'The layout adapts from a laptop sidebar to a compact mobile menu.' },
];

export default function Landing() {
  return (
    <div className="landing">
      <header className="landing-nav">
        <Logo />
        <div className="nav-actions">
          <Link to="/login" className="btn btn-ghost">Log in</Link>
          <Link to="/register" className="btn btn-primary">Register</Link>
        </div>
      </header>

      <section className="hero">
        <h1>Know what is due before it is due.</h1>
        <p>
          Student Productivity Dashboard (Studyboard) keeps your assignments, notes and deadlines
          in one place, so you can plan the week instead of chasing it.
        </p>
        <div className="hero-actions">
          <Link to="/register" className="btn btn-primary btn-lg">Get started</Link>
          <Link to="/login" className="btn btn-secondary btn-lg">Log in</Link>
        </div>
      </section>

      <section className="features" aria-label="Features">
        {FEATURES.map((f) => (
          <article key={f.title} className="feature">
            <div className="feature-icon"><Icon name={f.icon} size={22} /></div>
            <h3>{f.title}</h3>
            <p>{f.text}</p>
          </article>
        ))}
      </section>

      <footer className="landing-foot">Studyboard · Built with React, Express and MongoDB</footer>
    </div>
  );
}
