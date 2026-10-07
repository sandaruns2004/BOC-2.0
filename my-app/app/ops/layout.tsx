import { getSession } from '@/lib/session';
import OpsSidebar from './OpsSidebar';

export default async function OpsLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  // If this is the login page, don't show the sidebar
  // We can't check pathname in server layout easily, so we just render a simple wrapper.
  // Actually, we can use headers() to get the pathname if needed, or we just rely on page structure.
  // But Next.js layouts wrap all pages. It's better to move login to app/ops-login if we want to avoid the sidebar,
  // OR we can just let OpsSidebar hide itself if it's the login route (handled via usePathname on client).
  
  return (
    <div className="ops-layout min-h-screen flex bg-surface">
      <OpsSidebar />
      <main className="flex-1 flex flex-col overflow-y-auto">
        {children}
      </main>
    </div>
  );
}