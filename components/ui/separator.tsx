import React from "react";

export function Separator({
  orientation = "horizontal",
  decorative = true,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  orientation?: "horizontal" | "vertical";
  decorative?: boolean;
}) {
  return (
    <div
      role={decorative ? "none" : "separator"}
      aria-orientation={decorative ? undefined : orientation}
      className={`bg-border shrink-0 ${orientation === "horizontal" ? "h-px w-full" : "w-px self-stretch"} ${className}`}
      {...props}
    />
  );
}
