"use client";
import React from "react";

export interface SliderProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "defaultValue" | "type"
> {
  value?: number[];
  defaultValue?: number[];
  onValueChange?: (value: number[]) => void;
  onValueCommit?: (value: number[]) => void;
}
export const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  (
    {
      value,
      defaultValue,
      onValueChange,
      onValueCommit,
      onChange,
      onKeyUp,
      onPointerUp,
      className = "",
      ...props
    },
    ref,
  ) => (
    <input
      ref={ref}
      {...props}
      type="range"
      value={value?.[0]}
      defaultValue={defaultValue?.[0]}
      className={`w-full min-h-11 accent-emerald-700 ${className}`}
      onChange={(event) => {
        onChange?.(event);
        onValueChange?.([Number(event.target.value)]);
      }}
      onKeyUp={(event) => {
        onKeyUp?.(event);
        onValueCommit?.([Number(event.currentTarget.value)]);
      }}
      onPointerUp={(event) => {
        onPointerUp?.(event);
        onValueCommit?.([Number(event.currentTarget.value)]);
      }}
    />
  ),
);
Slider.displayName = "Slider";
