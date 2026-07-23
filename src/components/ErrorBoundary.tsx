import { Component, type ErrorInfo, type ReactNode } from "react";
import { captureApplicationError } from "../lib/monitoring";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    captureApplicationError(error);
    if (import.meta.env.DEV) {
      console.error("BudgetBuddy encountered a rendering error.", error, errorInfo);
    }
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <main className="error-boundary" role="alert">
        <div>
          <span aria-hidden="true" className="material-symbols-outlined">
            error
          </span>
          <h1>Something went wrong</h1>
          <p>Your saved budget data has not been changed. Reload BudgetBuddy to try again.</p>
          <button type="button" onClick={() => window.location.reload()}>
            Reload app
          </button>
        </div>
      </main>
    );
  }
}
