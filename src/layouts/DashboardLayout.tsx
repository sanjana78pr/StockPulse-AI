import { Outlet } from 'react-router-dom';
import Sidebar from '../components/shared/Sidebar';
import Navbar from '../components/shared/Navbar';

export default function DashboardLayout() {
  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#0a0a0b]">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
