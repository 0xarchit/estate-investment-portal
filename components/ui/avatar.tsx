"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

const Context = createContext({
  loaded: false,
  setLoaded: (_loaded: boolean) => {},
});
export function Avatar({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  const [loaded, setLoaded] = useState(false);
  return (
    <Context.Provider value={{ loaded, setLoaded }}>
      <span
        className={`relative inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted ${className}`}
        {...props}
      />
    </Context.Provider>
  );
}
export function AvatarImage({
  className = "",
  onLoad,
  onError,
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement>) {
  const state = useContext(Context);
  useEffect(() => {
    state.setLoaded(false);
  }, [props.src]);
  return (
    <img
      {...props}
      className={`absolute inset-0 h-full w-full object-cover ${state.loaded ? "" : "invisible"} ${className}`}
      onLoad={(event) => {
        state.setLoaded(true);
        onLoad?.(event);
      }}
      onError={(event) => {
        state.setLoaded(false);
        onError?.(event);
      }}
    />
  );
}
export function AvatarFallback({
  delayMs,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { delayMs?: number }) {
  const state = useContext(Context);
  return state.loaded ? null : (
    <span
      className={`text-sm font-semibold text-primary ${className}`}
      {...props}
    />
  );
}
