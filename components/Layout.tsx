import React from 'react';
import { Home, List, Calendar, Settings, LogOut, Menu, X, UserCircle, MessageSquare, Hexagon } from 'lucide-react';

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
      className={`w-full flex items-center gap-3.5 px-5 py-3.5 rounded-2xl text-sm font-medium transition-all duration-300 group ${
        activePage === id 
        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-lg shadow-gray-200 dark:shadow-none' 
        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
      }`}
    >
      <div className={`transition-transform duration-300 ${activePage === id ? 'scale-110' : 'group-hover:scale-110'}`}>
        {icon}
      </div>
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black flex font-sans transition-colors duration-300">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-fadeIn" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 h-screen w-72 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-r border-gray-200 dark:border-white/5 z-50 transform transition-transform duration-300 ease-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-brand-600 to-brand-800 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
                    <Hexagon className="w-6 h-6 fill-white" />
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">AI BNB</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                <X className="w-5 h-5" />
            </button>
        </div>

        <nav className="px-4 space-y-2 mt-4">
          <NavItem id="dashboard" icon={<Home className="w-5 h-5" />} label="Overview" />
          <NavItem id="listings" icon={<List className="w-5 h-5" />} label="Properties" />
          <NavItem id="calendar" icon={<Calendar className="w-5 h-5" />} label="Calendar" />
          <NavItem id="messages" icon={<MessageSquare className="w-5 h-5" />} label="Messages" />
          <NavItem id="profile" icon={<UserCircle className="w-5 h-5" />} label="Profile" />
          <NavItem id="settings" icon={<Settings className="w-5 h-5" />} label="Settings" />
        </nav>

        <div className="absolute bottom-0 w-full p-6 border-t border-gray-100 dark:border-white/5 bg-white/50 dark:bg-transparent">
           <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-2xl transition-all">
              <LogOut className="w-5 h-5" /> Logout
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto relative">
        <header className="bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-200 dark:border-white/5 lg:hidden px-4 py-3 flex items-center gap-4 sticky top-0 z-30 transition-colors duration-300">
            <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl">
                <Menu className="w-6 h-6" />
            </button>
            <span className="font-bold text-lg text-gray-900 dark:text-white">AI BNB Host</span>
        </header>

        <div className="flex-1 p-4 lg:p-10 w-full max-w-[1600px] mx-auto pb-24">
            {children}
        </div>
      </main>
    </div>
  );
};