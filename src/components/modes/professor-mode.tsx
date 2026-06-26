import { useState } from "react"
import { motion } from "motion/react"

const MODULES = [
  {
    title: "Notice & Service",
    image:
      "https://images.beta.cosmos.so/5b21c112-ed1d-45cd-baf0-38186a15af8e?format=jpeg",
    body:
      "Learn notice timing, delivery rules, proof of service, and common drafting mistakes in landlord-tenant and contract disputes.",
  },
  {
    title: "Contract Reading",
    image:
      "https://images.beta.cosmos.so/edbff8cc-d188-4fd3-98f2-2e0782b24ff6?format=jpeg",
    body:
      "Train clause spotting: termination, cure, jurisdiction, indemnity, effective date, and remedy language.",
  },
  {
    title: "Court Filing Basics",
    image:
      "https://images.beta.cosmos.so/4bd00d89-3449-40e3-b9b2-2f2e2f4dcdb9?format=jpeg",
    body:
      "Study filing structure, exhibit handling, motion flow, and how facts become concise procedural narrative.",
  },
]

function ProfessorCard({
  title,
  image,
  body,
}: {
  title: string
  image: string
  body: string
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div
      className="relative h-[350px] w-[290px] overflow-hidden rounded-2xl bg-black"
      onClick={() => setIsOpen((open) => !open)}
    >
      <motion.img
        src={image}
        alt={title}
        className="pointer-events-none h-full w-full select-none object-cover"
        animate={isOpen ? { scale: 1.08, filter: "blur(3px)" } : { scale: 1, filter: "blur(0px)" }}
        transition={{ type: "spring", stiffness: 26.7, damping: 4.1, mass: 0.2 }}
      />

      <motion.div
        className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-zinc-900 px-4 pt-3 text-white"
        animate={isOpen ? { y: 0 } : { y: 128 }}
        transition={{ type: "spring", stiffness: 26.7, damping: 4.1, mass: 0.2 }}
      >
        <button type="button" className="w-full pb-3 text-left text-[14px] font-medium">
          {title}
        </button>
        <div className="pb-4 text-[13px] text-zinc-300">
          <p className="line-clamp-4">{body}</p>
          <button
            type="button"
            className="mt-3 w-full rounded-[6px] border border-zinc-700 bg-zinc-900 px-4 py-1 text-zinc-50 transition-colors duration-300 hover:bg-zinc-800"
          >
            Study module
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export function ProfessorMode() {
  return (
    <div className="flex flex-1 flex-col bg-[#f4f5f7] px-6 py-6">
      <div className="mx-auto w-full max-w-6xl">
        <div className="max-w-xl">
          <p className="text-[0.68rem] font-semibold tracking-[0.18em] text-[#374151] uppercase">
            Study Modules
          </p>
          <h2 className="mt-3 text-[1.45rem] font-semibold tracking-[-0.03em] text-[#111827]">
            Learn legal workflow step by step.
          </h2>
          <p className="mt-2 text-[0.86rem] leading-6 text-[#4b5563]">
            Open module. Read core rule. Study patterns before drafting.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-5">
          {MODULES.map((module) => (
            <ProfessorCard key={module.title} {...module} />
          ))}
        </div>
      </div>
    </div>
  )
}
