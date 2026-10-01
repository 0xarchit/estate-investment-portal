import React from "react";

export function Badge({
  className = "",
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "secondary" | "outline" | "destructive";
}) {
  const tone =
    variant === "destructive"
      ? "status-negative"
      : variant === "secondary"
        ? "status-positive"
        : "status-neutral";
  return (
    <span
      className={`status-chip ${tone} ${variant === "outline" ? "border border-border bg-transparent" : ""} ${className}`}
      {...props}
    />
  );
}
