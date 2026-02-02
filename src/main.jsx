import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import './index.css'

// Global error handler for uncaught errors
window.onerror = (message, source, lineno, colno, error) => {
  console.error('🔴 Uncaught error:', { message, source, lineno, colno, error });
};

// Global handler for unhandled promise rejections
window.onunhandledrejection = (event) => {
  console.error('🔴 Unhandled promise rejection:', event.reason);
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary showDetails={import.meta.env.DEV}>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
