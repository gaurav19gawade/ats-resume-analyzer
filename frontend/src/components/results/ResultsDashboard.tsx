import { useState } from 'react'
import { Copy, Check, RefreshCw, AlertTriangle, ChevronRight } from 'lucide-react'
import type { AnalyzeResponse } from '../../types'
import { VERDICT_CONFIG } from '../../types'
import { ScoreRing } from './ScoreRing'

interface Props {
  result: AnalyzeResponse
  onReset: () => void
}

type Tab = 'keywords' | 'flags' | 'actions' | 'latex'

const TABS: { id: Tab; label: string }[] = [
  { id: 'keywords', label: 'Keywords' },
  { id: 'flags',    label: 'Flags' },
  { id: 'actions',  label: 'Actions' },
  { id: 'latex',    label: 'LaTeX edits' },
]

function DimensionBar({ label, score, weight }: { label: string; score: number; weight: number }) {
  const color = score >= 7 ? 'bg-green-600' : score >= 5 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="bg-white border border-gray-100 rounded-lg p-3">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs text-gray-500">{label}</span>
        <span className="text-xs text-gray-400">{weight}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-1.5">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${score * 10}%` }} />
      </div>
      <span className="text-sm font-semibold text-gray-800">{score.toFixed(1)}<span className="text-gray-400 font-normal">/10</span></span>
    </div>
  )
}

function KeywordPill({ word, variant }: { word: string; variant: 'match' | 'miss' | 'weak' }) {
  const styles = {
    match: 'bg-green-50 text-green-700 border-green-200',
    miss:  'bg-red-50 text-red-700 border-red-200',
    weak:  'bg-amber-50 text-amber-700 border-amber-200',
  }
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium border ${styles[variant]}`}>
      {word}
    </span>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handle = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }
  return (
    <button
      onClick={handle}
      className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors mt-2"
    >
      {copied ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
      {copied ? 'Copied!' : 'Copy snippet'}
    </button>
  )
}

export function ResultsDashboard({ result, onReset }: Props) {
  const [tab, setTab] = useState<Tab>('keywords')
  const vc = VERDICT_CONFIG[result.verdict]

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-start mb-5">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Analysis results</h2>
          <p className="text-sm text-gray-500">ATS pass probability: {result.atsPassProbability}%</p>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 hover:border-gray-400 transition-colors"
        >
          <RefreshCw size={14} /> New analysis
        </button>
      </div>

      {/* ATS note */}
      {result.atsNote && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4 text-sm text-amber-800">
          <strong>ATS note:</strong> {result.atsNote}
        </div>
      )}

      {/* Score hero */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-5 mb-4">
        <ScoreRing score={result.overallScore} />
        <div className="flex-1">
          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border mb-2 ${vc.bg} ${vc.text} ${vc.border}`}>
            {result.verdict}
          </span>
          <h3 className="text-base font-semibold text-gray-900">{result.verdictTitle}</h3>
          <p className="text-sm text-gray-500 mt-0.5">{result.verdictSub}</p>
        </div>
      </div>

      {/* Dimensions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-5">
        {result.dimensions.map(d => (
          <DimensionBar key={d.label} {...d} />
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-5">
        <div className="flex gap-0">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-400 hover:text-gray-700'
              }`}
            >
              {t.label}
              {t.id === 'flags' && result.rejectionFlags.length > 0 && (
                <span className="ml-1.5 bg-red-100 text-red-600 text-xs px-1.5 py-0.5 rounded-full">
                  {result.rejectionFlags.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Keywords tab */}
      {tab === 'keywords' && (
        <div className="space-y-5">
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Matched ({result.keywords.matched.length})
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {result.keywords.matched.map(k => <KeywordPill key={k} word={k} variant="match" />)}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Missing — add these ({result.keywords.missing.length})
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {result.keywords.missing.map(k => <KeywordPill key={k} word={k} variant="miss" />)}
              {result.keywords.missing.length === 0 && (
                <p className="text-sm text-gray-400">No critical missing keywords — great coverage!</p>
              )}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Underrepresented — boost these ({result.keywords.weak.length})
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {result.keywords.weak.map(k => <KeywordPill key={k} word={k} variant="weak" />)}
            </div>
          </div>
        </div>
      )}

      {/* Flags tab */}
      {tab === 'flags' && (
        <div className="space-y-2">
          {result.rejectionFlags.length === 0 ? (
            <p className="text-sm text-gray-400">No major rejection flags found.</p>
          ) : result.rejectionFlags.map((f, i) => (
            <div key={i} className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle size={15} className="text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-800">{f}</p>
            </div>
          ))}
        </div>
      )}

      {/* Actions tab */}
      {tab === 'actions' && (
        <div className="space-y-5">
          {[
            { key: 'high' as const,   label: 'High priority — do immediately', borderColor: 'border-l-red-400',   bgColor: 'bg-red-50'    },
            { key: 'medium' as const, label: 'Medium priority — before applying', borderColor: 'border-l-amber-400', bgColor: 'bg-amber-50' },
            { key: 'low' as const,    label: 'Low priority — polish',           borderColor: 'border-l-green-400', bgColor: 'bg-green-50'  },
          ].map(({ key, label, borderColor, bgColor }) => (
            <div key={key}>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{label}</h4>
              <div className="space-y-2">
                {result.actions[key].map((a, i) => (
                  <div key={i} className={`flex items-start gap-2.5 p-3 ${bgColor} border-l-4 ${borderColor} border border-transparent rounded-lg`}>
                    <ChevronRight size={14} className="mt-0.5 flex-shrink-0 text-gray-400" />
                    <p className="text-sm text-gray-800">{a}</p>
                  </div>
                ))}
                {result.actions[key].length === 0 && (
                  <p className="text-sm text-gray-400">None</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* LaTeX edits tab */}
      {tab === 'latex' && (
        <div>
          <p className="text-sm text-gray-500 mb-4">
            Copy these snippets directly into your Overleaf editor. Each targets a specific section.
          </p>
          <div className="space-y-4">
            {result.latexEdits.map((e, i) => (
              <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{e.where}</span>
                </div>
                <div className="px-4 py-3">
                  <p className="text-sm text-gray-700 mb-3">{e.change}</p>
                  <pre className="bg-gray-900 text-gray-100 rounded-lg p-3 text-xs overflow-x-auto leading-relaxed font-mono whitespace-pre-wrap">
                    {e.snippet}
                  </pre>
                  <CopyButton text={e.snippet} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
