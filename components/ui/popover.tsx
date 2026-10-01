"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

const Context = createContext({
  open: false,
  setOpen: (_open: boolean) => {},
  id: "",
  trigger: {
    current: null,
  } as React.MutableRefObject<HTMLButtonElement | null>,
});
export function Popover({
  children,
  open,
  defaultOpen = false,
  onOpenChange,
}: {
  children: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internal, setInternal] = useState(defaultOpen);
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  return (
    <Context.Provider
      value={{
        open: open ?? internal,
        setOpen: (next) => {
          setInternal(next);
          onOpenChange?.(next);
        },
        id,
        trigger,
      }}
    >
      <div className="relative inline-block">{children}</div>
    </Context.Provider>
  );
}
export function PopoverTrigger({
  asChild,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }) {
  const state = useContext(Context);
  const actionProps: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    ref: React.Ref<HTMLButtonElement>;
  } = {
    ...props,
    ref: state.trigger,
    "aria-expanded": state.open,
    "aria-controls": state.id,
    onClick: (event) => {
      props.onClick?.(event);
      if (!event.defaultPrevented) state.setOpen(!state.open);
    },
    onKeyDown: (event) => {
      props.onKeyDown?.(event);
      if (event.key === "ArrowDown" && !event.defaultPrevented) {
        event.preventDefault();
        state.setOpen(true);
      }
    },
  };
  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<
      React.ButtonHTMLAttributes<HTMLButtonElement>
    >;
    return React.cloneElement(child, {
      ...actionProps,
      onClick: (event) => {
        child.props.onClick?.(event);
        actionProps.onClick?.(event);
      },
    });
  }
  return (
    <button type="button" {...actionProps}>
      {children}
    </button>
  );
}
export function PopoverContent({
  align = "center",
  side = "bottom",
  sideOffset = 8,
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  align?: "start" | "center" | "end";
  side?: "top" | "bottom" | "left" | "right";
  sideOffset?: number;
}) {
  const state = useContext(Context);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!state.open) return;
    const content = ref.current;
    const focusable = content?.querySelector<HTMLElement>(
      'button:not(:disabled),a[href],input,select,textarea,[tabindex="0"]',
    );
    (focusable ?? content)?.focus();
    const closeOutside = (event: PointerEvent) => {
      if (
        !content?.contains(event.target as Node) &&
        !state.trigger.current?.contains(event.target as Node)
      )
        state.setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        state.setOpen(false);
        state.trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", escape);
    };
  }, [state.open]);
  if (!state.open) return null;
  const horizontal =
    align === "end"
      ? "right-0"
      : align === "start"
        ? "left-0"
        : "left-1/2 -translate-x-1/2";
  const vertical = side === "top" ? "bottom-full" : "top-full";
  return (
    <div
      {...props}
      ref={ref}
      id={state.id}
      tabIndex={-1}
      className={`absolute z-50 w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-lg ${horizontal} ${vertical} ${className}`}
      style={{
        ...(side === "top"
          ? { marginBottom: sideOffset }
          : { marginTop: sideOffset }),
        ...props.style,
      }}
      onBlur={(event) => {
        props.onBlur?.(event);
        if (
          event.relatedTarget &&
          !event.currentTarget.parentElement?.contains(event.relatedTarget)
        )
          state.setOpen(false);
      }}
    >
      {children}
    </div>
  );
}
export function PopoverClose({
  children,
  asChild,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }) {
  const state = useContext(Context);
  const activate: React.MouseEventHandler<HTMLButtonElement> = (event) => {
    props.onClick?.(event);
    if (!event.defaultPrevented) {
      state.setOpen(false);
      state.trigger.current?.focus();
    }
  };
  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<
      React.ButtonHTMLAttributes<HTMLButtonElement>
    >;
    return React.cloneElement(child, {
      ...props,
      onClick: (event) => {
        child.props.onClick?.(event);
        activate(event);
      },
    });
  }
  return (
    <button type="button" {...props} onClick={activate}>
      {children}
    </button>
  );
}
export function PopoverAnchor({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}
