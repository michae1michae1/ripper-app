import { cn } from "@/lib/cn";

interface TimerDisplayProps {
  minutes: number;
  seconds: number;
  size?: "md" | "lg" | "xl";
  isExpired?: boolean;
}

// Base sizes with mobile responsiveness
// xl: 12rem on desktop, 5rem on mobile (portrait), 6rem on mobile landscape
// lg: 7xl on desktop, 5xl on mobile
// md: 5xl on desktop, 4xl on mobile
const sizeStyles = {
  md: "text-4xl sm:text-5xl",
  lg: "text-5xl sm:text-7xl",
  xl: "text-[3rem] landscape:text-[6rem] sm:text-[12rem] leading-none",
};

export const TimerDisplay = ({
  minutes,
  seconds,
  size = "lg",
  isExpired,
}: TimerDisplayProps) => {
  return (
    <div
      data-component="TimerDisplay"
      data-size={size}
      data-expired={isExpired || undefined}
      className={cn(
        "timer-display",
        `timer-display--${size}`,
        isExpired && "timer-display--expired",
        "font-mono font-bold tracking-tight",
        sizeStyles[size],
        isExpired ? "text-danger animate-pulse" : "timer-gradient"
      )}
    >
      <span className="timer-display__minutes">
        {String(minutes).padStart(2, "0")}
      </span>
      <span className="timer-display__separator">:</span>
      <span className="timer-display__seconds">
        {String(seconds).padStart(2, "0")}
      </span>
    </div>
  );
};
