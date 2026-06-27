import { WizardProvider, useWizard } from '../context/WizardContext'
import { Step1AtsSelector } from '../components/wizard/Step1AtsSelector'
import { Step2JobDescription } from '../components/wizard/Step2JobDescription'
import { Step3ResumeInput } from '../components/wizard/Step3ResumeInput'
import { ResultsDashboard } from '../components/results/ResultsDashboard'

const STEPS = [
  { n: 1, label: 'ATS platform' },
  { n: 2, label: 'Job description' },
  { n: 3, label: 'Resume' },
  { n: 4, label: 'Results' },
]

function StepProgress({ current }: { current: number }) {
  return (
    <div className="mb-8">
      <div className="flex items-center">
        {STEPS.map((s, i) => (
          <div key={s.n} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                current > s.n
                  ? 'bg-gray-900 text-white'
                  : current === s.n
                  ? 'bg-gray-900 text-white ring-4 ring-gray-200'
                  : 'bg-gray-100 text-gray-400'
              }`}>
                {current > s.n ? '✓' : s.n}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${
                current === s.n ? 'text-gray-900' : current > s.n ? 'text-gray-500' : 'text-gray-300'
              }`}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px mx-3 transition-colors ${
                current > s.n ? 'bg-gray-900' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function WizardContent() {
  const { step, result, reset } = useWizard()

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Resume analyzer</h1>
        <p className="text-sm text-gray-500 mt-1">
          Score your resume against any job description and get ATS-optimized LaTeX edits.
        </p>
      </div>

      <StepProgress current={step} />

      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8">
        {step === 1 && <Step1AtsSelector />}
        {step === 2 && <Step2JobDescription />}
        {step === 3 && <Step3ResumeInput />}
        {step === 4 && result && <ResultsDashboard result={result} onReset={reset} />}
      </div>
    </div>
  )
}

export function AnalyzePage() {
  return (
    <WizardProvider>
      <WizardContent />
    </WizardProvider>
  )
}
