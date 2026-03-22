"use client"

import { motion, useReducedMotion } from "framer-motion"

export function StudentStudyingAnimation() {
  const reduce = useReducedMotion()
  const dur = reduce ? 0 : 2.4
  const repeat = reduce ? 0 : Infinity

  return (
    <div className="relative mx-auto w-full max-w-md select-none" aria-hidden>
      <svg
        viewBox="0 0 400 320"
        className="h-auto w-full overflow-visible drop-shadow-[0_20px_40px_rgba(0,163,139,0.18)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="desk" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00a38b" />
            <stop offset="100%" stopColor="#6b9e83" />
          </linearGradient>
          <linearGradient id="lamp" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#c2fbef" />
            <stop offset="100%" stopColor="#6b9e83" />
          </linearGradient>
          <radialGradient id="glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(0,163,139,0.4)" />
            <stop offset="100%" stopColor="rgba(0,163,139,0)" />
          </radialGradient>
        </defs>

        <motion.circle
          cx="220" cy="140" r="120" fill="url(#glow)"
          animate={reduce ? undefined : { opacity: [0.5, 0.85, 0.5], scale: [1, 1.05, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />

        <path d="M60 220 L340 200 L360 230 L80 252 Z" fill="url(#desk)" opacity={0.92} />
        <rect x="72" y="218" width="296" height="14" rx="4" fill="#3b2b2e" opacity={0.35} />

        <path d="M118 210 Q110 150 125 118 Q140 100 158 108 L168 210 Z" fill="#4a3a3d" opacity={0.9} />

        <path d="M175 200 Q165 140 200 118 Q235 105 255 130 L268 195 Q230 205 200 198 Z" fill="#6c3837" />
        <path d="M255 130 Q285 145 295 175 L275 188 Q255 160 240 150 Z" fill="#5a3030" />

        <circle cx="218" cy="95" r="36" fill="#d4a574" />
        <path d="M198 88 Q218 72 242 82 Q248 95 240 108 Q218 118 198 108 Q190 98 198 88" fill="#3b2b2e" />

        <motion.g
          animate={reduce ? undefined : { y: [0, -3, 0] }}
          transition={{ duration: dur, repeat, ease: "easeInOut" }}
        >
          <rect x="195" y="188" width="64" height="48" rx="4" fill="#e8f5f0" />
          <rect x="199" y="192" width="56" height="40" rx="2" fill="#c2fbef" />
          <motion.path
            d="M205 200 H250 M205 210 H248 M205 220 H252"
            stroke="#6b9e83" strokeWidth="2" strokeLinecap="round"
            animate={reduce ? undefined : { opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.g>

        <rect x="115" y="198" width="78" height="48" rx="4" fill="#3b2b2e" />
        <rect x="120" y="203" width="68" height="32" rx="2" fill="#00a38b" opacity={0.35} />
        <motion.rect x="128" y="210" width="12" height="12" rx="2" fill="#00a38b"
          animate={reduce ? undefined : { opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
        />
        <motion.rect x="148" y="210" width="12" height="12" rx="2" fill="#6b9e83"
          animate={reduce ? undefined : { opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: 0.5 }}
        />
        <motion.rect x="168" y="210" width="12" height="12" rx="2" fill="#c2fbef"
          animate={reduce ? undefined : { opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: 0.8 }}
        />

        <path d="M310 248 L318 160 L328 160 L322 248 Z" fill="url(#lamp)" />
        <ellipse cx="323" cy="158" rx="22" ry="10" fill="#c2fbef" />
        <motion.path d="M300 158 Q323 120 346 158" fill="rgba(194,251,239,0.5)"
          animate={reduce ? undefined : { opacity: [0.35, 0.75, 0.35] }}
          transition={{ duration: 2, repeat: Infinity }}
        />

        {!reduce && (
          <>
            <motion.circle cx="95" cy="75" r="6" fill="#00a38b"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: [0, 1, 0], y: [8, -12, -28] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeOut" }}
            />
            <motion.circle cx="120" cy="55" r="4" fill="#6b9e83"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: [0, 1, 0], y: [8, -18, -40] }}
              transition={{ duration: 3.4, repeat: Infinity, ease: "easeOut", delay: 0.6 }}
            />
            <motion.path d="M88 95 Q70 88 62 70" stroke="#6c3837" strokeWidth="2"
              strokeDasharray="4 6" fill="none"
              animate={{ opacity: [0.2, 0.75, 0.2] }}
              transition={{ duration: 3.2, repeat: Infinity }}
            />
          </>
        )}
      </svg>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        Students stay focused — CoLab keeps contributions visible.
      </p>
    </div>
  )
}
