'use client'

/**
 * AmbientBackground — Atmospheric background with animated orbs and noise
 * 
 * Two radial gradient orbs drift slowly across the screen
 * Noise texture overlay adds depth
 * Uses CSS animations only — no JS requestAnimationFrame
 */

export function AmbientBackground() {
  return (
    <>
      {/* Violet orb — top-right */}
      <div className="ambient-orb-1" />
      
      {/* Cyan orb — bottom-left */}
      <div className="ambient-orb-2" />
      
      {/* Noise texture overlay */}
      <div className="noise-overlay" />
    </>
  )
}
