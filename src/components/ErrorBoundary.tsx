import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallbackTitle?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    }

    public handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-[60vh] flex items-center justify-center p-6">
                    <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl border border-slate-100 dark:border-slate-800 text-center space-y-6">
                        <div className="size-16 bg-amber-50 dark:bg-amber-950/50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                            <AlertTriangle className="size-8" />
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                {this.props.fallbackTitle || 'Something went wrong'}
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                An unexpected issue occurred while rendering this view. Our system has safely prevented a full application crash.
                            </p>
                        </div>

                        {this.state.error?.message && (
                            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-left font-mono text-xs text-rose-500 overflow-x-auto max-h-24">
                                {this.state.error.message}
                            </div>
                        )}

                        <div className="flex items-center gap-3 pt-2">
                            <button
                                onClick={this.handleReset}
                                className="flex-1 py-3 px-4 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                            >
                                <RefreshCw className="size-4" />
                                Reload View
                            </button>
                            <a
                                href="/"
                                className="py-3 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <Home className="size-4" />
                                Home
                            </a>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
