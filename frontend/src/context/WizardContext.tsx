import React, { createContext, useContext, useState } from 'react'
import type { AnalyzeRequest, AnalyzeResponse } from '../types'

interface WizardState {
  step: 1 | 2 | 3 | 4
  request: Partial<AnalyzeRequest>
  result: AnalyzeResponse | null
  loading: boolean
  error: string | null
}

interface WizardContextValue extends WizardState {
  setStep: (step: WizardState['step']) => void
  updateRequest: (partial: Partial<AnalyzeRequest>) => void
  setResult: (result: AnalyzeResponse) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

const INITIAL_STATE: WizardState = {
  step: 1,
  request: { atsPlatform: 'unknown', saveToHistory: true },
  result: null,
  loading: false,
  error: null,
}

const WizardContext = createContext<WizardContextValue | undefined>(undefined)

export function WizardProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WizardState>(INITIAL_STATE)

  const setStep = (step: WizardState['step']) =>
    setState(s => ({ ...s, step }))

  const updateRequest = (partial: Partial<AnalyzeRequest>) =>
    setState(s => ({ ...s, request: { ...s.request, ...partial } }))

  const setResult = (result: AnalyzeResponse) =>
    setState(s => ({ ...s, result, step: 4 }))

  const setLoading = (loading: boolean) =>
    setState(s => ({ ...s, loading }))

  const setError = (error: string | null) =>
    setState(s => ({ ...s, error }))

  const reset = () => setState(INITIAL_STATE)

  return (
    <WizardContext.Provider value={{ ...state, setStep, updateRequest, setResult, setLoading, setError, reset }}>
      {children}
    </WizardContext.Provider>
  )
}

export function useWizard() {
  const ctx = useContext(WizardContext)
  if (!ctx) throw new Error('useWizard must be used within WizardProvider')
  return ctx
}
