
import React, { useState } from 'react';
import { Home, List, Calendar, Settings, LogOut, Menu, X, UserCircle, MessageSquare, Hexagon, Sparkles } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activePage: string;
  onNavigate: (page: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activePage, onNavigate }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', icon: Home, label: 'Overview' },
    { id: 'ai-concierge', icon: Sparkles, label: 'AI Concierge' },
    { id: 'listings', icon: List, label: 'Properties' },
    { id: 'calendar', icon: Calendar, label: 'Calendar' },
    { id: 'messages', icon: MessageSquare, label: 'Messages' },
    { id: 'profile', icon: UserCircle, label: 'Profile' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="h-full bg-gray-50 dark:bg-black flex flex-col font-sans transition-colors duration-300 overflow-hidden">
      
      {/* Top Header */}
      <header className="bg-white/80 dark:bg-black/80 backdrop-blur-xl sticky top-0 z-40 px-6 py-4 flex justify-between items-center border-b border-gray-100 dark:border-white/5 shrink-0">
         {/* Logo */}
         <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('dashboard')}>
             <div className="w-9 h-9 bg-gradient-to-br from-gray-800 to-black dark:from-white dark:to-gray-300 rounded-xl flex items-center justify-center text-white dark:text-black font-bold text-lg shadow-md">
                <Hexagon className="w-5 h-5 fill-current" />
             </div>
             <span className="font-bold text-lg text-gray-900 dark:text-white hidden sm:block tracking-tight">AI BNB <span className="opacity-50 font-medium">Host</span></span>
         </div>
         
         {/* Right Side Menu */}
         <div className="relative">
            <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-2 p-1 pl-3 pr-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full hover:shadow-md transition-all group"
            >
                <Menu className="w-4 h-4 text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white" />
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-brand-800 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                    H
                </div>
            </button>

            {isMenuOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)}></div>
                    <div className="absolute top-12 right-0 w-64 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50 animate-fadeIn origin-top-right">
                        <div className="py-2">
                            <div className="px-6 py-3 border-b border-gray-100 dark:border-gray-800 mb-2">
                                <p className="text-sm font-bold text-gray-900 dark:text-white">Pine Stays</p>
                                <p className="text-xs text-gray-500">Superhost</p>
                            </div>
                            {menuItems.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => { onNavigate(item.id); setIsMenuOpen(false); }}
                                    className={`w-full text-left px-6 py-3 text-sm font-medium flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${activePage === item.id ? 'text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border-l-2 border-gray-900 dark:border-white' : 'text-gray-600 dark:text-gray-400 border-l-2 border-transparent'}`}
                                >
                                    <item.icon className="w-4 h-4" />
                                    {item.label}
                                </button>
                            ))}
                            <div className="h-px bg-gray-100 dark:bg-gray-800 my-2"></div>
                            <button className="w-full text-left px-6 py-3 text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-colors flex items-center gap-3">
                                <LogOut className="w-4 h-4" /> Logout
                            </button>
                        </div>
                    </div>
                </>
            )}
         </div>
      </header>

      {/* Main Content */}
      <main className={`flex-1 flex flex-col min-w-0 h-full relative ${activePage === 'ai-concierge' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
        <div className={`flex-1 w-full mx-auto ${activePage === 'ai-concierge' ? 'h-full' : 'p-4 lg:p-8 max-w-[1600px]'}`}>
            {children}
        </div>
      </main>
    </div>
  );
};
