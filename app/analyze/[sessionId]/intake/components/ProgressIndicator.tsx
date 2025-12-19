'use client';

interface ProgressIndicatorProps {
  currentStep: 1 | 2 | 3;
}

export default function ProgressIndicator({ currentStep }: ProgressIndicatorProps) {
  const steps = [
    { number: 1, label: 'Core Concept' },
    { number: 2, label: 'Business Context' },
    { number: 3, label: 'Strategic Inputs' },
  ];

  const progress = (currentStep / 3) * 100;

  return (
    <div className="mb-8">
      {/* Step Count */}
      <div className="text-sm text-text-secondary mb-2">
        Step {currentStep} of 3
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-border-light rounded-full h-2 mb-4">
        <div
          className="bg-brand-primary h-2 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step Indicators */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div
            key={step.number}
            className="flex items-center"
          >
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  step.number === currentStep
                    ? 'bg-brand-primary text-white'
                    : step.number < currentStep
                    ? 'bg-brand-light text-brand-primary'
                    : 'bg-border-light text-text-tertiary'
                }`}
              >
                {step.number < currentStep ? '✓' : step.number}
              </div>
              <span
                className={`mt-2 text-xs text-center max-w-[120px] ${
                  step.number === currentStep
                    ? 'text-text-primary font-medium'
                    : 'text-text-tertiary'
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`h-0.5 w-16 mx-2 ${
                  step.number < currentStep
                    ? 'bg-brand-primary'
                    : 'bg-border-light'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
