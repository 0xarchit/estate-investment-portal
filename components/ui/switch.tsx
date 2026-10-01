"use client";
import React from "react";
import { Checkbox, CheckboxProps } from "./checkbox";

export const Switch = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = "", ...props }, ref) => (
    <Checkbox
      {...props}
      ref={ref}
      role="switch"
      className={`relative h-6 w-11 appearance-none rounded-full bg-slate-300 transition-colors checked:bg-emerald-700 after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform checked:after:translate-x-5 ${className}`}
    />
  ),
);
Switch.displayName = "Switch";
