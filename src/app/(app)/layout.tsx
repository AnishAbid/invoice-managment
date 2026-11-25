import { Header } from "@/components/header";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      <footer className="border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        Your receipts are stored privately in this browser.
      </footer>
    </>
  );
}
