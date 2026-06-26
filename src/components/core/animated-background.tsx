import { cloneElement, useEffect, useMemo, useRef, useState } from "react"
import { motion } from "motion/react"

import { cn } from "@/lib/utils"

type AnimatedBackgroundProps = {
  children: React.ReactNode
  className?: string
  defaultValue: string
  onValueChange?: (value: string) => void
}

export function AnimatedBackground({
  children,
  className,
  defaultValue,
  onValueChange,
}: AnimatedBackgroundProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [activeValue, setActiveValue] = useState(defaultValue)
  const [indicator, setIndicator] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  })

  useEffect(() => {
    setActiveValue(defaultValue)
  }, [defaultValue])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const activeElement = container.querySelector<HTMLElement>(
      `[data-id="${CSS.escape(activeValue)}"]`
    )

    if (!activeElement) return

    setIndicator({
      left: activeElement.offsetLeft,
      top: activeElement.offsetTop,
      width: activeElement.offsetWidth,
      height: activeElement.offsetHeight,
    })
  }, [activeValue, children])

  const items = useMemo(() => {
    return Array.isArray(children) ? children : [children]
  }, [children])

  return (
    <div ref={containerRef} className="relative flex items-center gap-1">
      <motion.div
        aria-hidden="true"
        className={cn("absolute", className)}
        animate={indicator}
        transition={{
          type: "spring",
          bounce: 0.2,
          duration: 0.3,
        }}
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
        }>
        const id = element.props["data-id"] ?? `tab-${index}`
        const checked = activeValue === id

        return (
          <div key={id} className="relative z-10">
            {cloneElement(element as React.ReactElement<any>, {
              "data-id": id,
              "data-checked": checked,
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
