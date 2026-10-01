"use client";
import React, { createContext, useContext, useId, useState } from "react";

const Context = createContext({
  open: false,
  setOpen: (_open: boolean) => {},
  id: "",
});
export function TooltipProvider({
  children,
}: {
  children?: React.ReactNode;
  delayDuration?: number;
}) {
  return <>{children}</>;
}
export function Tooltip({ children }: { children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <Context.Provider value={{ open, setOpen, id }}>
      <span
        className="relative inline-flex"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
        }}
      >
        {children}
      </span>
    </Context.Provider>
  );
}
export function TooltipTrigger({
  children,
  asChild,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }) {
  const state = useContext(Context);
  if (asChild && React.isValidElement(children))
    return React.cloneElement(
      children as React.ReactElement<React.HTMLAttributes<HTMLElement>>,
      { "aria-describedby": state.open ? state.id : undefined },
    );
  return (
    <button
      type="button"
      {...props}
      aria-describedby={state.open ? state.id : undefined}
    >
      {children}
    </button>
  );
}
export function TooltipContent({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  side?: string;
  sideOffset?: number;
}) {
  const state = useContext(Context);
  const { side, sideOffset, ...spanProps } = props;
  return state.open ? (
    <span
      {...spanProps}
      role="tooltip"
      id={state.id}
      className={`absolute bottom-full left-1/2 z-50 mb-2 w-max max-w-64 -translate-x-1/2 rounded-md bg-primary px-3 py-2 text-xs text-primary-foreground shadow-md ${className}`}
    />
  ) : null;
}
