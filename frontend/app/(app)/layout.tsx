import { ReactNode } from "react";
import { Sidebar } from "@/components/sidebar";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="ml-64 flex-1 bg-background p-6">{children}</main>
    </div>
  );
}
