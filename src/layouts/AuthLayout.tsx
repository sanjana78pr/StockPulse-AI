import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <main className="flex-grow flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
