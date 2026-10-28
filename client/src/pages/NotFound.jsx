import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="auth-page">
      <div className="auth-card center">
        <h1>Page not found</h1>
        <p className="muted">That address does not exist in Studyboard.</p>
        <Link to="/" className="btn btn-primary">Go to the home page</Link>
      </div>
    </div>
  );
}
