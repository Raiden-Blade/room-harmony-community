import type { ReactNode } from "react";

export function Loading({ label = "読み込んでいます" }: { label?: string }) {
  return (
    <div className="status-view" role="status">
      <span className="spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}

export function ErrorView({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div className="status-view status-view--error" role="alert">
      <h2>読み込めませんでした</h2>
      <p>{message}</p>
      {action}
    </div>
  );
}

export function EmptyView({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="status-view">
      <h2>{title}</h2>
      <div>{children}</div>
    </div>
  );
}
