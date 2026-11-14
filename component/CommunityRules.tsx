import {
  COMMUNITY_RULES,
  COMMUNITY_RULES_INTRO,
  ENFORCEMENT_STEPS,
} from "@/lib/community-rules";

// The community rules as a list of emoji tiles, then what happens when
// they're broken. Sits under an h1: the /rules page and the signup form's
// rules view both render it.
export default function CommunityRules() {
  return (
    <div className="flex flex-col gap-6 text-sm">
      <p className="text-ink-soft">{COMMUNITY_RULES_INTRO}</p>
      <ol className="flex flex-col divide-y-[1.5px] divide-dashed divide-edge">
        {COMMUNITY_RULES.map((rule) => (
          <li key={rule.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
            <span
              aria-hidden="true"
              className="flex size-9 shrink-0 items-center justify-center rounded-lg border-[1.5px] border-butter-edge bg-butter text-lg"
            >
              {rule.emoji}
            </span>
            <div className="min-w-0">
              <h3 className="font-display text-base font-semibold">{rule.title}</h3>
              <p className="mt-0.5 text-ink-soft">{rule.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <section
        aria-labelledby="rules-enforcement"
        className="rounded-xl border-[1.5px] border-dashed border-edge-strong bg-cream p-4"
      >
        <h2 id="rules-enforcement" className="font-display text-lg font-semibold">
          ถ้ามีคนทำผิดกติกา
        </h2>
        <ol className="mt-3 flex flex-col gap-3">
          {ENFORCEMENT_STEPS.map((step, index) => (
            <li key={step.title} className="flex gap-3">
              <span
                aria-hidden="true"
                className="flex size-7 shrink-0 items-center justify-center rounded-full border-[1.5px] border-ink bg-kmutt-yellow font-display text-sm font-semibold shadow-sticker"
              >
                {index + 1}
              </span>
              <p className="min-w-0 text-ink-soft">
                <span className="font-semibold text-ink">{step.title}</span>{" "}
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
