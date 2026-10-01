import React from "react";

export const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className = "", ...props }, ref) => (
  <label
    ref={ref}
    className={`text-sm font-medium text-foreground ${className}`}
    {...props}
  />
));
Label.displayName = "Label";
