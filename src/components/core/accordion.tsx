import { createContext, useContext, useMemo, useState } from "react"
import { AnimatePresence, motion } from "motion/react"

import { cn } from "@/lib/utils"

type AccordionContextValue = {
  expandedValues: Set<string>
  toggleValue: (value: string) => void
}

const AccordionContext = createContext<AccordionContextValue | null>(null)

function useAccordion() {
  const context = useContext(AccordionContext)
  if (!context) {
    throw new Error("Accordion components must be used within Accordion.")
  }

  return context
}

type AccordionProps = {
  children: React.ReactNode
  className?: string
  defaultValue?: string[]
}

export function Accordion({
  children,
  className,
  defaultValue = [],
}: AccordionProps) {
  const [expandedValues, setExpandedValues] = useState(new Set(defaultValue))

  const value = useMemo(
    () => ({
      expandedValues,
      toggleValue: (nextValue: string) => {
        setExpandedValues((prev) => {
          const next = new Set(prev)
          if (next.has(nextValue)) {
            next.delete(nextValue)
          } else {
            next.add(nextValue)
          }
          return next
        })
      },
    }),
    [expandedValues]
  )

  return (
    <AccordionContext.Provider value={value}>
      <div className={cn("flex w-full flex-col", className)}>{children}</div>
    </AccordionContext.Provider>
  )
}

type AccordionItemProps = {
  value: string
  children: React.ReactNode
  className?: string
}

export function AccordionItem({
  value,
  children,
  className,
}: AccordionItemProps) {
  const { expandedValues } = useAccordion()
  const expanded = expandedValues.has(value)

  return (
    <div
      data-expanded={expanded}
      className={cn("group", className)}
    >
      {children}
    </div>
  )
}

type AccordionTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  value: string
}

export function AccordionTrigger({
  value,
  className,
  children,
  ...props
}: AccordionTriggerProps) {
  const { expandedValues, toggleValue } = useAccordion()
  const expanded = expandedValues.has(value)

  return (
    <button
      type="button"
      data-expanded={expanded}
      className={cn("group w-full", className)}
      onClick={() => toggleValue(value)}
      {...props}
    >
      {children}
    </button>
  )
}

type AccordionContentProps = {
  value: string
  children: React.ReactNode
  className?: string
}

export function AccordionContent({
  value,
  children,
  className,
}: AccordionContentProps) {
  const { expandedValues } = useAccordion()
  const expanded = expandedValues.has(value)

  return (
    <AnimatePresence initial={false}>
      {expanded ? (
        <motion.div
          key={value}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          <div className={cn(className)}>{children}</div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
