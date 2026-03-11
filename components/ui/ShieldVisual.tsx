'use client'

import { motion } from 'framer-motion'

export function ShieldVisual() {
  return (
    <div className="relative w-96 h-96 flex items-center justify-center">
      {/* Rotating Rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Ring 1 */}
        <div
          className="absolute w-80 h-80 border border-amber-dim rounded-full"
          style={{
            animation: 'orbit 30s linear infinite',
          }}
        >
          <div
            className="absolute top-0 left-1/2 w-1.5 h-1.5 bg-amber rounded-full -translate-x-1/2 -translate-y-1/2"
            style={{
              boxShadow: '0 0 14px #F5A623',
            }}
          />
        </div>

        {/* Ring 2 */}
        <div
          className="absolute w-60 h-60 border border-zk-green-dim rounded-full"
          style={{
            animation: 'orbit-reverse 20s linear infinite',
          }}
        >
          <div
            className="absolute top-0 left-1/2 w-1.5 h-1.5 bg-zk-green rounded-full -translate-x-1/2 -translate-y-1/2"
            style={{
              boxShadow: '0 0 14px #39FF14',
            }}
          />
        </div>

        {/* Ring 3 */}
        <div
          className="absolute w-44 h-44 border border-amber-dim/30 rounded-full"
          style={{
            animation: 'orbit 15s linear infinite',
          }}
        />
      </div>

      {/* Hexagon Core */}
      <motion.div
        className="relative w-40 h-40 flex items-center justify-center"
        animate={{
          boxShadow: [
            '0 0 80px rgba(245,166,35,0.15), inset 0 0 40px rgba(245,166,35,0.05)',
            '0 0 120px rgba(245,166,35,0.3), inset 0 0 60px rgba(245,166,35,0.1)',
            '0 0 80px rgba(245,166,35,0.15), inset 0 0 40px rgba(245,166,35,0.05)',
          ],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <div
          className="w-full h-full bg-gradient-to-br from-surface to-panel relative"
          style={{
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
          }}
        >
          {/* Inner glow */}
          <div className="absolute inset-0 rounded-full opacity-50" />

          {/* Shield Icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-amber">
              <path
                d="M12 2L20 7V17C20 19.2091 18.2091 21 16 21H8C5.79086 21 4 19.2091 4 17V7L12 2Z"
                stroke="url(#shield-gradient)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <defs>
                <linearGradient id="shield-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F5A623" />
                  <stop offset="100%" stopColor="#F5A623" stopOpacity="0.6" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </motion.div>

      {/* Floating Data Fragments - BTC symbols */}
      {[
        { text: '₿0.1', x: -120, y: -80, delay: 0 },
        { text: 'Poseidon', x: 100, y: -60, delay: 1 },
        { text: 'c2b1', x: -80, y: 100, delay: 2 },
        { text: 'ZK✓', x: 80, y: 80, delay: 3 },
        { text: 'STARK', x: -100, y: 40, delay: 4 },
        { text: '0xf3a', x: 120, y: -20, delay: 5 },
      ].map((fragment, i) => (
        <motion.div
          key={i}
          className="absolute font-mono text-xs text-amber opacity-50"
          initial={{ opacity: 0, y: 0 }}
          animate={{
            opacity: [0, 0.7, 0],
            y: [0, -60],
          }}
          transition={{
            duration: 6,
            delay: fragment.delay,
            repeat: Infinity,
            ease: 'easeOut',
          }}
          style={{
            left: `calc(50% + ${fragment.x}px)`,
            top: `calc(50% + ${fragment.y}px)`,
          }}
        >
          {fragment.text}
        </motion.div>
      ))}

      <style jsx>{`
        @keyframes orbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes orbit-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
      `}</style>
    </div>
  )
}
