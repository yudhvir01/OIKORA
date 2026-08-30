import { Sidebar } from "@/components/sidebar";

export default function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  return (
    <div className="flex flex-1 flex-col lg:flex-row">
      <Sidebar />
      <main id="main-content" className="flex-1 px-4 py-6 sm:px-8">
        {children}
      </main>
    </div>
  );
}
