import React from "react";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className = "", ...props }, ref) => (
  <textarea
    ref={ref}
    className={`field min-h-24 resize-y disabled:opacity-50 ${className}`}
    {...props}
  />
));
Textarea.displayName = "Textarea";
