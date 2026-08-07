/**
 * CreatePortfolioModal — reusable modal for POST /api/v1/portfolios/.
 *
 * Props:
 *   open        — controls visibility
 *   onClose     — called when user cancels or presses Escape / clicks backdrop
 *   onCreated   — called with the new PortfolioResponse on success
 */

import { useEffect, useRef, useState } from 'react';
import { X, Briefcase, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import * as portfolioService from '../../services/portfolioService';
import { ApiError } from '../../types/api';
import type { PortfolioResponse } from '../../types/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface CreatePortfolioModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (portfolio: PortfolioResponse) => void;
}

interface FormState {
  portfolio_name: string;
  initial_balance: string;
  currency: string;
  description: string;
  investment_goal: string;
  risk_level: string;
  is_default: boolean;
}

const EMPTY_FORM: FormState = {
  portfolio_name: '',
  initial_balance: '10000',
  currency: 'USD',
  description: '',
  investment_goal: '',
  risk_level: '',
  is_default: false,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function CreatePortfolioModal({
  open,
  onClose,
  onCreated,
}: CreatePortfolioModalProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  // Reset form whenever modal opens
  useEffect(() => {
    if (open) {
      setForm(EMPTY_FORM);
      setErrors({});
      setApiError(null);
      setSubmitting(false);
      // Focus the name field after the animation frame
      requestAnimationFrame(() => nameRef.current?.focus());
    }
  }, [open]);

  // Escape key closes
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  // ---- field helpers ----
  const set = (field: keyof FormState, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const clearError = (field: keyof FormState) =>
    setErrors((prev) => ({ ...prev, [field]: undefined }));

  // ---- validation ----
  function validate(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {};

    if (!form.portfolio_name.trim()) {
      next.portfolio_name = 'Portfolio name is required.';
    } else if (form.portfolio_name.trim().length > 100) {
      next.portfolio_name = 'Name must be 100 characters or fewer.';
    }

    const balance = parseFloat(form.initial_balance);
    if (form.initial_balance === '' || isNaN(balance)) {
      next.initial_balance = 'Initial balance is required.';
    } else if (balance < 0) {
      next.initial_balance = 'Balance cannot be negative.';
    }

    if (form.description.length > 500) {
      next.description = 'Description must be 500 characters or fewer.';
    }

    if (form.investment_goal.length > 255) {
      next.investment_goal = 'Investment goal must be 255 characters or fewer.';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  // ---- submit ----
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const created = await portfolioService.createPortfolio({
        portfolio_name: form.portfolio_name.trim(),
        initial_balance: parseFloat(form.initial_balance),
        currency: form.currency,
        description: form.description.trim() || undefined,
        investment_goal: form.investment_goal.trim() || undefined,
        risk_level: (form.risk_level as 'low' | 'medium' | 'high' | 'very_high') || undefined,
        is_default: form.is_default,
      });
      onCreated(created);
      onClose();
    } catch (err) {
      setApiError(
        err instanceof ApiError ? err.message : 'Failed to create portfolio. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ---- shared input class ----
  const inputCls = (field: keyof FormState) =>
    cn(
      'w-full bg-black/40 border rounded-lg px-3 py-2.5 text-sm text-gray-200',
      'placeholder-gray-600 focus:outline-none focus:ring-2 transition-colors',
      errors[field]
        ? 'border-red-500/60 focus:ring-red-500/30'
        : 'border-border/50 focus:ring-blue-500/40',
    );

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Panel */}
      <div className="relative w-full max-w-lg bg-[#0f0f11] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-100">Create Portfolio</h2>
              <p className="text-xs text-gray-500 mt-0.5">Set up a new investment portfolio</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">

            {/* API error banner */}
            {apiError && (
              <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                {apiError}
              </div>
            )}

            {/* Row 1: Name */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                Portfolio Name <span className="text-red-400">*</span>
              </label>
              <input
                ref={nameRef}
                type="text"
                required
                maxLength={100}
                placeholder="e.g. Long-Term Growth"
                value={form.portfolio_name}
                onChange={(e) => {
                  set('portfolio_name', e.target.value);
                  clearError('portfolio_name');
                }}
                className={inputCls('portfolio_name')}
              />
              {errors.portfolio_name && (
                <p className="mt-1 text-xs text-red-400">{errors.portfolio_name}</p>
              )}
            </div>

            {/* Row 2: Balance + Currency */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                  Initial Balance ($) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="any"
                  placeholder="10000"
                  value={form.initial_balance}
                  onChange={(e) => {
                    set('initial_balance', e.target.value);
                    clearError('initial_balance');
                  }}
                  className={inputCls('initial_balance')}
                />
                {errors.initial_balance && (
                  <p className="mt-1 text-xs text-red-400">{errors.initial_balance}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                  Currency
                </label>
                <select
                  value={form.currency}
                  onChange={(e) => set('currency', e.target.value)}
                  className={inputCls('currency')}
                >
                  {['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD'].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 3: Risk level + Investment Goal */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                  Risk Level
                </label>
                <select
                  value={form.risk_level}
                  onChange={(e) => set('risk_level', e.target.value)}
                  className={inputCls('risk_level')}
                >
                  <option value="">Select…</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="very_high">Very High</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                  Investment Goal
                </label>
                <input
                  type="text"
                  maxLength={255}
                  placeholder="e.g. Retirement"
                  value={form.investment_goal}
                  onChange={(e) => {
                    set('investment_goal', e.target.value);
                    clearError('investment_goal');
                  }}
                  className={inputCls('investment_goal')}
                />
                {errors.investment_goal && (
                  <p className="mt-1 text-xs text-red-400">{errors.investment_goal}</p>
                )}
              </div>
            </div>

            {/* Row 4: Description */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                Description
              </label>
              <textarea
                maxLength={500}
                rows={2}
                placeholder="Optional notes about this portfolio…"
                value={form.description}
                onChange={(e) => {
                  set('description', e.target.value);
                  clearError('description');
                }}
                className={cn(inputCls('description'), 'resize-none')}
              />
              {errors.description && (
                <p className="mt-1 text-xs text-red-400">{errors.description}</p>
              )}
              <p className="mt-1 text-right text-xs text-gray-600">
                {form.description.length}/500
              </p>
            </div>

            {/* Row 5: Set as default */}
            <label className="flex items-center gap-3 cursor-pointer group">
              <div
                className={cn(
                  'w-4 h-4 rounded border flex items-center justify-center transition-colors',
                  form.is_default
                    ? 'bg-blue-600 border-blue-600'
                    : 'border-border/50 bg-black/20 group-hover:border-blue-500/50',
                )}
                onClick={() => set('is_default', !form.is_default)}
              >
                {form.is_default && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10">
                    <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <input
                type="checkbox"
                checked={form.is_default}
                onChange={(e) => set('is_default', e.target.checked)}
                className="sr-only"
              />
              <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                Set as default portfolio
              </span>
            </label>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/8 bg-black/20">
            {/* Balance preview */}
            {form.initial_balance && !isNaN(parseFloat(form.initial_balance)) && (
              <p className="text-xs text-gray-500">
                Starting cash:{' '}
                <span className="text-gray-300 font-medium">
                  {parseFloat(form.initial_balance).toLocaleString('en-US', {
                    style: 'currency',
                    currency: form.currency,
                    minimumFractionDigits: 2,
                  })}
                </span>
              </p>
            )}
            <div className="flex items-center gap-3 ml-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-gray-200 bg-white/5 hover:bg-white/10 rounded-lg border border-border/30 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(37,99,235,0.3)]"
              >
                {submitting ? (
                  <>
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Creating…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Create Portfolio
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
