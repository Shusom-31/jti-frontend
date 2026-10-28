import { Link } from 'react-router-dom';
export function NotFoundScreen() { return <div className="empty-state"><span className="eyebrow">404</span><h1>This page could not be found</h1><p>Return to the workforce overview to continue.</p><Link className="button" to="/">Back to dashboard</Link></div>; }
