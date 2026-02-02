import { Component } from 'react';
/*
 * ============================================================================
 * GLOBAL ERROR BOUNDARY
 * ============================================================================
 * 
 * Purpose:
 * Catches unhandled JavaScript errors in the React component tree.
 * Prevents the entire app from crashing (White Screen of Death).
 * 
 * Features:
 * - Logs errors to console (and optionally a service).
 * - Displays a friendly "Something went wrong" UI.
 * - Offers "Reload" and "Go Home" recovery options.
 */
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing the app.
 */
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            errorCount: 0
        };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // Log error details to console
        console.error('🔴 ErrorBoundary caught an error:', error);
        console.error('📍 Component stack:', errorInfo.componentStack);

        // Store error info for display
        this.setState(prevState => ({
            errorInfo,
            errorCount: prevState.errorCount + 1
        }));

        // You could also log to an error reporting service here
        // logErrorToService(error, errorInfo);
    }

    handleRetry = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });
    };

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        // Clear state and navigate to root
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            const { error, errorInfo, errorCount } = this.state;
            const { fallback, showDetails = false } = this.props;

            // Custom fallback UI if provided
            if (fallback) {
                return fallback;
            }

            // Default error UI
            return (
                <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
                        {/* Error Icon */}
                        <div className="flex justify-center mb-6">
                            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                                <AlertTriangle className="w-10 h-10 text-red-500" />
                            </div>
                        </div>

                        {/* Error Title */}
                        <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
                            Something went wrong
                        </h1>

                        <p className="text-gray-600 text-center mb-6">
                            We encountered an unexpected error. Don't worry, your data is safe.
                        </p>

                        {/* Error Details (if enabled) */}
                        {showDetails && error && (
                            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <Bug className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm font-medium text-gray-700">Error Details</span>
                                </div>
                                <p className="text-sm text-red-600 font-mono break-all">
                                    {error.toString()}
                                </p>
                                {errorInfo && (
                                    <details className="mt-2">
                                        <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                                            Component Stack
                                        </summary>
                                        <pre className="mt-2 text-xs text-gray-500 overflow-auto max-h-32 p-2 bg-gray-100 rounded">
                                            {errorInfo.componentStack}
                                        </pre>
                                    </details>
                                )}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            <button
                                onClick={this.handleRetry}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors"
                            >
                                <RefreshCw className="w-5 h-5" />
                                Try Again
                            </button>

                            <button
                                onClick={this.handleGoHome}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                            >
                                <Home className="w-5 h-5" />
                                Go to Home
                            </button>

                            {errorCount > 2 && (
                                <button
                                    onClick={this.handleReload}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 text-white rounded-xl font-medium hover:bg-gray-900 transition-colors"
                                >
                                    <RefreshCw className="w-5 h-5" />
                                    Reload App
                                </button>
                            )}
                        </div>

                        {/* Help Text */}
                        <p className="text-xs text-gray-400 text-center mt-6">
                            If this problem persists, please contact support.
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

/**
 * Higher-order component to wrap any component with error boundary
 */
export function withErrorBoundary(WrappedComponent, fallback = null) {
    return function WithErrorBoundaryWrapper(props) {
        return (
            <ErrorBoundary fallback={fallback}>
                <WrappedComponent {...props} />
            </ErrorBoundary>
        );
    };
}

/**
 * Hook-friendly error boundary wrapper
 */
export function SafeComponent({ children, fallback = null, showDetails = false }) {
    return (
        <ErrorBoundary fallback={fallback} showDetails={showDetails}>
            {children}
        </ErrorBoundary>
    );
}

export default ErrorBoundary;
