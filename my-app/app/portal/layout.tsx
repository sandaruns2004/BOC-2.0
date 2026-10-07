import PortalSidebar from './PortalSidebar';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="portal-layout h-screen overflow-hidden flex bg-surface">
      <PortalSidebar />
      <main className="flex-1 flex flex-col overflow-y-auto">
        {children}
      </main>
    </div>
  );
}