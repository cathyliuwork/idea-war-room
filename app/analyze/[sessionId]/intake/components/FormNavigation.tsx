'use client';

import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';

interface FormNavigationProps {
  currentStep: 1 | 2 | 3;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  canProceed: boolean;
}

export default function FormNavigation({
  currentStep,
  onBack,
  onNext,
  onSubmit,
  isSubmitting,
  canProceed,
}: FormNavigationProps) {
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === 3;

  return (
    <div className="flex justify-between items-center mt-8 pt-6 border-t border-border-medium">
      {/* Back Button */}
      <button
        type="button"
        onClick={onBack}
        disabled={isFirstStep || isSubmitting}
        className="flex items-center gap-2 px-6 py-3 border border-border-medium text-text-secondary rounded-lg hover:border-border-dark hover:text-text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back</span>
      </button>

      {/* Next / Submit Button */}
      {isLastStep ? (
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-3 bg-brand-primary text-white font-semibold rounded-lg hover:bg-brand-hover transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Submitting...</span>
            </>
          ) : (
            <>
              <span>Submit & Continue</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          disabled={!canProceed || isSubmitting}
          className="flex items-center gap-2 px-6 py-3 bg-brand-primary text-white font-semibold rounded-lg hover:bg-brand-hover transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>Next</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
