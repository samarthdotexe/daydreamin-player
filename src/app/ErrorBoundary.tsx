import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  onReload?: () => void;
}

interface ErrorBoundaryState { failed: boolean; }

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo): void {
    // A production telemetry adapter can be attached here without exposing details in UI.
  }

  private reload = () => {
    if (this.props.onReload) this.props.onReload();
    else window.location.reload();
  };

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <main className="recovery-screen">
        <p>A music time machine</p>
        <h1>Daydreamin&apos; drifted off course</h1>
        <span>The record stopped unexpectedly. Your account and saved music are safe.</span>
        <button type="button" onClick={this.reload}>Reload experience</button>
      </main>
    );
  }
}
