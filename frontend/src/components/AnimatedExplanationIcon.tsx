import styles from "./DocumentExplanationReadyState.module.css";

export type ExplanationIconName = "file" | "checks" | "calendar";

type AnimatedExplanationIconProps = {
  name: ExplanationIconName;
  active: boolean;
};

export function AnimatedExplanationIcon({
  name,
  active,
}: AnimatedExplanationIconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      data-active={active}
      className={`${styles.icon} size-1/4 min-h-[20px] min-w-[20px] text-primary`}
    >
      {name === "file" && (
        <>
          <path
            pathLength="1"
            className={styles.stroke}
            style={{ animationDuration: "280ms" }}
            d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"
          />
          <path
            pathLength="1"
            className={`${styles.stroke} ${styles.fold}`}
            d="m14 2 6 6h-4a2 2 0 0 1-2-2V2Z"
          />
          {[12, 16, 19].map((y, index) => (
            <path
              key={y}
              pathLength="1"
              className={styles.stroke}
              style={{ animationDelay: `${400 + index * 100}ms` }}
              d={`M8 ${y}h${index === 2 ? 5 : 8}`}
            />
          ))}
        </>
      )}
      {name === "checks" && (
        <>
          {[6, 12, 18].map((y, index) => (
            <path
              key={y}
              pathLength="1"
              className={styles.stroke}
              style={{ animationDelay: `${index * 120}ms` }}
              d={`M9 ${y}h11`}
            />
          ))}
          {[6, 12].map((y, index) => (
            <path
              key={y}
              pathLength="1"
              className={styles.stroke}
              style={{
                animationDelay: `${400 + index * 240}ms`,
                animationDuration: "260ms",
              }}
              d={`m2 ${y - 1} 2 2 3-4`}
            />
          ))}
          <circle cx="4" cy="18" r="0.65" fill="currentColor" stroke="none" />
        </>
      )}
      {name === "calendar" && (
        <>
          <path
            pathLength="1"
            className={styles.stroke}
            d="M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
          />
          {Array.from({ length: 6 }, (_, index) => (
            <circle
              key={index}
              cx={8 + (index % 3) * 4}
              cy={index < 3 ? 14 : 18}
              r="0.85"
              fill="currentColor"
              stroke="none"
              className={`${styles.date} ${index === 5 ? styles.lastDate : ""}`}
              style={
                index === 5
                  ? undefined
                  : { animationDelay: `${240 + index * 65}ms` }
              }
            />
          ))}
        </>
      )}
    </svg>
  );
}
