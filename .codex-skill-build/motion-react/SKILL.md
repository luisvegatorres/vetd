---
name: motion-react
description: >
  Use this skill whenever the user wants to add, review, or refine animations in a React project with Motion.
  Trigger on requests involving animation, motion, transition, hover effects, tap feedback, scroll reveals,
  page transitions, entrance and exit states, layout animation, drag gestures, AnimatePresence, useScroll,
  useInView, or useReducedMotion. Use it for React and Next.js projects that rely on Motion and for component
  systems built with Base UI primitives where animated open and close behavior, overlays, popups, or interactive
  feedback must be implemented without breaking accessibility or composition.
---

# Motion for React

## Overview

Use `motion/react` as the default animation layer for React UI. Favor small, intentional animations that improve state changes, hierarchy, and interaction feedback without fighting layout, accessibility, or existing component abstractions.

## Workflow

### 1. Confirm the runtime boundary

- Import from `motion/react`, not legacy Framer Motion paths.
- In Next.js App Router, any component using Motion hooks, `AnimatePresence`, pointer handlers, or animated local state must be a client component.
- Keep server components static when possible; move animated leaves into small client components instead of converting large trees unnecessarily.

```tsx
"use client"

import { AnimatePresence, motion, useReducedMotion } from "motion/react"
```

### 2. Pick the right animation model

- `initial` + `animate`: enter and state transitions.
- `exit` + `AnimatePresence`: unmount and route transitions.
- `whileHover`, `whileTap`, `whileFocus`, `drag`: direct interaction feedback.
- `layout`, `layoutId`: size and position changes.
- `whileInView`, `useInView`, `useScroll`: scroll-triggered or scroll-linked motion.
- `useAnimate`: imperative sequences when declarative props become awkward.

### 3. Prefer sane defaults

- Animate `opacity`, `transform`, `filter`, or `clipPath` before layout-affecting properties.
- Use springs for physical movement like `x`, `y`, `scale`, and `rotate`.
- Use tweens for `opacity`, `color`, and short UI fades.
- Keep most UI transitions in the `0.18s` to `0.45s` range.
- Preserve the product's visual language. Motion should reinforce the interface, not become the interface.

### 4. Respect accessibility

- Check `useReducedMotion()` for custom sequences or large transforms.
- Keep reduced-motion fallbacks immediate or nearly immediate instead of removing state feedback entirely.
- Avoid motion that obscures focus, traps users, or makes pointer targets move unpredictably.

### 5. Integrate with Base UI carefully

- Base UI is not Radix. Do not assume Radix APIs, attributes, or examples map directly.
- First inspect the specific primitive or wrapper being used in the repo.
- If the primitive controls open and close state internally, hoist that state when you need exit animations.
- If the primitive unmounts content immediately, keep it mounted long enough for exit motion to complete.
- Animate the shell you own: overlay, popup container, panel wrapper, or trigger wrapper. Avoid forcing Motion into a primitive in a way that breaks refs, focus management, or keyboard behavior.
- If a component already uses CSS open and close classes, remove conflicting keyframes before layering Motion on top.

## Core Patterns

### Enter animation

```tsx
<motion.div
  initial={{ opacity: 0, y: 16 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
/>
```

### Gesture feedback

```tsx
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  transition={{ type: "spring", stiffness: 420, damping: 30 }}
/>
```

Use Motion gestures instead of CSS-only hover transforms when the component also needs touch-friendly tap feedback.

### Exit animation

```tsx
<AnimatePresence mode="wait" initial={false}>
  {open ? (
    <motion.div
      key="panel"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2 }}
    />
  ) : null}
</AnimatePresence>
```

Always give the animated child a stable `key`.

### Layout animation

```tsx
<motion.div layout transition={{ type: "spring", stiffness: 380, damping: 34 }} />
```

Reach for `layout` when cards, filters, accordions, or list items change size or position and should move smoothly rather than snap.

### Scroll reveal

```tsx
<motion.section
  initial={{ opacity: 0, y: 24 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-10% 0px" }}
  transition={{ duration: 0.4 }}
/>
```

Use `once: true` for content that should not replay every time it re-enters the viewport.

### Scroll-linked values

```tsx
import { motion, useScroll, useTransform } from "motion/react"

function ProgressBar() {
  const { scrollYProgress } = useScroll()
  const opacity = useTransform(scrollYProgress, [0, 0.1], [0, 1])

  return <motion.div style={{ scaleX: scrollYProgress, opacity }} />
}
```

## Next.js Guidance

### Client boundaries

- Add `"use client"` at the top of any file that uses Motion hooks or animated interactivity.
- Do not convert an entire route segment to a client component just to animate one child.
- Keep route-level transitions isolated in small wrappers.

### App Router page transitions

Use `AnimatePresence mode="wait"` around the route shell you control. When exit transitions fight App Router rendering, freeze the outgoing subtree instead of dropping the transition entirely.

```tsx
<AnimatePresence mode="wait" initial={false}>
  <motion.main
    key={pathname}
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 12 }}
    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.main>
</AnimatePresence>
```

### Server and client split

- Data fetching, SEO, and static layout stay on the server.
- Motion wrappers, interactive reveals, and presence-based transitions live in client components.

## Base UI Patterns

### Animate owned wrappers first

When a Base UI primitive already handles behavior correctly, animate a wrapper around the content rather than rewriting the primitive itself.

```tsx
<AnimatePresence>
  {open ? (
    <motion.div
      key="overlay"
      className="fixed inset-0 bg-black/40"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    />
  ) : null}
</AnimatePresence>
```

### Hoist open state for exits

If popup content disappears before Motion can play the exit, move `open` into React state and conditionally render the animated popup yourself.

```tsx
function AnimatedPopup() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button onClick={() => setOpen(true)}>Open</button>
      <AnimatePresence>
        {open ? (
          <motion.div
            key="popup"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.18 }}
          />
        ) : null}
      </AnimatePresence>
    </>
  )
}
```

### Do not stack CSS and Motion blindly

If a Base UI wrapper already includes `data-open:animate-in`, `data-closed:animate-out`, `zoom-in`, or slide keyframes, remove or neutralize them before adding Motion-based entry and exit animation. Two animation systems on the same element usually produce muddy timing and broken exits.

## Common Recipes

### Animated button wrapper

```tsx
import { motion } from "motion/react"

const MotionButton = motion.button

<MotionButton
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  transition={{ type: "spring", stiffness: 420, damping: 28 }}
  className={className}
>
  {children}
</MotionButton>
```

Use this pattern when you own the rendered element. If the design system button already forwards props and refs correctly, integrate Motion at that layer instead of wrapping it multiple times.

### Staggered reveal

```tsx
const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
}

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
}

<motion.ul variants={container} initial="hidden" animate="show">
  {items.map((itemValue) => (
    <motion.li key={itemValue} variants={item}>
      {itemValue}
    </motion.li>
  ))}
</motion.ul>
```

Use stagger for small groups only. Large lists should usually use simpler fades or no animation.

### Reduced motion fallback

```tsx
const shouldReduceMotion = useReducedMotion()

<motion.div
  initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
  animate={{ opacity: 1, y: 0 }}
  transition={shouldReduceMotion ? { duration: 0.01 } : { duration: 0.24 }}
/>
```

## Review Checklist

When reviewing or adding Motion in a React codebase, check for these issues:

- Missing `"use client"` in a component using Motion hooks or presence.
- `AnimatePresence` present but no stable `key` on the exiting child.
- Exit animations defined on elements that unmount before they can play.
- Simultaneous CSS keyframes and Motion transforms on the same element.
- Layout thrash from animating `height`, `top`, `left`, or large box-shadow values when `transform` would work.
- Excessive animation on every list item, card, and section with no hierarchy.
- Missing reduced-motion handling for large movements or parallax.
- Presence or layout animation applied so high in the tree that it causes unnecessary rerenders.

## Default Advice

- Start with one high-value animation, not five medium ones.
- Use Motion to clarify state changes, spatial relationships, and interaction feedback.
- If the project already has a design system, preserve its visual language and token usage.
- For Base UI projects, treat accessibility and composition as fixed constraints. Animate around them, not through them.
