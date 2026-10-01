"use client";
import React from "react";

interface SelectProps extends Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  "onChange"
> {
  onValueChange?: (value: string) => void;
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
}
// Native select provides keyboard navigation, touch support and screen-reader semantics.
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ onValueChange, onChange, className = "", ...props }, ref) => (
    <select
      ref={ref}
      className={`field ${className}`}
      {...props}
      onChange={(event) => {
        onChange?.(event);
        onValueChange?.(event.target.value);
      }}
    />
  ),
);
Select.displayName = "Select";
export function SelectTrigger({
  children,
}: {
  children?: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return <>{children}</>;
}
export function SelectValue({ placeholder }: { placeholder?: string }) {
  return placeholder ? (
    <option value="" disabled>
      {placeholder}
    </option>
  ) : null;
}
export function SelectContent({
  children,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return <>{children}</>;
}
export function SelectItem(
  props: React.OptionHTMLAttributes<HTMLOptionElement>,
) {
  return <option {...props} />;
}
export function SelectGroup(
  props: React.OptgroupHTMLAttributes<HTMLOptGroupElement>,
) {
  return <optgroup {...props} />;
}
export function SelectLabel({ children }: { children?: React.ReactNode }) {
  return <option disabled>{children}</option>;
}
