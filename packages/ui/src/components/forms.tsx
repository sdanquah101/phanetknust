"use client";
import * as React from "react";
import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "./primitives";

/** Submit button that shows pending state inside a <form action={serverAction}>. */
export function SubmitButton({ children, pendingText = "Working…", ...rest }: ButtonProps & { pendingText?: string }) {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending} {...rest}>{pending ? pendingText : children}</Button>;
}

/** Simple confirm wrapper for destructive form buttons. */
export function ConfirmSubmit({ message, children, ...rest }: ButtonProps & { message: string }) {
  return (
    <Button type="submit" onClick={(e) => { if (!window.confirm(message)) e.preventDefault(); }} {...rest}>{children}</Button>
  );
}

export function Toast({ message, tone = "ice" }: { message?: string | null; tone?: "ice" | "peach" | "mint" }) {
  if (!message) return null;
  return <div className={`notice notice-${tone} fade-up`} role="status">{message}</div>;
}
