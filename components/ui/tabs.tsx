"use client";
import React, { createContext, useContext, useId, useState } from "react";

const Context = createContext({
  value: "",
  setValue: (_value: string) => {},
  id: "",
});
export function Tabs({
  value,
  defaultValue = "",
  onValueChange,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}) {
  const [internal, setInternal] = useState(defaultValue);
  const id = useId();
  return (
    <Context.Provider
      value={{
        value: value ?? internal,
        setValue: (next) => {
          setInternal(next);
          onValueChange?.(next);
        },
        id,
      }}
    >
      <div {...props}>{children}</div>
    </Context.Provider>
  );
}
export function TabsList({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="tablist"
      className={`flex gap-1 rounded-lg bg-muted p-1 ${className}`}
      {...props}
    />
  );
}
export function TabsTrigger({
  value,
  className = "",
  onKeyDown,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }) {
  const state = useContext(Context);
  const active = state.value === value;
  return (
    <button
      type="button"
      {...props}
      role="tab"
      id={`${state.id}-tab-${value}`}
      aria-selected={active}
      aria-controls={`${state.id}-panel-${value}`}
      tabIndex={active ? 0 : -1}
      className={`min-h-11 rounded-md px-4 text-sm font-medium ${active ? "bg-white text-primary shadow-sm" : "text-muted-foreground"} ${className}`}
      onClick={(event) => {
        props.onClick?.(event);
        if (!event.defaultPrevented) state.setValue(value);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
          return;
        event.preventDefault();
        const tabs = Array.from(
          event.currentTarget
            .closest('[role="tablist"]')
            ?.querySelectorAll<HTMLButtonElement>(
              '[role="tab"]:not(:disabled)',
            ) ?? [],
        );
        const current = tabs.indexOf(event.currentTarget);
        const next =
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? tabs.length - 1
              : (current +
                  (event.key === "ArrowRight" ? 1 : -1) +
                  tabs.length) %
                tabs.length;
        tabs[next]?.focus();
        tabs[next]?.click();
      }}
    />
  );
}
export function TabsContent({
  value,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { value: string }) {
  const state = useContext(Context);
  return (
    <div
      {...props}
      role="tabpanel"
      id={`${state.id}-panel-${value}`}
      aria-labelledby={`${state.id}-tab-${value}`}
      hidden={state.value !== value}
      tabIndex={0}
      className={`mt-4 ${className}`}
    />
  );
}
