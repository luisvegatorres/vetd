"use client"

import * as React from "react"
import { useMotionValue, useReducedMotion, useSpring } from "motion/react"
import { useTheme } from "next-themes"

import { cn } from "@/lib/utils"

type HeroShaderProps = React.HTMLAttributes<HTMLDivElement> & {
  /**
   * Scales the base + hover dot alpha and halo glow. `1` matches the home
   * hero defaults; drop to ~0.5 for a quieter texture behind dense content.
   */
  intensity?: number
  /**
   * Extra classes for the children wrapper (useful when the container has a
   * fixed height and the content needs to fill it — e.g. `"h-full"`).
   */
  contentClassName?: string
}

const GRID_SPACING = 26
const BASE_DOT_RADIUS = 0.9
const HALO_RADIUS = 200
const RADIUS_GAIN = 0.45
const MAX_PUSH = 3.5
const BASE_ALPHA_DARK = 0.145
const HOVER_ALPHA_DARK = 0.26
const BASE_ALPHA_LIGHT = 0.16
const HOVER_ALPHA_LIGHT = 0.22
const IDLE_INTENSITY = 0.001
const INTENSITY_EPSILON = 0.0005

export function HeroShader({
  children,
  className,
  contentClassName,
  intensity = 1,
  ...props
}: HeroShaderProps) {
  const intensityMultiplier = Math.max(0, Math.min(1, intensity))
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const cursorRef = React.useRef({ x: 0, y: 0 })
  const requestTickRef = React.useRef<() => void>(() => {})
  const shouldReduceMotion = useReducedMotion()
  const { resolvedTheme } = useTheme()
  const activity = useMotionValue(0)
  const smoothActivity = useSpring(activity, {
    stiffness: 240,
    damping: 28,
    mass: 0.3,
  })
  const isLightMode = resolvedTheme === "light"

  React.useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current

    if (!canvas || !container) return

    const context = canvas.getContext("2d")

    if (!context) return

    const dotRgb = isLightMode ? "16, 16, 16" : "255, 255, 255"
    const glowPeak = (isLightMode ? 0.052 : 0.062) * intensityMultiplier
    const glowMid = (isLightMode ? 0.02 : 0.024) * intensityMultiplier
    const baseAlpha =
      (isLightMode ? BASE_ALPHA_LIGHT : BASE_ALPHA_DARK) * intensityMultiplier
    const hoverAlpha =
      (isLightMode ? HOVER_ALPHA_LIGHT : HOVER_ALPHA_DARK) * intensityMultiplier
    const baseFillStyle = `rgba(${dotRgb}, ${baseAlpha})`

    let width = 0
    let height = 0
    let cols = 0
    let rows = 0
    let farPath: Path2D | null = null
    let frameId = 0
    let isAnimating = false
    let prevIntensity = Number.POSITIVE_INFINITY
    let resizeScheduled = false

    const buildFarPath = () => {
      const path = new Path2D()
      const half = GRID_SPACING / 2
      for (let row = 0; row < rows; row++) {
        const y = half + row * GRID_SPACING
        for (let col = 0; col < cols; col++) {
          const x = half + col * GRID_SPACING
          path.moveTo(x + BASE_DOT_RADIUS, y)
          path.arc(x, y, BASE_DOT_RADIUS, 0, Math.PI * 2)
        }
      }
      return path
    }

    const resize = () => {
      const rect = container.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = rect.width
      height = rect.height
      canvas.width = Math.max(1, Math.floor(width * dpr))
      canvas.height = Math.max(1, Math.floor(height * dpr))
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      cols = Math.ceil((width + GRID_SPACING) / GRID_SPACING)
      rows = Math.ceil((height + GRID_SPACING) / GRID_SPACING)
      farPath = buildFarPath()
      prevIntensity = Number.POSITIVE_INFINITY
      requestTick()
    }

    const scheduleResize = () => {
      if (resizeScheduled) return
      resizeScheduled = true
      window.requestAnimationFrame(() => {
        resizeScheduled = false
        resize()
      })
    }

    const drawFrame = () => {
      context.clearRect(0, 0, width, height)

      if (width === 0 || height === 0 || !farPath) return

      const cursorX = cursorRef.current.x
      const cursorY = cursorRef.current.y
      const intensity = smoothActivity.get()

      if (intensity > IDLE_INTENSITY) {
        const glow = context.createRadialGradient(
          cursorX,
          cursorY,
          0,
          cursorX,
          cursorY,
          HALO_RADIUS * 1.4
        )
        glow.addColorStop(0, `rgba(${dotRgb}, ${glowPeak * intensity})`)
        glow.addColorStop(0.42, `rgba(${dotRgb}, ${glowMid * intensity})`)
        glow.addColorStop(1, `rgba(${dotRgb}, 0)`)
        context.fillStyle = glow
        context.fillRect(0, 0, width, height)
      }

      if (intensity <= IDLE_INTENSITY) {
        context.fillStyle = baseFillStyle
        context.fill(farPath)
        return
      }

      // Dots never displace; only brightness/size change with proximity.
      // Draw baseline for all dots outside the halo bbox via one fill, then
      // redraw affected dots individually (in place) with boosted alpha/size.
      const half = GRID_SPACING / 2
      const reach = HALO_RADIUS + half
      const minCol = Math.max(
        0,
        Math.floor((cursorX - reach - half) / GRID_SPACING)
      )
      const maxCol = Math.min(
        cols - 1,
        Math.ceil((cursorX + reach - half) / GRID_SPACING)
      )
      const minRow = Math.max(
        0,
        Math.floor((cursorY - reach - half) / GRID_SPACING)
      )
      const maxRow = Math.min(
        rows - 1,
        Math.ceil((cursorY + reach - half) / GRID_SPACING)
      )

      const bboxX = minCol * GRID_SPACING
      const bboxY = minRow * GRID_SPACING
      const bboxW = (maxCol - minCol + 1) * GRID_SPACING + GRID_SPACING
      const bboxH = (maxRow - minRow + 1) * GRID_SPACING + GRID_SPACING

      context.save()
      const clip = new Path2D()
      clip.rect(0, 0, width, height)
      clip.rect(bboxX, bboxY, bboxW, bboxH)
      context.clip(clip, "evenodd")
      context.fillStyle = baseFillStyle
      context.fill(farPath)
      context.restore()

      for (let row = minRow; row <= maxRow; row++) {
        const y = half + row * GRID_SPACING
        for (let col = minCol; col <= maxCol; col++) {
          const x = half + col * GRID_SPACING
          const dx = cursorX - x
          const dy = cursorY - y
          const distance = Math.hypot(dx, dy)
          const normalized = Math.max(0, 1 - distance / HALO_RADIUS)
          // smoothstep for a soft, rounded falloff.
          const eased = normalized * normalized * (3 - 2 * normalized)
          const influence = eased * intensity
          // Push dots radially AWAY from the cursor — the cursor leaves a
          // subtle hole in the grid instead of dragging dots along with it.
          const push = influence * MAX_PUSH
          const dir = distance > 0.001 ? 1 / distance : 0
          const drawX = x - dx * dir * push
          const drawY = y - dy * dir * push
          const radius = BASE_DOT_RADIUS + influence * RADIUS_GAIN
          const alpha = baseAlpha + influence * hoverAlpha

          context.beginPath()
          context.arc(drawX, drawY, radius, 0, Math.PI * 2)
          context.fillStyle = `rgba(${dotRgb}, ${alpha})`
          context.fill()
        }
      }
    }

    let pendingPointerDraw = false

    const tick = () => {
      pendingPointerDraw = false
      drawFrame()

      const curI = smoothActivity.get()
      const intensityChanging =
        Math.abs(curI - prevIntensity) > INTENSITY_EPSILON
      prevIntensity = curI

      if (intensityChanging) {
        // Only keep the loop running while the activity spring is moving.
        // A static cursor with settled intensity costs nothing.
        frameId = window.requestAnimationFrame(tick)
      } else {
        isAnimating = false
      }
    }

    const requestTick = () => {
      if (isAnimating || pendingPointerDraw) return
      isAnimating = true
      pendingPointerDraw = true
      prevIntensity = Number.POSITIVE_INFINITY
      frameId = window.requestAnimationFrame(tick)
    }

    requestTickRef.current = requestTick

    const unsubActivity = smoothActivity.on("change", requestTick)

    resize()

    const resizeObserver = new ResizeObserver(scheduleResize)
    resizeObserver.observe(container)
    window.addEventListener("resize", scheduleResize)

    return () => {
      window.cancelAnimationFrame(frameId)
      resizeObserver.disconnect()
      window.removeEventListener("resize", scheduleResize)
      unsubActivity()
      requestTickRef.current = () => {}
    }
  }, [isLightMode, intensityMultiplier, smoothActivity])

  const updatePointer = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const rect = event.currentTarget.getBoundingClientRect()
      cursorRef.current.x = event.clientX - rect.left
      cursorRef.current.y = event.clientY - rect.top
      requestTickRef.current()
    },
    []
  )

  const handlePointerEnter = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (shouldReduceMotion) return
      updatePointer(event)
      activity.set(1)
    },
    [activity, shouldReduceMotion, updatePointer]
  )

  const handlePointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (shouldReduceMotion) return
      updatePointer(event)
      // If the cursor was already inside on mount/navigation, pointerenter
      // never fires — activate on first move so the effect wakes up.
      activity.set(1)
    },
    [activity, shouldReduceMotion, updatePointer]
  )

  const handlePointerLeave = React.useCallback(() => {
    if (shouldReduceMotion) return
    activity.set(0)
  }, [activity, shouldReduceMotion])

  return (
    <div
      ref={containerRef}
      className={cn("relative isolate overflow-hidden", className)}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onPointerMove={handlePointerMove}
      {...props}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.06))] dark:bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.22))]"
      />
      <div className={cn("relative z-10", contentClassName)}>{children}</div>
    </div>
  )
}
