"use client"

import * as React from "react"
import { ReactLenis } from "lenis/react"

export function LenisProvider({ children }: { children: React.ReactNode }) {
  const reduce = usePrefersReducedMotion()

  if (reduce) {
    return <>{children}</>
  }

  return (
    <ReactLenis
      root
      options={{
        lerp: 0.1,
        smoothWheel: true,
        syncTouch: false,
      }}
    >
      {children}
    </ReactLenis>
  )
}

function usePrefersReducedMotion() {
  const [reduce, setReduce] = React.useState(false)

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setReduce(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  return reduce
}
