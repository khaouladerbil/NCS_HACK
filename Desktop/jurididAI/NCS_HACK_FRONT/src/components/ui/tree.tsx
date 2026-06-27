"use client"

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from "react"
import { ChevronRight } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"

import { cn } from "@/lib/utils"

type TreeContextValue = {
  level: number
  defaultExpandedKeys: Set<string>
}

const TreeContext = createContext<TreeContextValue>({
  level: 0,
  defaultExpandedKeys: new Set<string>(),
})

export function Tree({
  children,
  className,
  defaultExpandedKeys = [],
  ...props
}: HTMLAttributes<HTMLDivElement> & { defaultExpandedKeys?: string[] }) {
  const value = useMemo<TreeContextValue>(
    () => ({ level: 0, defaultExpandedKeys: new Set(defaultExpandedKeys) }),
    [defaultExpandedKeys]
  )

  return (
    <TreeContext.Provider value={value}>
      <div role="tree" className={cn("space-y-1", className)} {...props}>
        {children}
      </div>
    </TreeContext.Provider>
  )
}

type TreeItemProps = {
  id: string
  title: ReactNode
  children?: ReactNode
  className?: string
  contentClassName?: string
  expanded?: boolean
  defaultExpanded?: boolean
  onExpandedChange?: (expanded: boolean) => void
}

export function TreeItem({
  id,
  title,
  children,
  className,
  contentClassName,
  expanded,
  defaultExpanded = false,
  onExpandedChange,
}: TreeItemProps) {
  const { level, defaultExpandedKeys } = useContext(TreeContext)
  const [localExpanded, setLocalExpanded] = useState(
    defaultExpanded || defaultExpandedKeys.has(id)
  )
  const hasChildren = Boolean(children)
  const isExpanded = expanded ?? localExpanded

  function setExpanded(next: boolean) {
    if (expanded === undefined) setLocalExpanded(next)
    onExpandedChange?.(next)
  }

  return (
    <div
      role="treeitem"
      aria-expanded={hasChildren ? isExpanded : undefined}
      aria-level={level + 1}
      data-expanded={isExpanded}
      className={cn("space-y-1", className)}
    >
      <div className="flex items-start gap-1">
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setExpanded(!isExpanded)}
            className="mt-1 inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[#6b7280] transition hover:bg-[#eef2f7] hover:text-[#111827]"
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            <ChevronRight
              className={cn(
                "size-3.5 transition-transform duration-200",
                isExpanded && "rotate-90"
              )}
            />
          </button>
        ) : (
          <span className="mt-1 block size-5 shrink-0" aria-hidden="true" />
        )}
        <div className="min-w-0 flex-1">{title}</div>
      </div>

      <AnimatePresence initial={false}>
        {hasChildren && isExpanded ? (
          <motion.div
            key={id}
            initial={{ opacity: 0, height: 0, y: -4 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -4 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <TreeContext.Provider
              value={{ level: level + 1, defaultExpandedKeys }}
            >
              <div className={cn("pl-5", contentClassName)}>{children}</div>
            </TreeContext.Provider>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
