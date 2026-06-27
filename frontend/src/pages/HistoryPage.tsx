import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Trash2, ChevronRight, ChevronLeft } from 'lucide-react'
import { getHistory, deleteHistory } from '../api/services'
import type { HistorySummary, PagedResponse } from '../types'
import { VERDICT_CONFIG } from '../types'

function ScoreBadge({ score }: { score?: number }) {
  if (score === undefined || score === null) return <span className="text-gray-300 text-sm">—</span>
  const color = score >= 7 ? 'text-green-700 bg-green-50' : score >= 5 ? 'text-amber-700 bg-amber-50' : 'text-red-700 bg-red-50'
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>
      {score.toFixed(1)}/10
    </span>
  )
}

export function HistoryPage() {
  const [data, setData] = useState<PagedResponse<HistorySummary> | null>(null)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    load(page)
  }, [page])

  const load = async (p: number) => {
    setLoading(true)
    setError('')
    try {
      const result = await getHistory(p, 20)
      setData(result)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this analysis?')) return
    setDeleting(id)
    try {
      await deleteHistory(id)
      setData(prev => prev ? {
        ...prev,
        content: prev.content.filter(h => h.id !== id),
        totalElements: prev.totalElements - 1,
      } : prev)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setDeleting(null)
    }
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Analysis history</h1>
        <p className="text-sm text-gray-500 mt-1">Past resume analyses — click any row to view the full results.</p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-gray-900" />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>
      )}

      {!loading && data && data.content.length === 0 && (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl">
          <Clock size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No analyses yet</p>
          <p className="text-sm text-gray-400 mt-1">Your history will appear here after your first analysis.</p>
          <Link
            to="/"
            className="inline-block mt-4 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
          >
            Analyze a resume
          </Link>
        </div>
      )}

      {!loading && data && data.content.length > 0 && (
        <>
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            {data.content.map((h, i) => {
              const vc = h.verdict ? VERDICT_CONFIG[h.verdict as keyof typeof VERDICT_CONFIG] : null
              return (
                <div
                  key={h.id}
                  className={`flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors ${
                    i < data.content.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <Link to={`/history/${h.id}`} className="flex-1 flex items-center gap-4 min-w-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {h.jobTitle || 'Untitled role'}
                        {h.company && <span className="text-gray-400 font-normal"> · {h.company}</span>}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {h.atsPlatform} · {formatDate(h.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <ScoreBadge score={h.overallScore ?? undefined} />
                      {vc && h.verdict && (
                        <span className={`hidden sm:inline-block text-xs px-2 py-0.5 rounded-full border font-medium ${vc.bg} ${vc.text} ${vc.border}`}>
                          {h.verdict}
                        </span>
                      )}
                      <ChevronRight size={16} className="text-gray-300" />
                    </div>
                  </Link>
                  <button
                    onClick={() => handleDelete(h.id)}
                    disabled={deleting === h.id}
                    className="p-1.5 text-gray-300 hover:text-red-500 transition-colors disabled:opacity-40"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-400">
                {data.totalElements} total · page {data.number + 1} of {data.totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => p - 1)}
                  disabled={page === 0}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:border-gray-400 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft size={14} /> Previous
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={data.last}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:border-gray-400 disabled:opacity-40 transition-colors"
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
