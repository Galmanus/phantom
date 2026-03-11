'use client'

import { useEffect, useRef } from 'react'

export function AmbientBackground() {
  const amberRef = useRef<HTMLDivElement>(null)
  const greenRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Optional: Add any JS animations if needed, but prefer CSS
  }, [])

  return (
    <>
      {/* Amber orb - main accent */}
      <div
        ref={amberRef}
        className="fixed top-0 right-0 w-[700px] h-[700px] opacity-10 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(circle, rgba(245,166,35,0.12) 0%, transparent 70%)',
          animation: 'drift-amber 28s ease-in-out infinite',
          willChange: 'transform',
        }}
      />

      {/* ZK Green orb - secondary accent */}
      <div
        ref={greenRef}
        className="fixed bottom-0 left-0 w-[500px] h-[500px] opacity-8 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(circle, rgba(57,255,20,0.08) 0%, transparent 70%)',
          animation: 'drift-green 20s ease-in-out infinite reverse',
          willChange: 'transform',
        }}
      />

      {/* Noise texture overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      <style jsx>{`
        @keyframes drift-amber {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(-50px, 30px) rotate(90deg); }
          50% { transform: translate(30px, -40px) rotate(180deg); }
          75% { transform: translate(-20px, 20px) rotate(270deg); }
        }

        @keyframes drift-green {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(40px, -50px) rotate(120deg); }
          66% { transform: translate(-30px, 40px) rotate(240deg); }
        }
      `}</style>
    </>
  )
}
