import { useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { useWizard } from '../../context/WizardContext'
import { analyzeResume } from '../../api/services'
import type { AnalyzeRequest } from '../../types'

const MAX_CHARS = 8000

export function Step3ResumeInput() {
  const { request, setStep, setResult, setLoading, loading, setError, error } = useWizard()
  const [resume, setResume] = useState(request.resumeContent || '')

  const handleAnalyze = async () => {
    if (resume.trim().length < 50) return

    setLoading(true)
    setError(null)

    try {
      const payload: AnalyzeRequest = {
        jobDescription: request.jobDescription!,
        resumeContent: resume,
        atsPlatform: request.atsPlatform!,
        jobTitle: request.jobTitle,
        company: request.company,
        saveToHistory: request.saveToHistory ?? true,
      }
      const result = await analyzeResume(payload)
      setResult(result)
    } catch (e: any) {
      setError(e.message || 'Analysis failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Paste your resume</h2>
      <p className="text-sm text-gray-500 mb-2">
        Paste your <strong>LaTeX source</strong> from Overleaf for the most accurate suggestions.
        The AI will generate copy-paste-ready LaTeX edits tailored to your template.
      </p>

      <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 mb-4">
        <p className="text-xs text-blue-700 leading-relaxed">
          <strong>Tip:</strong> Paste your LaTeX source from Overleaf. You can paste the full file — the preamble (<code className="bg-blue-100 px-1 rounded">\usepackage</code>, <code className="bg-blue-100 px-1 rounded">\newcommand</code> lines) is stripped automatically before analysis.
          Or paste just from <code className="bg-blue-100 px-1 rounded">\begin&#123;document&#125;</code> onwards to save space. Plain text from the PDF preview also works but LaTeX source gives more precise edit suggestions.
        </p>
      </div>

      <div className="mb-2">
        <textarea
          value={resume}
          onChange={e => setResume(e.target.value.slice(0, MAX_CHARS))}
          rows={14}
          placeholder={`% Paste your LaTeX resume source here\n\\documentclass{...}\n\\begin{document}\n...`}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-y font-mono leading-relaxed"
        />
        <p className={`text-xs mt-1 ${resume.length > MAX_CHARS * 0.9 ? 'text-orange-500' : 'text-gray-400'}`}>
          {resume.length.toLocaleString()} / {MAX_CHARS.toLocaleString()} characters
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
          <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={() => setStep(2)}
          disabled={loading}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:border-gray-400 transition-colors disabled:opacity-40"
        >
          ← Back
        </button>
        <button
          onClick={handleAnalyze}
          disabled={resume.trim().length < 50 || loading}
          className="flex items-center gap-2 px-5 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Analyzing... (may take 20-30s)
            </>
          ) : (
            'Analyze resume →'
          )}
        </button>
      </div>
    </div>
  )
}
