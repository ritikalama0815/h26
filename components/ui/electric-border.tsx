"use client"

import { useEffect, useRef, useCallback, type ReactNode } from "react"

interface ElectricBorderProps {
  children: ReactNode
  color?: string
  speed?: number
  chaos?: number
  borderRadius?: number
  className?: string
  style?: React.CSSProperties
}

export default function ElectricBorder({
  children,
  color = "#00a38b",
  speed = 1,
  chaos = 0.12,
  borderRadius = 0,
  className,
  style,
}: ElectricBorderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number>(0)
  const timeRef = useRef(0)
  const lastFrameTimeRef = useRef(0)

  const random = useCallback((x: number) => {
    return (Math.sin(x * 12.9898) * 43758.5453) % 1
  }, [])

  const noise2D = useCallback(
    (x: number, y: number) => {
      const i = Math.floor(x)
      const j = Math.floor(y)
      const fx = x - i
      const fy = y - j
      const a = random(i + j * 57)
      const b = random(i + 1 + j * 57)
      const c = random(i + (j + 1) * 57)
      const d = random(i + 1 + (j + 1) * 57)
      const ux = fx * fx * (3.0 - 2.0 * fx)
      const uy = fy * fy * (3.0 - 2.0 * fy)
      return a * (1 - ux) * (1 - uy) + b * ux * (1 - uy) + c * (1 - ux) * uy + d * ux * uy
    },
    [random]
  )

  const octavedNoise = useCallback(
    (x: number, octaves: number, lacunarity: number, gain: number, baseAmplitude: number, baseFrequency: number, time: number, seed: number, baseFlatness: number) => {
      let y = 0
      let amplitude = baseAmplitude
      let frequency = baseFrequency
      for (let i = 0; i < octaves; i++) {
        let octaveAmplitude = amplitude
        if (i === 0) octaveAmplitude *= baseFlatness
        y += octaveAmplitude * noise2D(frequency * x + seed * 100, time * frequency * 0.3)
        frequency *= lacunarity
        amplitude *= gain
      }
      return y
    },
    [noise2D]
  )

  const getCornerPoint = useCallback((cx: number, cy: number, r: number, startAngle: number, arcLength: number, progress: number) => {
    const angle = startAngle + progress * arcLength
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
  }, [])

  const getRoundedRectPoint = useCallback(
    (t: number, left: number, top: number, width: number, height: number, radius: number) => {
      const sw = width - 2 * radius
      const sh = height - 2 * radius
      const ca = (Math.PI * radius) / 2
      const total = 2 * sw + 2 * sh + 4 * ca
      const d = t * total
      let acc = 0

      if (d <= acc + sw) return { x: left + radius + ((d - acc) / sw) * sw, y: top }
      acc += sw
      if (d <= acc + ca) return getCornerPoint(left + width - radius, top + radius, radius, -Math.PI / 2, Math.PI / 2, (d - acc) / ca)
      acc += ca
      if (d <= acc + sh) return { x: left + width, y: top + radius + ((d - acc) / sh) * sh }
      acc += sh
      if (d <= acc + ca) return getCornerPoint(left + width - radius, top + height - radius, radius, 0, Math.PI / 2, (d - acc) / ca)
      acc += ca
      if (d <= acc + sw) return { x: left + width - radius - ((d - acc) / sw) * sw, y: top + height }
      acc += sw
      if (d <= acc + ca) return getCornerPoint(left + radius, top + height - radius, radius, Math.PI / 2, Math.PI / 2, (d - acc) / ca)
      acc += ca
      if (d <= acc + sh) return { x: left, y: top + height - radius - ((d - acc) / sh) * sh }
      acc += sh
      return getCornerPoint(left + radius, top + radius, radius, Math.PI, Math.PI / 2, (d - acc) / ca)
    },
    [getCornerPoint]
  )

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const octaves = 10
    const lacunarity = 1.6
    const gain = 0.7
    const amplitude = chaos
    const frequency = 10
    const baseFlatness = 0
    const displacement = 60
    const borderOffset = 60

    const updateSize = () => {
      const rect = container.getBoundingClientRect()
      const w = rect.width + borderOffset * 2
      const h = rect.height + borderOffset * 2
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.scale(dpr, dpr)
      return { width: w, height: h }
    }

    let { width, height } = updateSize()

    const draw = (currentTime: number) => {
      if (!canvas || !ctx) return
      const dt = (currentTime - lastFrameTimeRef.current) / 1000
      timeRef.current += dt * speed
      lastFrameTimeRef.current = currentTime

      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.scale(dpr, dpr)

      ctx.strokeStyle = color
      ctx.lineWidth = 1
      ctx.lineCap = "round"
      ctx.lineJoin = "round"

      const scale = displacement
      const l = borderOffset
      const t = borderOffset
      const bw = width - 2 * borderOffset
      const bh = height - 2 * borderOffset
      const maxR = Math.min(bw, bh) / 2
      const r = Math.min(borderRadius, maxR)
      const approxPerim = 2 * (bw + bh) + 2 * Math.PI * r
      const samples = Math.floor(approxPerim / 2)

      ctx.beginPath()
      for (let i = 0; i <= samples; i++) {
        const progress = i / samples
        const pt = getRoundedRectPoint(progress, l, t, bw, bh, r)
        const xN = octavedNoise(progress * 8, octaves, lacunarity, gain, amplitude, frequency, timeRef.current, 0, baseFlatness)
        const yN = octavedNoise(progress * 8, octaves, lacunarity, gain, amplitude, frequency, timeRef.current, 1, baseFlatness)
        const dx = pt.x + xN * scale
        const dy = pt.y + yN * scale
        if (i === 0) ctx.moveTo(dx, dy)
        else ctx.lineTo(dx, dy)
      }
      ctx.closePath()
      ctx.stroke()
      animationRef.current = requestAnimationFrame(draw)
    }

    const ro = new ResizeObserver(() => {
      const s = updateSize()
      width = s.width
      height = s.height
    })
    ro.observe(container)
    animationRef.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animationRef.current)
      ro.disconnect()
    }
  }, [color, speed, chaos, borderRadius, octavedNoise, getRoundedRectPoint])

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: "relative", overflow: "visible", isolation: "isolate", borderRadius, ...style }}
    >
      {/* Canvas layer */}
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", pointerEvents: "none", zIndex: 2 }}>
        <canvas ref={canvasRef} style={{ display: "block" }} />
      </div>
      {/* Glow layers */}
      <div style={{ position: "absolute", inset: 0, borderRadius: "inherit", pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: "inherit", border: `2px solid ${color}99`, filter: "blur(1px)" }} />
        <div style={{ position: "absolute", inset: 0, borderRadius: "inherit", border: `2px solid ${color}`, filter: "blur(4px)" }} />
        <div style={{ position: "absolute", inset: 0, borderRadius: "inherit", zIndex: -1, transform: "scale(1.1)", filter: "blur(32px)", opacity: 0.3, background: `linear-gradient(-30deg, ${color}, transparent, ${color})` }} />
      </div>
      {/* Content */}
      <div style={{ position: "relative", borderRadius: "inherit", zIndex: 1 }}>
        {children}
      </div>
    </div>
  )
}
