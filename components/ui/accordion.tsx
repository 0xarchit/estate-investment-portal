"use client";
import React, { createContext, useContext, useId, useState } from "react";

const Root = createContext({
  values: [] as string[],
  toggle: (_value: string) => {},
});
const Item = createContext({ value: "", id: "" });
export function Accordion({
  children,
  type = "single",
  value,
  defaultValue,
  onValueChange,
  collapsible = false,
  ...props
}: Omit<React.HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> & {
  type?: "single" | "multiple";
  value?: string | string[];
  defaultValue?: string | string[];
  onValueChange?: (value: any) => void;
  collapsible?: boolean;
}) {
  const [internal, setInternal] = useState<string | string[]>(
    defaultValue ?? (type === "multiple" ? [] : ""),
  );
  const current = value ?? internal;
  const values = Array.isArray(current) ? current : [current];
  const toggle = (next: string) => {
    const result =
      type === "multiple"
        ? values.includes(next)
          ? values.filter((item) => item !== next)
          : [...values, next]
        : values.includes(next) && collapsible
          ? ""
          : next;
    setInternal(result);
    onValueChange?.(result);
  };
  return (
    <Root.Provider value={{ values, toggle }}>
      <div {...props}>{children}</div>
    </Root.Provider>
  );
}
export function AccordionItem({
  value,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { value: string }) {
  const id = useId();
  return (
    <Item.Provider value={{ value, id }}>
      <div className={`border-b border-border ${className}`} {...props} />
    </Item.Provider>
  );
}
export function AccordionTrigger({
  className = "",
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const root = useContext(Root);
  const item = useContext(Item);
  const open = root.values.includes(item.value);
  return (
    <h3>
      <button
        type="button"
        {...props}
        id={`${item.id}-trigger`}
        aria-expanded={open}
        aria-controls={`${item.id}-content`}
        className={`flex min-h-14 w-full items-center justify-between gap-4 py-4 text-left font-medium text-primary ${className}`}
        onClick={(event) => {
          props.onClick?.(event);
          if (!event.defaultPrevented) root.toggle(item.value);
        }}
      >
        {children}
        <span aria-hidden="true">{open ? "−" : "+"}</span>
      </button>
    </h3>
  );
}
export function AccordionContent({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const root = useContext(Root);
  const item = useContext(Item);
  return (
    <div
      {...props}
      role="region"
      id={`${item.id}-content`}
      aria-labelledby={`${item.id}-trigger`}
      hidden={!root.values.includes(item.value)}
      className={`pb-5 text-sm leading-relaxed text-muted-foreground ${className}`}
    />
  );
}
