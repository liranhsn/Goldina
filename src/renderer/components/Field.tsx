import React from "react";
export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid" style={{ gap: 6 }}>
      <span style={{ color: "var(--muted)", fontSize: 13 }}>{label}</span>
      {children}
    </label>
  );
}
