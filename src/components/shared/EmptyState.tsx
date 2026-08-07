/**
 * EmptyState — reusable empty-list state component.
 */

import { Inbox } from 'lucide-react';
import React from 'react';

interface EmptyStateProps {
  message: string;
  subMessage?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export default function EmptyState({
  message,
  subMessage,
  icon,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-16 gap-3 ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-gray-500">
        {icon ?? <Inbox className="w-6 h-6" />}
      </div>
      <p className="text-gray-300 font-medium">{message}</p>
      {subMessage && (
        <p className="text-gray-500 text-sm text-center max-w-sm">{subMessage}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
