import type { ReactNode } from "react";

type Props = { children: ReactNode; tone?: "default" | "accent" | "warning" | "quiet" };

export function Badge({ children, tone = "default" }: Props) {
  return <span className={`badge badge--${tone}`}>{children}</span>;
}
