import * as React from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: any;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: any): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const error = this.state.error;
      let errorMessage = "Something went wrong. Please try refreshing the page.";
      if (error && error.message) {
        try {
          const parsed = JSON.parse(error.message);
          if (parsed.error && parsed.operationType) {
            errorMessage = `Firestore Error: ${parsed.operationType} failed. ${parsed.error}`;
          }
        } catch (e) {
          errorMessage = error.message;
        }
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 transition-colors duration-300">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-[40px] p-10 shadow-2xl text-center border border-slate-100 dark:border-slate-800">
            <div className="w-20 h-20 bg-red-50 dark:bg-red-500/10 rounded-3xl flex items-center justify-center text-red-500 mx-auto mb-6">
              <AlertCircle size={40} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Unexpected Error</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
              {errorMessage}
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-brand-primary text-white rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg shadow-orange-500/20"
            >
              Refresh Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
