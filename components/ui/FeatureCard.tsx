'use client'

import { motion } from 'framer-motion'

interface FeatureCardProps {
  index: number
  title: string
  description: string
  tag: string
  icon: React.ReactNode
  isAmber?: boolean
}

export function FeatureCard({ index, title, description, tag, icon, isAmber }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.65, ease: [0.25, 0.1, 0.25, 1] }}
      className="group relative bg-panel border border-subtle rounded-2xl p-8 hover:bg-surface hover:border-subtle-2 transition-all duration-300"
    >
      {/* Top accent */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-amber to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="flex flex-col h-full">
        {/* Index and Tag */}
        <div className="flex items-center justify-between mb-6">
          <span className="font-mono text-xs tracking-[0.14em] uppercase text-amber opacity-60">
            {String(index).padStart(2, '0')} / {tag.toUpperCase()}
          </span>
        </div>

        {/* Icon */}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${
          isAmber
            ? 'bg-amber-glow border border-amber-dim'
            : 'bg-amber-glow border border-amber-dim/50'
        }`}>
          <div className={isAmber ? 'text-amber' : 'text-amber'}>
            {icon}
          </div>
        </div>

        {/* Title */}
        <h3 className="font-display font-bold text-xl mb-3 leading-tight text-parchment">
          {title}
        </h3>

        {/* Description */}
        <p className="font-body text-sm text-secondary leading-relaxed flex-1">
          {description}
        </p>
      </div>
    </motion.div>
  )
}
