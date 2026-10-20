import * as React from "react";
import { cn } from "@/lib/utils";

export type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  hover?: boolean;
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, hover = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border border-zinc-800 bg-zinc-900/60",
        hover &&
          "transition-colors duration-200 hover:border-zinc-700 hover:bg-zinc-900",
        className
      )}
      {...props}
    />
  )
);

Card.displayName = "Card";
