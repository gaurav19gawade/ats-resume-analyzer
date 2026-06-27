import { useEffect, useState } from 'react'

interface Props {
  score: number // 0-10
  size?: number
}

function scoreColor(score: number) {
  if (score >= 7) return '#15803d'   // green-700
  if (score >= 5) return '#b45309'   // amber-700
  return '#b91c1c'                   // red-700
}

export function ScoreRing({ score, size = 96 }: Props) {
  const [animated, setAnimated] = useState(false)
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(score, 10) / 10) * circumference

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="7" />
        <circle
          cx="48" cy="48" r={radius}
          fill="none"
          stroke={scoreColor(score)}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animated ? offset : circumference}
          transform="rotate(-90 48 48)"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-semibold text-gray-900">{score.toFixed(1)}</span>
        <span className="text-xs text-gray-400">/10</span>
      </div>
    </div>
  )
}
