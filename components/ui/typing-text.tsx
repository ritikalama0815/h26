"use client"

import { useEffect, useState, useRef } from "react"

interface TypingTextProps {
  lines: string[]
  typingSpeed?: number
  lineDelay?: number
  className?: string
  lineClassName?: string
  outlineLines?: number[]
  outlineStyle?: React.CSSProperties
  style?: React.CSSProperties
}

export default function TypingText({
  lines,
  typingSpeed = 80,
  lineDelay = 200,
  className,
  lineClassName,
  outlineLines = [],
  outlineStyle,
  style,
}: TypingTextProps) {
  const [displayed, setDisplayed] = useState<string[]>(lines.map(() => ""))
  const [currentLine, setCurrentLine] = useState(0)
  const [currentChar, setCurrentChar] = useState(0)
  const [showCursor, setShowCursor] = useState(true)
  const started = useRef(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting && !started.current) started.current = true },
      { threshold: 0.3 }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!started.current) {
      const check = setInterval(() => {
        if (started.current) {
          clearInterval(check)
          setCurrentLine(0)
          setCurrentChar(0)
        }
      }, 100)
      return () => clearInterval(check)
    }
  }, [])

  useEffect(() => {
    if (currentLine >= lines.length) {
      const cursorBlink = setInterval(() => setShowCursor(p => !p), 530)
      return () => clearInterval(cursorBlink)
    }

    const line = lines[currentLine]
    if (currentChar <= line.length) {
      const timeout = setTimeout(() => {
        setDisplayed(prev => {
          const next = [...prev]
          next[currentLine] = line.slice(0, currentChar)
          return next
        })
        if (currentChar < line.length) {
          setCurrentChar(c => c + 1)
        } else if (currentLine < lines.length - 1) {
          setTimeout(() => {
            setCurrentLine(l => l + 1)
            setCurrentChar(0)
          }, lineDelay)
        } else {
          setCurrentLine(lines.length)
        }
      }, typingSpeed)
      return () => clearTimeout(timeout)
    }
  }, [currentLine, currentChar, lines, typingSpeed, lineDelay])

  const isOutline = (i: number) => outlineLines.includes(i)

  return (
    <div ref={ref} className={className} style={style}>
      {displayed.map((text, i) => (
        <div key={i} className={lineClassName} style={isOutline(i) ? outlineStyle : undefined}>
          {text}
          {i === Math.min(currentLine, lines.length - 1) && (
            <span
              style={{
                display: "inline-block",
                width: "0.06em",
                height: "0.85em",
                background: "#00a38b",
                marginLeft: "0.06em",
                verticalAlign: "baseline",
                opacity: currentLine >= lines.length ? (showCursor ? 1 : 0) : 1,
                transition: "opacity 0.1s",
              }}
            />
          )}
        </div>
      ))}
    </div>
  )
}
