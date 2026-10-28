import { Component, type ErrorInfo, type ReactNode } from 'react';
export class ErrorScreen extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(_error: Error, _info: ErrorInfo) { /* Avoid logging workforce data or identifiers. */ }
  render() { return this.state.failed ? <main className="empty-state"><h1>Something went wrong</h1><p>Reload the workspace to try again.</p><button className="button" onClick={() => window.location.reload()}>Reload workspace</button></main> : this.props.children; }
}
