import { AnimatedBackground } from "@/components/core/animated-background"
import { TextEffect } from "@/components/core/text-effect"

const ITEMS = [
  {
    id: 1,
    title: "Notice Rules",
    description: "Service timing, delivery method, proof, common failure points.",
  },
  {
    id: 2,
    title: "Contract Reading",
    description: "Spot termination, cure, venue, indemnity, remedy language fast.",
  },
  {
    id: 3,
    title: "Filing Structure",
    description: "See how facts, exhibits, claims, procedure stack into one brief.",
  },
  {
    id: 4,
    title: "Citation Method",
    description: "Match rule, quote, authority, footnote without losing flow.",
  },
  {
    id: 5,
    title: "Issue Framing",
    description: "Turn messy timeline into tight legal questions worth answering.",
  },
  {
    id: 6,
    title: "Revision Passes",
    description: "Cut noise, tighten logic, preserve authority, improve final draft.",
  },
]

export function ProfessorMode() {
  return (
    <div className="flex flex-1 flex-col bg-[#f4f5f7] px-6 py-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="max-w-2xl">
          <p className="text-[0.68rem] font-semibold tracking-[0.18em] text-[#374151] uppercase">
            Professor
          </p>
          <h2 className="mt-3 text-[1.55rem] font-semibold tracking-[-0.03em] text-[#111827]">
            <TextEffect per="word" preset="fade">
              Learn legal workflow step by step.
            </TextEffect>
          </h2>
          <p className="mt-2 max-w-xl text-[0.9rem] leading-6 text-[#4b5563]">
            <TextEffect per="word" preset="fade">
              Open module. Read rule. See pattern. Draft better.
            </TextEffect>
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <AnimatedBackground
            className="col-span-full grid gap-4 rounded-[1.75rem] bg-[#eef2f7] p-3 md:grid-cols-2 xl:grid-cols-3"
            transition={{
              type: "spring",
              bounce: 0.2,
              duration: 0.6,
            }}
            enableHover
          >
            {ITEMS.map((item, index) => (
              <div key={item.id} data-id={`card-${index}`}>
                <button
                  type="button"
                  className="flex h-full w-full select-none flex-col rounded-[1.2rem] border border-transparent p-5 text-left"
                >
                  <span className="text-[0.68rem] font-semibold tracking-[0.14em] text-[#6b7280] uppercase">
                    Module {String(item.id).padStart(2, "0")}
                  </span>
                  <h3 className="mt-3 text-[1.02rem] font-medium text-[#111827]">
                    <TextEffect per="word" preset="fade">
                      {item.title}
                    </TextEffect>
                  </h3>
                  <p className="mt-2 text-[0.9rem] leading-6 text-[#4b5563]">
                    <TextEffect per="word" preset="fade">
                      {item.description}
                    </TextEffect>
                  </p>
                </button>
              </div>
            ))}
          </AnimatedBackground>
        </div>
      </div>
    </div>
  )
}
