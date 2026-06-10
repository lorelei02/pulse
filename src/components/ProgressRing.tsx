import { ReactNode } from "react";

type ProgressRingProps = {
  progress: number;
  size: number;
  children: ReactNode;
};

export function ProgressRing({ progress, size, children }: ProgressRingProps) {
  const strokeWidth = 6;
  const radius = size / 2 - strokeWidth * 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - progress * circumference;

  return (
    <div className="progress-ring-wrap" style={{ width: size, height: size }}>
      <svg className="ring-svg" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle className="ring-bg outer" cx={size / 2} cy={size / 2} r={radius + 10} />
        <circle className="ring-bg" cx={size / 2} cy={size / 2} r={radius} />
        <circle
          className="ring-progress"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>

      <div className="ring-content">{children}</div>
    </div>
  );
}
