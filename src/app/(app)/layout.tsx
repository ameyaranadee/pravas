import { JourneyNav } from "@/components/journey-nav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden font-sans text-[#2D323B]">
      <JourneyNav />
      <main className="flex flex-1 flex-col overflow-y-auto bg-white">
        {children}
      </main>
    </div>
  );
}
