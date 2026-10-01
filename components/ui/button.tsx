"use client";
import React from "react";
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  loading?: boolean;
  asChild?: boolean;
}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "default",
      size = "default",
      loading,
      children,
      asChild,
      ...props
    },
    ref,
  ) => {
    const classes = `btn ${variant === "default" ? "" : variant === "destructive" ? "btn-danger" : variant === "ghost" ? "btn-ghost" : "btn-secondary"} ${size === "sm" ? "btn-sm" : ""} ${className}`;
    if (asChild && React.isValidElement(children))
      return React.cloneElement(
        children as React.ReactElement<{ className: string }>,
        { className: classes },
      );
    return (
      <button
        ref={ref}
        {...props}
        className={classes}
        disabled={props.disabled || loading}
        aria-busy={loading}
      >
        {loading ? "Please wait…" : children}
      </button>
    );
  },
);
Button.displayName = "Button";
