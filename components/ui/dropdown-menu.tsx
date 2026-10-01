"use client";
import React from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverClose,
} from "./popover";

export const DropdownMenu = Popover;
export const DropdownMenuTrigger = PopoverTrigger;
export function DropdownMenuContent({
  children,
  ...props
}: React.ComponentProps<typeof PopoverContent>) {
  return (
    <PopoverContent
      {...props}
      role="menu"
      onKeyDown={(event) => {
        props.onKeyDown?.(event);
        if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key))
          return;
        event.preventDefault();
        const items = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            '[role^="menuitem"]:not(:disabled):not([aria-disabled="true"])',
          ),
        );
        const index = items.indexOf(document.activeElement as HTMLElement);
        const next =
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? items.length - 1
              : (index + (event.key === "ArrowDown" ? 1 : -1) + items.length) %
                items.length;
        items[next]?.focus();
      }}
    >
      {children}
    </PopoverContent>
  );
}
export function DropdownMenuItem({
  className = "",
  onSelect,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  onSelect?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <PopoverClose
      role="menuitem"
      {...props}
      className={`flex min-h-11 w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted disabled:opacity-50 ${className}`}
      onClick={(event) => {
        props.onClick?.(event);
        onSelect?.(event);
      }}
    />
  );
}
export function DropdownMenuCheckboxItem({
  checked,
  onCheckedChange,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuItem> & {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}) {
  return (
    <DropdownMenuItem
      {...props}
      role="menuitemcheckbox"
      aria-checked={checked}
      onSelect={(event) => {
        props.onSelect?.(event);
        onCheckedChange?.(!checked);
      }}
    >
      {checked ? "✓ " : ""}
      {children}
    </DropdownMenuItem>
  );
}
export function DropdownMenuLabel({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`px-3 py-2 text-xs font-semibold text-muted-foreground ${className}`}
      {...props}
    />
  );
}
export function DropdownMenuSeparator() {
  return <hr className="my-1 border-border" />;
}
export function DropdownMenuGroup(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div role="group" {...props} />;
}
export function DropdownMenuShortcut({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={`ml-auto text-xs text-muted-foreground ${className}`}
      {...props}
    />
  );
}
export function DropdownMenuPortal({
  children,
}: {
  children?: React.ReactNode;
}) {
  return <>{children}</>;
}
