'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { StructuredIdeaSchema, Step1Schema, Step2Schema, Step3Schema, StructuredIdea } from '@/lib/validation/schemas';
import ProgressIndicator from './ProgressIndicator';
import FormNavigation from './FormNavigation';
import Step1CoreConcept from './Step1CoreConcept';
import Step2Environment from './Step2Environment';
import Step3AssumptionsAssets from './Step3AssumptionsAssets';

interface IntakeWizardProps {
  sessionId: string;
}

export default function IntakeWizard({ sessionId }: IntakeWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<StructuredIdea>({
    resolver: zodResolver(StructuredIdeaSchema),
    mode: 'onChange',
    defaultValues: {
      high_concept: '',
      value_proposition: '',
      success_metric_18m: '',
      assumptions: {
        market: [],
        technical: [],
        business_model: [],
      },
      assets: {
        key_assets: [],
        brand_narrative: [],
      },
      environment: {
        user_persona: '',
        competitive_landscape: '',
        regulatory_context: '',
      },
    },
  });

  const formData = form.watch();

  // Auto-save to localStorage
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem(
        `idea-intake-draft-${sessionId}`,
        JSON.stringify(formData)
      );
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [formData, sessionId]);

  // Restore from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(`idea-intake-draft-${sessionId}`);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        form.reset(parsed);
      } catch (e) {
        console.error('Failed to restore draft:', e);
      }
    }
  }, [sessionId, form]);

  // Validate current step
  const validateStep = async (step: 1 | 2 | 3): Promise<boolean> => {
    let schema;
    let fields: (keyof StructuredIdea)[];

    switch (step) {
      case 1:
        schema = Step1Schema;
        fields = ['high_concept', 'value_proposition', 'success_metric_18m'];
        break;
      case 2:
        schema = Step2Schema;
        fields = ['environment'];
        break;
      case 3:
        schema = Step3Schema;
        fields = ['assumptions', 'assets'];
        break;
    }

    const result = await form.trigger(fields);
    return result;
  };

  const handleNext = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid) {
      setCurrentStep((prev) => Math.min(3, prev + 1) as 1 | 2 | 3);
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1) as 1 | 2 | 3);
  };

  const handleSubmit = async () => {
    // Validate entire form
    const isValid = await form.trigger();
    if (!isValid) {
      return;
    }

    setIsSubmitting(true);

    try {
      const data = form.getValues();

      const res = await fetch(`/api/sessions/${sessionId}/idea`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          structured_idea: data,
          source: 'form',
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to submit');
      }

      // Clear localStorage draft
      localStorage.removeItem(`idea-intake-draft-${sessionId}`);

      // Navigate to choice page
      router.push(`/analyze/${sessionId}/choice`);
    } catch (error) {
      console.error('Submit failed:', error);
      alert((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if current step can proceed
  const canProceed = () => {
    const errors = form.formState.errors;

    switch (currentStep) {
      case 1:
        return (
          !errors.high_concept &&
          !errors.value_proposition &&
          !errors.success_metric_18m &&
          formData.high_concept?.length >= 10 &&
          formData.value_proposition?.length >= 20 &&
          formData.success_metric_18m?.length >= 10
        );
      case 2:
        return (
          !errors.environment?.user_persona &&
          !errors.environment?.competitive_landscape &&
          formData.environment?.user_persona?.length >= 20 &&
          formData.environment?.competitive_landscape?.length >= 20
        );
      case 3:
        // Step 3 is optional, always can proceed
        return true;
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <ProgressIndicator currentStep={currentStep} />

      <div className="bg-bg-primary rounded-lg shadow-card p-8">
        {currentStep === 1 && <Step1CoreConcept form={form} />}
        {currentStep === 2 && <Step2Environment form={form} />}
        {currentStep === 3 && <Step3AssumptionsAssets form={form} />}

        <FormNavigation
          currentStep={currentStep}
          onBack={handleBack}
          onNext={handleNext}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          canProceed={canProceed()}
        />
      </div>

      {/* Auto-save indicator */}
      <div className="mt-4 text-center text-xs text-text-tertiary">
        Your progress is automatically saved
      </div>
    </div>
  );
}
