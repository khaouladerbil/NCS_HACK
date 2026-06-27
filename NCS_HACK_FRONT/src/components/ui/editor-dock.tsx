import { motion } from "motion/react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

type DockItem = {
  id: string
  label: string
  icon: LucideIcon
  onClick: () => void
  active?: boolean
}

type EditorDockProps = {
  items: DockItem[]
  className?: string
}

export function EditorDock({ items, className }: EditorDockProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-black bg-white/95 p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.14)] backdrop-blur",
        className
      )}
    >
      {items.map((item) => {
        const Icon = item.icon

        return (
          <motion.button
            key={item.id}
            type="button"
            whileHover={{ y: -4, scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: "spring", stiffness: 420, damping: 24 }}
            onClick={item.onClick}
            className={cn(
              "inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors",
              item.active
                ? "bg-black text-white"
                : "text-black hover:bg-black hover:text-white"
            )}
            aria-label={item.label}
            title={item.label}
          >
            <Icon className="size-4" />
          </motion.button>
        )
      })}
    </div>
  )
}
