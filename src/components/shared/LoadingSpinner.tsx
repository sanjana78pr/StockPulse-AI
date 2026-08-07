/**
 * LoadingSpinner — reusable inline loading state.
 * Matches the dark theme used throughout the app.
 */

interface LoadingSpinnerProps {
  message?: string;
  className?: string;
}

export default function LoadingSpinner({
  message = 'Loading…',
  className = '',
}: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 gap-4 ${className}`}>
      <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      <span className="text-gray-400 text-sm">{message}</span>
    </div>
  );
}
