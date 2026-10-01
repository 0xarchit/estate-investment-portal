"use client";
import React, { createContext, useContext, useId } from "react";
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
  FormProvider,
  useFormContext,
} from "react-hook-form";
import { Label } from "./label";

export const Form = FormProvider;
const FieldContext = createContext({ name: "" });
const ItemContext = createContext({ id: "" });
export function FormField<
  TValues extends FieldValues,
  TName extends FieldPath<TValues>,
>(props: ControllerProps<TValues, TName>) {
  return (
    <FieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FieldContext.Provider>
  );
}
export function useFormField() {
  const field = useContext(FieldContext);
  const item = useContext(ItemContext);
  const form = useFormContext();
  if (!field.name || !form)
    throw new Error("Form controls must be inside Form and FormField.");
  const state = form.getFieldState(field.name, form.formState);
  return {
    ...state,
    name: field.name,
    id: item.id,
    formItemId: `${item.id}-input`,
    formDescriptionId: `${item.id}-description`,
    formMessageId: `${item.id}-message`,
  };
}
export function FormItem({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const id = useId();
  return (
    <ItemContext.Provider value={{ id }}>
      <div className={`space-y-2 ${className}`} {...props} />
    </ItemContext.Provider>
  );
}
export function FormLabel(props: React.ComponentProps<typeof Label>) {
  const field = useFormField();
  return <Label {...props} htmlFor={field.formItemId} />;
}
export function FormControl({ children }: { children: React.ReactElement }) {
  const field = useFormField();
  return React.cloneElement(children, {
    id: field.formItemId,
    "aria-invalid": !!field.error,
    "aria-describedby": field.error
      ? `${field.formDescriptionId} ${field.formMessageId}`
      : field.formDescriptionId,
  });
}
export function FormDescription({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  const field = useFormField();
  return (
    <p
      id={field.formDescriptionId}
      className={`text-sm text-muted-foreground ${className}`}
      {...props}
    />
  );
}
export function FormMessage({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  const field = useFormField();
  const body = field.error?.message ? String(field.error.message) : children;
  return body ? (
    <p
      id={field.formMessageId}
      role="alert"
      className={`text-sm font-medium text-destructive ${className}`}
      {...props}
    >
      {body}
    </p>
  ) : null;
}
