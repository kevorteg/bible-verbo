import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex h-screen items-center justify-center bg-[#0a192f] text-neutral-100">
            <div className="text-center">
              <h1 className="mb-2 text-2xl font-bold">Algo salió mal</h1>
              <p className="text-neutral-400">
                {this.state.error?.message || 'Error inesperado'}
              </p>
              <button
                className="mt-4 rounded bg-orange-500 px-4 py-2 text-white hover:bg-orange-600"
                onClick={() => window.location.reload()}
              >
                Recargar
              </button>
            </div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
