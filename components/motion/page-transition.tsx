"use client"

import { useContext, useEffect, useRef } from "react"
import { useSelectedLayoutSegment } from "next/navigation"
import { LayoutRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime"
import { AnimatePresence, motion } from "motion/react"

/* ------------------------------------------------------------------ */
/*  FrozenRouter – freezes the router context during exit animations   */
/*  so the outgoing page keeps rendering its old content.              */
/* ------------------------------------------------------------------ */

function usePreviousValue<T>(value: T): T | undefined {
  const prev = useRef<T>(undefined)
  useEffect(() => {
    prev.current = value
    return () => {
      prev.current = undefined
    }
  })
  // This hook intentionally exposes the previous committed value.
  // eslint-disable-next-line react-hooks/refs
  return prev.current
}

function FrozenRouter({ children }: { children: React.ReactNode }) {
  const context = useContext(LayoutRouterContext)
  const prevContext = usePreviousValue(context) || null

  const segment = useSelectedLayoutSegment()
  const prevSegment = usePreviousValue(segment)

  const changed =
    segment !== prevSegment &&
    segment !== undefined &&
    prevSegment !== undefined

  return (
    <LayoutRouterContext.Provider value={changed ? prevContext! : context}>
      {children}
    </LayoutRouterContext.Provider>
  )
}

/* ------------------------------------------------------------------ */
/*  PageTransition                                                     */
/* ------------------------------------------------------------------ */

export function PageTransition({ children }: { children: React.ReactNode }) {
  const segment = useSelectedLayoutSegment()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={segment}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{
          duration: 0.35,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <FrozenRouter>{children}</FrozenRouter>
      </motion.div>
    </AnimatePresence>
  )
}
