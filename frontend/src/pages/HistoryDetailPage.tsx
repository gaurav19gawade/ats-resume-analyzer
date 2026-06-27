import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { getHistoryDetail, deleteHistory } from '../api/services'
import { ResultsDashboard } from '../components/results/ResultsDashboard'
import type { HistoryDetail } from '../types'

export function HistoryDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [detail, setDetail] = useState<HistoryDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!id) return
    load()
  }, [id])

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getHistoryDetail(id!)
      setDetail(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this analysis permanently?')) return
    setDeleting(true)
    try {
      await deleteHistory(id!)
      navigate('/history', { replace: true })
    } catch (e: any) {
      alert(e.message)
      setDeleting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link
          to="/history"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={15} /> Back to history
        </Link>
        {detail && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50 disabled:opacity-40 transition-colors"
          >
            <Trash2 size={14} />
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-gray-900" />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>
      )}

      {detail && (
        <>
          {(detail.jobTitle || detail.company) && (
            <div className="mb-4">
              <h1 className="text-xl font-semibold text-gray-900">
                {detail.jobTitle || 'Untitled role'}
                {detail.company && <span className="text-gray-400 font-normal"> · {detail.company}</span>}
              </h1>
              <p className="text-sm text-gray-400 mt-0.5">
                {detail.atsPlatform} · {new Date(detail.createdAt).toLocaleDateString('en-US', {
                  month: 'long', day: 'numeric', year: 'numeric',
                })}
              </p>
            </div>
          )}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8">
            <ResultsDashboard
              result={detail.resultJson}
              onReset={() => navigate('/')}
            />
          </div>
        </>
      )}
    </div>
  )
}
