import { useState } from 'react'
import { ATS_PLATFORMS } from '../../types'
import { useWizard } from '../../context/WizardContext'

export function Step1AtsSelector() {
  const { request, updateRequest, setStep } = useWizard()
  const [selected, setSelected] = useState(request.atsPlatform || 'unknown')
  const [custom, setCustom] = useState('')

  const handleSelect = (id: string) => {
    setSelected(id)
    setCustom('')
    updateRequest({ atsPlatform: id })
  }

  const handleCustom = (val: string) => {
    setCustom(val)
    if (val.trim()) {
      setSelected('')
      updateRequest({ atsPlatform: val.trim() })
    }
  }

  const canProceed = selected || custom.trim().length > 0

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Select ATS platform</h2>
      <p className="text-sm text-gray-500 mb-5">
        Knowing the ATS shapes keyword weighting and parsing rules in the analysis.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-4">
        {ATS_PLATFORMS.map((ats) => (
          <button
            key={ats.id}
            onClick={() => handleSelect(ats.id)}
            className={`text-left px-3 py-2.5 rounded-lg border text-sm transition-all ${
              selected === ats.id && !custom
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
            }`}
          >
            <span className="font-medium block">{ats.name}</span>
            <span className={`text-xs mt-0.5 block ${
              selected === ats.id && !custom ? 'text-gray-300' : 'text-gray-400'
            }`}>
              {ats.tier}
            </span>
          </button>
        ))}
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Or enter a custom ATS name
        </label>
        <input
          type="text"
          value={custom}
          onChange={e => handleCustom(e.target.value)}
          placeholder="e.g. Ashby, Gem, Pinpoint..."
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        />
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => setStep(2)}
          disabled={!canProceed}
          className="px-5 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next: Job description →
        </button>
      </div>
    </div>
  )
}
