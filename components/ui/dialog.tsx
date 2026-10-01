"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

interface DialogState {
  open: boolean;
  setOpen: (open: boolean) => void;
  titleId: string;
  descriptionId: string;
}
const Context = createContext<DialogState | null>(null);
function useDialog() {
  const state = useContext(Context);
  if (!state) throw new Error("Dialog components must be inside Dialog.");
  return state;
}
export function Dialog({
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
  return (
    <Context.Provider
      value={{
        open: open ?? internal,
        setOpen: (next) => {
          setInternal(next);
          onOpenChange?.(next);
        },
        titleId: `${id}-title`,
        descriptionId: `${id}-description`,
      }}
    >
      {children}
    </Context.Provider>
  );
}
function Action({
  asChild,
  children,
  onClick,
  close,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  close?: boolean;
}) {
  const { setOpen } = useDialog();
  const activate = (event: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    if (!event.defaultPrevented) setOpen(!close);
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
export function DialogTrigger(props: React.ComponentProps<typeof Action>) {
  return <Action {...props} />;
}
export function DialogClose(props: React.ComponentProps<typeof Action>) {
  return <Action {...props} close />;
}
export function DialogContent({
  children,
  className = "",
  onCancel,
  ...props
}: React.DialogHTMLAttributes<HTMLDialogElement>) {
  const { open, setOpen, titleId, descriptionId } = useDialog();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, [open]);
  return (
    <dialog
      {...props}
      ref={ref}
      className={`modal overflow-y-auto ${className}`}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        onCancel?.(event);
        event.preventDefault();
        setOpen(false);
      }}
      onClick={(event) => {
        props.onClick?.(event);
        if (event.target === event.currentTarget) {
          const box = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < box.left ||
            event.clientX > box.right ||
            event.clientY < box.top ||
            event.clientY > box.bottom
          )
            setOpen(false);
        }
      }}
    >
      {children}
      <button
        type="button"
        aria-label="Close dialog"
        onClick={() => setOpen(false)}
        className="icon-button absolute right-2 top-2"
      >
        ×
      </button>
    </dialog>
  );
}
export function DialogHeader({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`mb-6 space-y-2 pr-8 ${className}`} {...props} />;
}
export function DialogFooter({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`mt-6 flex flex-wrap justify-end gap-3 ${className}`}
      {...props}
    />
  );
}
export function DialogTitle({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  const { titleId } = useDialog();
  return (
    <h2
      id={titleId}
      className={`text-xl font-semibold text-primary ${className}`}
      {...props}
    />
  );
}
export function DialogDescription({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  const { descriptionId } = useDialog();
  return (
    <p
      id={descriptionId}
      className={`text-sm text-muted-foreground ${className}`}
      {...props}
    />
  );
}
export function DialogPortal({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}
export function DialogOverlay() {
  return null;
}
