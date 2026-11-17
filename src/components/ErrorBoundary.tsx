import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorMessage: error.message || 'An unexpected error occurred.' };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('Application ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F8F8F6] text-[#141619] flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white border border-[#E4E4DF] rounded-xl p-8">
            <p className="text-xs font-medium text-[#525760] mb-2">Application Notice</p>
            <h1 className="text-2xl font-semibold tracking-tight mb-3">
              Something interrupted this session
            </h1>
            <p className="text-sm text-[#525760] leading-relaxed mb-6">
              {this.state.errorMessage.startsWith('{')
                ? 'A database permission or connectivity rule prevented this action. Please sign in or refresh to try again.'
                : this.state.errorMessage}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2.5 text-sm font-medium bg-[#1B4332] text-white rounded-lg hover:bg-[#143326] transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
