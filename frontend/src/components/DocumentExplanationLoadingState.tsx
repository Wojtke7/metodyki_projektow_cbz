import {
  animate,
  motion,
  useMotionValue,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useEffect, useSyncExternalStore } from "react";

import avatar from "@/assets/prostefakty-avatar.svg";
import {
  penKeyframes,
  writingStrokes,
  WRITING_DURATION_SECONDS,
  type WritingStroke,
} from "@/lib/writing-animation";

function subscribeToReducedMotion(onChange: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function WritingLine({
  stroke,
  progress,
  reducedMotion,
}: {
  stroke: WritingStroke;
  progress: MotionValue<number>;
  reducedMotion: boolean;
}) {
  const length = useTransform(progress, [stroke.start, stroke.end], [0, 1]);
  const opacity = useTransform(progress, (value) => {
    if (value <= stroke.start) return 0;
    return value < 0.94 ? 1 : Math.max(0, (1 - value) / 0.06);
  });

  return (
    <motion.path
      d={stroke.path}
      stroke="currentColor"
      strokeWidth={stroke.width}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        pathLength: reducedMotion ? 1 : length,
        opacity: reducedMotion ? 1 : opacity,
      }}
    />
  );
}

export function DocumentExplanationLoadingState() {
  const reducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => true,
  );
  const progress = useMotionValue(0);
  const penX = useTransform(progress, penKeyframes.times, penKeyframes.x);
  const penY = useTransform(progress, penKeyframes.times, penKeyframes.y);
  const start = writingStrokes[0].points[0];

  useEffect(() => {
    if (reducedMotion) return;
    progress.set(0);
    const animation = animate(progress, 1, {
      duration: WRITING_DURATION_SECONDS,
      ease: "linear",
      repeat: Infinity,
    });
    return () => animation.stop();
  }, [progress, reducedMotion]);

  return (
    <section
      aria-label="Przygotowywanie wyjaśnień dokumentów"
      className="flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center gap-[24px] overflow-y-auto p-[24px] lg:p-[32px]"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 300 200"
        fill="none"
        className="w-full max-w-[300px] overflow-visible rounded-[16px] text-primary"
      >
        {writingStrokes.map((stroke) => (
          <WritingLine
            key={stroke.start}
            stroke={stroke}
            progress={progress}
            reducedMotion={reducedMotion}
          />
        ))}
        <motion.g
          style={{
            x: reducedMotion ? start.x : penX,
            y: reducedMotion ? start.y : penY,
          }}
        >
          <g transform="rotate(-18)">
            {/* Anchor the avatar's nib tip to the writing position. */}
            <image
              href={avatar}
              x={-(102 / 210) * 20}
              y={-(824 / 840) * 80}
              width="20"
              height="80"
            />
          </g>
        </motion.g>
      </svg>
      <div className="text-center">
        <h2 role="status" className="text-[20px] sm:text-[24px]">
          Wyjaśniam dokumenty…
        </h2>
        <p className="mt-[8px] text-[14px] leading-relaxed text-muted-foreground">
          Za chwilę zobaczysz najważniejsze informacje.
        </p>
      </div>
    </section>
  );
}
