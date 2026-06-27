import { cloneElement, useEffect, useMemo, useRef, useState } from "react"
import { motion, type Transition } from "motion/react"

import { cn } from "@/lib/utils"

type AnimatedBackgroundProps = {
  children: React.ReactNode
  className?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  transition?: Transition
  enableHover?: boolean
}

export function AnimatedBackground({
  children,
  className,
  defaultValue,
  onValueChange,
  transition,
  enableHover = false,
}: AnimatedBackgroundProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const items = useMemo(() => {
    return Array.isArray(children) ? children : [children]
  }, [children])
  const fallbackValue = useMemo(() => {
    const firstChild = items.find(
      (child): child is React.ReactElement<{ "data-id"?: string }> =>
        !!child && typeof child === "object" && "props" in child
    )

    return firstChild?.props["data-id"] ?? "item-0"
  }, [items])
  const [activeValue, setActiveValue] = useState(defaultValue ?? fallbackValue)
  const [hoveredValue, setHoveredValue] = useState<string | null>(null)
  const [indicator, setIndicator] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  })
  const currentValue = hoveredValue ?? activeValue

  // Only sync from parent when defaultValue actually changes
  useEffect(() => {
    if (defaultValue !== undefined) {
      setActiveValue(defaultValue)
    }
  }, [defaultValue])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const activeElement = container.querySelector<HTMLElement>(
      `[data-id="${CSS.escape(currentValue)}"]`
    )

    if (!activeElement) return

    // Use getBoundingClientRect so position is relative to container, not offsetParent
    const containerRect = container.getBoundingClientRect()
    const elementRect = activeElement.getBoundingClientRect()
    setIndicator({
      left: elementRect.left - containerRect.left,
      top: elementRect.top - containerRect.top,
      width: elementRect.width,
      height: elementRect.height,
    })
  }, [currentValue, children])

  return (
    <div ref={containerRef} className="relative flex items-center gap-1">
      <motion.div
        aria-hidden="true"
        className={cn("absolute", className)}
        animate={indicator}
        transition={
          transition ?? {
            type: "spring",
            bounce: 0.2,
            duration: 0.3,
          }
        }
      />
      {items.map((child, index) => {
        if (!child || typeof child !== "object" || !("props" in child)) {
          return child
        }

        const element = child as React.ReactElement<{
          "data-id"?: string
          "data-checked"?: boolean
          className?: string
          onClick?: () => void
          onMouseEnter?: () => void
          onMouseLeave?: () => void
        }>
        const id = element.props["data-id"] ?? `tab-${index}`
        const checked = activeValue === id

        return (
          <div key={id} className="z-10">
            {cloneElement(element as React.ReactElement<any>, {
              "data-id": id,
              "data-checked": checked,
              onMouseEnter: () => {
                if (enableHover) setHoveredValue(id)
                element.props.onMouseEnter?.()
              },
              onMouseLeave: () => {
                if (enableHover) setHoveredValue(null)
                element.props.onMouseLeave?.()
              },
              onClick: () => {
                setActiveValue(id)
                onValueChange?.(id)
                element.props.onClick?.()
              },
            })}
          </div>
        )
      })}
    </div>
  )
}
