import { useEffect, useState } from 'react'
import { BookOpen, Save, X, ChevronDown } from 'lucide-react'
import { useWizard } from '../../context/WizardContext'
import { getTemplates, createTemplate, deleteTemplate } from '../../api/services'
import type { JdTemplate } from '../../types'

const MAX_CHARS = 8000

export function Step2JobDescription() {
  const { request, updateRequest, setStep } = useWizard()
  const [jd, setJd] = useState(request.jobDescription || '')
  const [jobTitle, setJobTitle] = useState(request.jobTitle || '')
  const [company, setCompany] = useState(request.company || '')
  const [templates, setTemplates] = useState<JdTemplate[]>([])
  const [showTemplates, setShowTemplates] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [showSave, setShowSave] = useState(false)
  const [saving, setSaving] = useState(false)
  const [templatesLoading, setTemplatesLoading] = useState(false)

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    setTemplatesLoading(true)
    try {
      const data = await getTemplates()
      setTemplates(data)
    } catch {
      // Non-fatal
    } finally {
      setTemplatesLoading(false)
    }
  }

  const handleNext = () => {
    updateRequest({ jobDescription: jd, jobTitle, company })
    setStep(3)
  }

  const handleLoadTemplate = (t: JdTemplate) => {
    setJd(t.content)
    updateRequest({ atsPlatform: t.atsPlatform })
    setShowTemplates(false)
  }

  const handleSaveTemplate = async () => {
    if (!saveName.trim() || !jd.trim()) return
    setSaving(true)
    try {
      const created = await createTemplate({
        name: saveName.trim(),
        content: jd,
        atsPlatform: request.atsPlatform || 'unknown',
      })
      setTemplates(prev => [created, ...prev])
      setSaveName('')
      setShowSave(false)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTemplate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Delete this template?')) return
    try {
      await deleteTemplate(id)
      setTemplates(prev => prev.filter(t => t.id !== id))
    } catch (e: any) {
      alert(e.message)
    }
  }

  const canProceed = jd.trim().length >= 50

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Paste the job description</h2>
      <p className="text-sm text-gray-500 mb-5">Copy the full JD from the company's careers page.</p>

      {/* Optional metadata */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Job title (optional)</label>
          <input
            type="text"
            value={jobTitle}
            onChange={e => setJobTitle(e.target.value)}
            placeholder="e.g. Senior Software Engineer"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Company (optional)</label>
          <input
            type="text"
            value={company}
            onChange={e => setCompany(e.target.value)}
            placeholder="e.g. Bloomberg"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
      </div>

      {/* Template picker */}
      {templates.length > 0 && (
        <div className="mb-3 relative">
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg px-3 py-2 bg-white hover:border-gray-400 transition-colors"
          >
            <BookOpen size={14} />
            Load saved template
            <ChevronDown size={14} className={`transition-transform ${showTemplates ? 'rotate-180' : ''}`} />
          </button>
          {showTemplates && (
            <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-56 overflow-y-auto">
              {templatesLoading ? (
                <p className="text-sm text-gray-400 px-4 py-3">Loading...</p>
              ) : templates.map(t => (
                <div
                  key={t.id}
                  onClick={() => handleLoadTemplate(t)}
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.atsPlatform} · {t.content.slice(0, 40)}...</p>
                  </div>
                  <button
                    onClick={e => handleDeleteTemplate(t.id, e)}
                    className="p-1 text-gray-300 hover:text-red-500 transition-colors ml-2"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* JD textarea */}
      <div className="mb-2">
        <textarea
          value={jd}
          onChange={e => setJd(e.target.value.slice(0, MAX_CHARS))}
          rows={12}
          placeholder="Paste the full job description here..."
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-y font-mono leading-relaxed"
        />
        <div className="flex justify-between items-center mt-1">
          <span className={`text-xs ${jd.length > MAX_CHARS * 0.9 ? 'text-orange-500' : 'text-gray-400'}`}>
            {jd.length.toLocaleString()} / {MAX_CHARS.toLocaleString()} characters
          </span>
          {jd.trim().length > 50 && (
            <button
              onClick={() => setShowSave(!showSave)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900"
            >
              <Save size={12} /> Save as template
            </button>
          )}
        </div>
      </div>

      {/* Save template inline form */}
      {showSave && (
        <div className="flex gap-2 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <input
            type="text"
            value={saveName}
            onChange={e => setSaveName(e.target.value)}
            placeholder="Template name..."
            className="flex-1 border border-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            onKeyDown={e => e.key === 'Enter' && handleSaveTemplate()}
          />
          <button
            onClick={handleSaveTemplate}
            disabled={!saveName.trim() || saving}
            className="px-3 py-1.5 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-700 disabled:opacity-40 transition-colors"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button onClick={() => setShowSave(false)} className="p-1.5 text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="flex justify-between">
        <button onClick={() => setStep(1)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:border-gray-400 transition-colors">
          ← Back
        </button>
        <button
          onClick={handleNext}
          disabled={!canProceed}
          className="px-5 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next: Resume →
        </button>
      </div>
    </div>
  )
}
