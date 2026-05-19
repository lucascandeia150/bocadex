// scroll-area.tsx — substituição completa
import * as React from "react";
import { cn } from "@/lib/utils";

const ScrollArea = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative overflow-y-auto overflow-x-hidden",
        "-webkit-overflow-scrolling-touch", // não é classe Tailwind, vai inline
        className,
      )}
      style={{ WebkitOverflowScrolling: "touch" }}
      {...props}
    >
      {children}
    </div>
  ),
);
ScrollArea.displayName = "ScrollArea";

const ScrollBar = () => null; // não precisa mais

export { ScrollArea, ScrollBar };
