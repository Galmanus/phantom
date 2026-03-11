'use client';

import type { ShieldStep } from '@phantom-btc/sdk';

interface ProofProgressProps {
  currentStep: ShieldStep | null;
  stepMessage: string;
}

export function ProofProgress({ currentStep, stepMessage }: ProofProgressProps) {
  const steps: Array<{ step: ShieldStep; label: string; duration: string }> = [
    { step: 'generating_randomness', label: 'Generating cryptographic randomness', duration: '0.1s' },
    { step: 'computing_commitment', label: 'Computing commitment', duration: '0.2s' },
    { step: 'generating_proof', label: 'Generating zero-knowledge proof', duration: '1.5s' },
    { step: 'submitting_transaction', label: 'Submitting transaction to Starknet', duration: '~30s' },
  ];

  const currentIndex = currentStep ? steps.findIndex(s => s.step === currentStep) : -1;

  return (
    <div className="space-y-4">
      {steps.map((step, index) => {
        const isComplete = index < currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <div
            key={step.step}
            className={`flex items-center gap-3 transition-opacity ${
              isCurrent ? 'opacity-100' : 'opacity-50'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center text-xs transition-colors ${
                isComplete
                  ? 'bg-success text-white'
                  : isCurrent
                  ? 'bg-primary text-white animate-pulse'
                  : 'bg-border text-textMuted'
              }`}
            >
              {isComplete ? '✓' : isCurrent ? '⟳' : ''}
            </div>
            <span className="flex-1 text-body">{step.label}</span>
            <span className="text-label text-textMuted font-mono">{step.duration}</span>
          </div>
        );
      })}

      {currentStep && (
        <div className="mt-6 p-4 bg-background rounded-lg">
          <p className="text-sm text-textMuted">{stepMessage}</p>
          {currentStep === 'generating_proof' && (
            <div className="mt-3 h-1 bg-border rounded-full overflow-hidden">
              <div className="h-full bg-primary animate-shimmer" style={{ width: '50%' }} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
