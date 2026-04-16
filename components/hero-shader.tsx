"use client"

import * as React from "react"
import { useMotionValue, useReducedMotion, useSpring } from "motion/react"

import { cn } from "@/lib/utils"

type HeroShaderProps = React.HTMLAttributes<HTMLDivElement> & {
  active?: boolean
  pointerX?: number
  pointerY?: number
}

const GRID_SPACING = 26
const BASE_DOT_RADIUS = 0.9
const PULL_RADIUS = 188
const MAX_PULL = 8
const BASE_ALPHA = 0.12
const HOVER_ALPHA = 0.22

export function HeroShader({
  children,
  className,
  active,
  pointerX: controlledPointerX,
  pointerY: controlledPointerY,
  ...props
}: HeroShaderProps) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const shouldReduceMotion = useReducedMotion()
  const pointerX = useMotionValue(controlledPointerX ?? 0)
  const pointerY = useMotionValue(controlledPointerY ?? 0)
  const activity = useMotionValue(0)
  const smoothX = useSpring(pointerX, {
    stiffness: 260,
    damping: 32,
    mass: 0.35,
  })
  const smoothY = useSpring(pointerY, {
    stiffness: 260,
    damping: 32,
    mass: 0.35,
  })
  const smoothActivity = useSpring(activity, {
    stiffness: 220,
    damping: 30,
    mass: 0.4,
  })
  const [internalActive, setInternalActive] = React.useState(false)
  const isControlled =
    typeof active === "boolean" &&
    typeof controlledPointerX === "number" &&
    typeof controlledPointerY === "number"
  const isActive = isControlled ? active : internalActive

  React.useEffect(() => {
    if (!isControlled) return
    pointerX.set(controlledPointerX)
    pointerY.set(controlledPointerY)
  }, [controlledPointerX, controlledPointerY, isControlled, pointerX, pointerY])

  React.useEffect(() => {
    activity.set(isActive && !shouldReduceMotion ? 1 : 0)
  }, [activity, isActive, shouldReduceMotion])

  React.useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current

    if (!canvas || !container) return

    const context = canvas.getContext("2d")

    if (!context) return

    let width = 0
    let height = 0
    let frameId = 0

    const resize = () => {
      const rect = container.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1

      width = rect.width
      height = rect.height
      canvas.width = Math.max(1, Math.floor(width * dpr))
      canvas.height = Math.max(1, Math.floor(height * dpr))
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const draw = () => {
      frameId = window.requestAnimationFrame(draw)

      context.clearRect(0, 0, width, height)

      if (width === 0 || height === 0) return

      const cursorX = smoothX.get()
      const cursorY = smoothY.get()
      const intensity = smoothActivity.get()

      if (intensity > 0.001) {
        const glow = context.createRadialGradient(
          cursorX,
          cursorY,
          0,
          cursorX,
          cursorY,
          240
        )
        glow.addColorStop(0, `rgba(255, 255, 255, ${0.062 * intensity})`)
        glow.addColorStop(0.42, `rgba(255, 255, 255, ${0.024 * intensity})`)
        glow.addColorStop(1, "rgba(255, 255, 255, 0)")
        context.fillStyle = glow
        context.fillRect(0, 0, width, height)
      }

      for (
        let y = GRID_SPACING / 2;
        y <= height + GRID_SPACING / 2;
        y += GRID_SPACING
      ) {
        for (
          let x = GRID_SPACING / 2;
          x <= width + GRID_SPACING / 2;
          x += GRID_SPACING
        ) {
          const dx = cursorX - x
          const dy = cursorY - y
          const normalizedX = Math.max(0, 1 - Math.abs(dx) / PULL_RADIUS)
          const normalizedY = Math.max(0, 1 - Math.abs(dy) / PULL_RADIUS)
          const influence =
            intensity > 0 ? normalizedX * normalizedY * intensity : 0
          const easedInfluence = influence * influence

          // Pull on each axis independently so the distortion reads as a
          // compressed square lattice instead of individual radial particles.
          const pullX =
            Math.sign(dx) *
            Math.pow(normalizedX, 2) *
            normalizedY *
            MAX_PULL *
            intensity
          const pullY =
            Math.sign(dy) *
            Math.pow(normalizedY, 2) *
            normalizedX *
            MAX_PULL *
            intensity
          const drawX = x + pullX
          const drawY = y + pullY
          const radius = BASE_DOT_RADIUS + easedInfluence * 0.28
          const alpha = BASE_ALPHA + influence * HOVER_ALPHA

          context.beginPath()
          context.arc(drawX, drawY, radius, 0, Math.PI * 2)
          context.fillStyle = `rgba(255, 255, 255, ${alpha})`
          context.fill()
        }
      }
    }

    resize()
    draw()

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(container)
    window.addEventListener("resize", resize)

    return () => {
      window.cancelAnimationFrame(frameId)
      resizeObserver.disconnect()
      window.removeEventListener("resize", resize)
    }
  }, [shouldReduceMotion, smoothActivity, smoothX, smoothY])

  const updatePointer = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const rect = event.currentTarget.getBoundingClientRect()
      pointerX.set(event.clientX - rect.left)
      pointerY.set(event.clientY - rect.top)
    },
    [pointerX, pointerY]
  )

  const handlePointerEnter = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (shouldReduceMotion || isControlled) return
      updatePointer(event)
      setInternalActive(true)
    },
    [isControlled, shouldReduceMotion, updatePointer]
  )

  const handlePointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (shouldReduceMotion || isControlled) return
      updatePointer(event)
    },
    [isControlled, shouldReduceMotion, updatePointer]
  )

  const handlePointerLeave = React.useCallback(() => {
    if (shouldReduceMotion || isControlled) return
    setInternalActive(false)
  }, [isControlled, shouldReduceMotion])

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
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.22))]"
      />
      <div className="relative z-10">{children}</div>
    </div>
  )
}
