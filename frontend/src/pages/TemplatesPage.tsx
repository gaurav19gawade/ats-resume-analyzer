import { useEffect, useState } from 'react'
import { BookOpen, Plus, Pencil, Trash2, X, Check } from 'lucide-react'
import { getTemplates, createTemplate, updateTemplate, deleteTemplate } from '../api/services'
import type { JdTemplate } from '../types'
import { ATS_PLATFORMS } from '../types'

interface FormState {
  name: string
  content: string
  atsPlatform: string
}

const EMPTY_FORM: FormState = { name: '', content: '', atsPlatform: 'unknown' }

export function TemplatesPage() {
  const [templates, setTemplates] = useState<JdTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      setTemplates(await getTemplates())
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  const openEdit = (t: JdTemplate) => {
    setEditingId(t.id)
    setForm({ name: t.name, content: t.content, atsPlatform: t.atsPlatform })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.content.trim()) return
    setSaving(true)
    try {
      if (editingId) {
        const updated = await updateTemplate(editingId, form)
        setTemplates(prev => prev.map(t => t.id === editingId ? updated : t))
      } else {
        const created = await createTemplate(form)
        setTemplates(prev => [created, ...prev])
      }
      setShowForm(false)
      setForm(EMPTY_FORM)
      setEditingId(null)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template?')) return
    setDeleting(id)
    try {
      await deleteTemplate(id)
      setTemplates(prev => prev.filter(t => t.id !== id))
    } catch (e: any) {
      alert(e.message)
    } finally {
      setDeleting(null)
    }
  }

  const atsPlatformLabel = (id: string) =>
    ATS_PLATFORMS.find(a => a.id === id)?.name || id

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">JD templates</h1>
          <p className="text-sm text-gray-500 mt-1">Save job descriptions to reuse across multiple resume analyses.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
        >
          <Plus size={15} /> New template
        </button>
      </div>

      {/* Create / Edit form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">
              {editingId ? 'Edit template' : 'New template'}
            </h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Template name</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Senior SWE — Fintech"
                maxLength={100}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Default ATS platform</label>
              <select
                value={form.atsPlatform}
                onChange={e => setForm(f => ({ ...f, atsPlatform: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
              >
                {ATS_PLATFORMS.map(a => (
                  <option key={a.id} value={a.id}>{a.name} — {a.tier}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Job description content
                <span className="text-gray-400 font-normal ml-1">({form.content.length}/8000)</span>
              </label>
              <textarea
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value.slice(0, 8000) }))}
                rows={10}
                placeholder="Paste the full job description here..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-y font-mono"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:border-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!form.name.trim() || !form.content.trim() || saving}
                className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-40 transition-colors"
              >
                <Check size={14} />
                {saving ? 'Saving...' : editingId ? 'Update' : 'Save template'}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-gray-900" />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>
      )}

      {!loading && templates.length === 0 && !showForm && (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl">
          <BookOpen size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No templates yet</p>
          <p className="text-sm text-gray-400 mt-1 mb-4">Save a job description to reuse it across analyses.</p>
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
          >
            Create first template
          </button>
        </div>
      )}

      {!loading && templates.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          {templates.map((t, i) => (
            <div
              key={t.id}
              className={i < templates.length - 1 ? 'border-b border-gray-100' : ''}
            >
              <div className="flex items-center gap-3 px-5 py-4">
                <button
                  onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                  className="flex-1 text-left min-w-0"
                >
                  <p className="text-sm font-medium text-gray-900 truncate">{t.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {atsPlatformLabel(t.atsPlatform)} · {t.content.length.toLocaleString()} chars · updated{' '}
                    {new Date(t.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </button>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => openEdit(t)}
                    className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors"
                    title="Edit"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
                    disabled={deleting === t.id}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Expandable preview */}
              {expandedId === t.id && (
                <div className="px-5 pb-4">
                  <pre className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-xs text-gray-600 font-mono whitespace-pre-wrap overflow-x-auto max-h-48 leading-relaxed">
                    {t.content}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && templates.length > 0 && (
        <p className="text-xs text-gray-400 mt-3 text-right">
          {templates.length} / 50 templates used
        </p>
      )}
    </div>
  )
}
