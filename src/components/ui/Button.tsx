import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

/**
 * The canonical button (issue #77). Renders the design-system `.pv-btn`
 * vocabulary from globals.css — one height per size, pill shape, consistent
 * focus + motion. Use this (or a plain `.pv-btn` class on an `<a>`) everywhere
 * rather than hand-rolled utility strings.
 */
type Variant = "primary" | "secondary" | "ghost" | "ondark" | "ondark-ghost";
type Size = "sm" | "md" | "lg";

const cls = (variant: Variant, size: Size, block: boolean, extra: string) =>
  [
    "pv-btn",
    `pv-btn--${variant}`,
    size === "sm" && "pv-btn--sm",
    size === "lg" && "pv-btn--lg",
    block && "pv-btn--block",
    extra,
  ]
    .filter(Boolean)
    .join(" ");

interface CommonProps {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  children: ReactNode;
  className?: string;
}

export function Button({
  variant = "primary",
  size = "md",
  block = false,
  className = "",
  ...props
}: CommonProps & ComponentPropsWithoutRef<"button">) {
  return (
    <button className={cls(variant, size, block, className)} {...props}>
      {props.children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  block = false,
  className = "",
  href,
  children,
  ...props
}: CommonProps & { href: string } & Omit<ComponentPropsWithoutRef<typeof Link>, "href">) {
  return (
    <Link href={href} className={cls(variant, size, block, className)} {...props}>
      {children}
    </Link>
  );
}
