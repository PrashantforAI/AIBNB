import React from 'react';
import { Home, List, Calendar, Settings, LogOut, Menu } from 'lucide-react';

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
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
        activePage === id 
        ? 'bg-brand-50 text-brand-700 border-l-4 border-brand-500' 
        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/20 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 h-screen w-64 bg-white border-r border-gray-200 z-30 transform transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-gray-100 flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                A
            </div>
            <span className="text-xl font-bold text-gray-900">AI BNB <span className="text-xs bg-brand-100 text-brand-800 px-1.5 py-0.5 rounded ml-1">HOST</span></span>
        </div>

        <nav className="p-4 space-y-1">
          <NavItem id="dashboard" icon={<Home className="w-5 h-5" />} label="Dashboard" />
          <NavItem id="listings" icon={<List className="w-5 h-5" />} label="Properties" />
          <NavItem id="calendar" icon={<Calendar className="w-5 h-5" />} label="Calendar" />
          <NavItem id="settings" icon={<Settings className="w-5 h-5" />} label="Settings" />
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-gray-100">
           <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:text-red-600 transition-colors">
              <LogOut className="w-5 h-5" /> Logout
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 lg:hidden p-4 flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                <Menu className="w-6 h-6" />
            </button>
            <span className="font-bold text-lg">AI BNB</span>
        </header>

        <div className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full">
            {children}
        </div>
      </main>
    </div>
  );
};
