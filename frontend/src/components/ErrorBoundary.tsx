'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { reportError } from '../lib/errorReporting';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Optional custom fallback; a friendly default is used when omitted. */
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Component-level crash handler. Catches render errors in its subtree, reports
 * them through the error logger (Pillar 4), and shows a recovery UI instead of
 * a white screen. `reset()` re-mounts the children via a state flip.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    reportError(error, { componentStack: info.componentStack });
  }

  private handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center bg-slate-50 px-4 text-center">
          <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-slate-900">Something went wrong</h2>
          <p className="text-slate-500 mt-2 max-w-md">
            We hit an unexpected error in this section. Please try again.
          </p>
          <button
            onClick={this.handleReset}
            className="mt-6 inline-flex items-center px-5 py-2.5 rounded-full text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 transition"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}