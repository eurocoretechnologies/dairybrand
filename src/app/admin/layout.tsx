import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Orders", template: "%s · Owner dashboard" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <div className="flex min-h-dvh flex-col bg-surface/50">{children}</div>;
}
