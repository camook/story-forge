import React from "react";

type ErrorBoundaryProps = {
  children: React.ReactNode;
  fallback?: (error: unknown, reset: () => void) => React.ReactNode;
};

type ErrorBoundaryState = { hasError: boolean; error: unknown };

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo): void {
    console.error("ErrorBoundary caught error", error, info);
  }

  reset = () => this.setState({ hasError: false, error: null });

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback(this.state.error, this.reset);
      return (
        <div role="alert" className="panel">
          <h2>Something went wrong</h2>
          <p className="muted">Please try again.</p>
          <button onClick={this.reset} style={{ marginTop: 12 }}>Retry</button>
        </div>
      );
    }
    return this.props.children;
  }
}

