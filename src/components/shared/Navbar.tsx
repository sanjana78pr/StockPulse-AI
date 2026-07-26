import { Search, Bell, Sun, Moon, User } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const [isDark, setIsDark] = useState(true);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-border/50 bg-[#0c0c0e] z-10">
      <div className="flex items-center flex-1">
        <div className="relative w-full max-w-md hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search symbols, sectors, or news..."
            className="w-full bg-[#16161a] border border-border/50 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-gray-200 placeholder-gray-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 rounded-full hover:bg-white/5 text-gray-400 hover:text-gray-200 transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full" />
        </button>
        
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-white/5 text-gray-400 hover:text-gray-200 transition-colors"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 p-[2px] cursor-pointer">
          <div className="w-full h-full rounded-full bg-[#0c0c0e] flex items-center justify-center">
            <User className="w-4 h-4 text-gray-300" />
          </div>
        </div>
      </div>
    </header>
  );
}
