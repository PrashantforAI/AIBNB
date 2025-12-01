
import React from 'react';
import { Home, List, Calendar, Settings, LogOut, Menu, X, UserCircle } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activePage: string;
  onNavigate: (page: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activePage, onNavigate }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const NavItem = ({ id, icon, label }: { id: string, icon: React.ReactNode, label: string }) => (
    <button 
      onClick={() => { onNavigate(id); setSidebarOpen(false); }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
        activePage === id 
        ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 font-bold' 
        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
      }`}
    >
      <div className={`${activePage === id ? 'text-brand-600 dark:text-brand-400' : 'text-gray-400 dark:text-gray-500'}`}>{icon}</div>
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex font-sans transition-colors duration-300">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden animate-fadeIn" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 h-screen w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center text-white font-extrabold text-xl shadow-sm">
                    A
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">AI BNB</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 text-gray-400 hover:text-gray-900 dark:hover:text-white">
                <X className="w-6 h-6" />
            </button>
        </div>

        <nav className="p-4 space-y-1">
          <NavItem id="dashboard" icon={<Home className="w-5 h-5" />} label="Overview" />
          <NavItem id="listings" icon={<List className="w-5 h-5" />} label="Properties" />
          <NavItem id="calendar" icon={<Calendar className="w-5 h-5" />} label="Calendar" />
          <NavItem id="profile" icon={<UserCircle className="w-5 h-5" />} label="Profile" />
          <NavItem id="settings" icon={<Settings className="w-5 h-5" />} label="Settings" />
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
           <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors">
              <LogOut className="w-5 h-5" /> Logout
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 lg:hidden px-4 py-3 flex items-center gap-4 sticky top-0 z-30 transition-colors duration-300">
            <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                <Menu className="w-6 h-6" />
            </button>
            <span className="font-bold text-lg text-gray-900 dark:text-white">AI BNB Host</span>
        </header>

        <div className="flex-1 p-4 lg:p-8 w-full max-w-[1600px] mx-auto pb-24">
            {children}
        </div>
      </main>
    </div>
  );
};
