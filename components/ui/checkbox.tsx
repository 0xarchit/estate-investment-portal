"use client";
import React from "react";

export interface CheckboxProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  onCheckedChange?: (checked: boolean) => void;
}
export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = "", onCheckedChange, onChange, ...props }, ref) => (
    <input
      {...props}
      ref={ref}
      type="checkbox"
      className={`h-5 w-5 shrink-0 accent-emerald-700 disabled:opacity-50 ${className}`}
      onChange={(event) => {
        onChange?.(event);
        onCheckedChange?.(event.target.checked);
      }}
    />
  ),
);
Checkbox.displayName = "Checkbox";
