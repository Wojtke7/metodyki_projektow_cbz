import { MessagesSquare } from "lucide-react";
import { useState } from "react";

import {
  AnimatedExplanationIcon,
  type ExplanationIconName,
} from "@/components/AnimatedExplanationIcon";

import styles from "./DocumentExplanationReadyState.module.css";

const explanationDetails = [
  {
    icon: "file",
    arc: { x: 100, length: 0.36, offset: -0.07, expandedOffset: 0.025 },
    title: "Proste wyjaśnienie",
    description: "Najważniejsze informacje z dokumentów.",
  },
  {
    icon: "checks",
    arc: { x: 300, length: 0.29, offset: -0.605, expandedOffset: -0.51 },
    title: "Kolejne kroki",
    description: "Co trzeba zrobić dalej.",
  },
  {
    icon: "calendar",
    arc: { x: 500, length: 0.29, offset: -0.105, expandedOffset: -0.01 },
    title: "Ważne terminy",
    description: "Na co zwrócić uwagę.",
  },
] as const;

export function DocumentExplanationReadyState() {
  const [hoveredIcon, setHoveredIcon] = useState<ExplanationIconName | null>(
    null,
  );
  const [focusedIcon, setFocusedIcon] = useState<ExplanationIconName | null>(
    null,
  );

  return (
    <section
      aria-labelledby="document-explanation-title"
      className="@container flex shrink-0 flex-col items-center border-t px-[16px] py-[32px] sm:px-[24px] lg:min-w-0 lg:flex-1 lg:overflow-y-auto lg:border-t-0 lg:p-[32px]"
    >
      <div className="my-auto w-full max-w-[760px] shrink-0 text-center">
        <MessagesSquare
          aria-hidden="true"
          className="mx-auto mb-[20px] size-[40px] text-primary"
        />
        <h2
          id="document-explanation-title"
          className="mx-auto max-w-[460px] text-[20px] leading-snug sm:text-[24px]"
        >
          Dokumenty gotowe do wyjaśnienia
        </h2>
        <p className="mx-auto mt-[12px] max-w-[480px] text-[14px] leading-relaxed text-muted-foreground sm:text-[16px]">
          Kliknij „Wyjaśnij dokumenty”, aby dowiedzieć się, co oznaczają
          przesłane pisma.
        </p>
        <div className="relative mx-auto mt-[32px] flex w-full max-w-[444px]">
          <svg
            aria-hidden="true"
            viewBox="0 0 600 200"
            fill="none"
            className="pointer-events-none absolute inset-x-0 top-0 w-full overflow-visible"
          >
            <path
              d="M22 38 A100 100 0 0 1 200 100 A100 100 0 0 0 400 100 A100 100 0 0 1 578 38"
              stroke="var(--border)"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
            {explanationDetails.map(({ icon, arc }) => {
              const active = hoveredIcon === icon || focusedIcon === icon;
              const length = active ? arc.length + 0.19 : arc.length;

              return (
                <circle
                  key={icon}
                  cx={arc.x}
                  cy="100"
                  r="100"
                  pathLength="1"
                  stroke="var(--primary)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  className={styles.arc}
                  style={{
                    strokeDasharray: `${length} ${1 - length}`,
                    strokeDashoffset: active ? arc.expandedOffset : arc.offset,
                  }}
                />
              );
            })}
          </svg>
          {explanationDetails.map(({ icon, title }) => (
            <div
              key={title}
              role="img"
              aria-label={title}
              tabIndex={0}
              onPointerEnter={(event) => {
                if (event.pointerType === "mouse") setHoveredIcon(icon);
              }}
              onPointerLeave={() => setHoveredIcon(null)}
              onFocus={() => setFocusedIcon(icon)}
              onBlur={() => setFocusedIcon(null)}
              className="relative flex aspect-square min-w-0 flex-1 items-center justify-center rounded-full outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              <div className="flex size-4/5 items-center justify-center rounded-full bg-muted/60">
                <AnimatedExplanationIcon
                  name={icon}
                  active={hoveredIcon === icon || focusedIcon === icon}
                />
              </div>
            </div>
          ))}
        </div>
        <ul className="mx-auto mt-[24px] grid w-full max-w-[580px] grid-cols-1 gap-[24px] @[400px]:grid-cols-3 @[400px]:gap-[16px]">
          {explanationDetails.map(({ title, description }) => (
            <li key={title} className="mx-auto w-full min-w-0 max-w-[240px]">
              <h3 className="text-[16px] leading-[24px] @[600px]:text-[18px] @[600px]:leading-[26px]">
                {title}
              </h3>
              <p className="mt-[8px] text-[15px] leading-[24px] text-muted-foreground">
                {description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
