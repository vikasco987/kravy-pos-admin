import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Sparkles, LayoutGrid, LogOut, Users, Moon, Sun, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '../components/ThemeProvider';

export default function SidebarLayout() {
    const navigate = useNavigate();
    const { resolvedTheme, toggleTheme } = useTheme();
    const isDark = resolvedTheme === "dark";
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-[#0B0B1A] font-['Outfit'] text-gray-900 dark:text-gray-100 overflow-hidden">
            {/* Sidebar */}
            <div className={`${isCollapsed ? 'w-20' : 'w-64'} transition-all duration-300 ease-in-out bg-white dark:bg-[#1A1A2E] border-r border-gray-200 dark:border-gray-800 flex flex-col justify-between relative z-10`}>
                <div>
                    <div className={`p-6 border-b border-gray-200 dark:border-gray-800 flex items-center ${isCollapsed ? 'justify-center px-4' : 'gap-3'} relative`}>
                        <img src="/logo.png" alt="Kravy Logo" className={`${isCollapsed ? 'w-8 h-8' : 'w-10 h-10'} object-contain rounded-xl transition-all duration-300`} />
                        {!isCollapsed && (
                            <div className="transition-opacity duration-300">
                                <h2 className="text-xl font-black text-blue-600 dark:text-blue-500">Kravy</h2>
                                <p className="text-[10px] text-gray-500 mt-0.5 tracking-widest uppercase font-bold">Internal</p>
                            </div>
                        )}
                        <button 
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white dark:bg-[#1A1A2E] border border-gray-200 dark:border-gray-700 rounded-full flex items-center justify-center text-gray-500 hover:text-blue-500 shadow-sm z-20"
                        >
                            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                        </button>
                    </div>
                    <div className={`p-4 space-y-2 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
                        <NavLink 
                            to="/dashboard/auto-apply" 
                            title={isCollapsed ? "Auto Apply" : undefined}
                            className={({ isActive }) => `flex items-center gap-3 ${isCollapsed ? 'px-3 justify-center' : 'px-4'} py-3 rounded-xl font-bold transition-all ${isActive ? 'bg-orange-500 text-white shadow-md' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#0F0F23] hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            <Sparkles className="w-5 h-5 flex-shrink-0" />
                            {!isCollapsed && <span className="whitespace-nowrap">Auto Apply</span>}
                        </NavLink>
                        <NavLink 
                            to="/dashboard/menu/view" 
                            title={isCollapsed ? "Browse Products" : undefined}
                            className={({ isActive }) => `flex items-center gap-3 ${isCollapsed ? 'px-3 justify-center' : 'px-4'} py-3 rounded-xl font-bold transition-all ${isActive ? 'bg-orange-500 text-white shadow-md' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#0F0F23] hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            <LayoutGrid className="w-5 h-5 flex-shrink-0" />
                            {!isCollapsed && <span className="whitespace-nowrap">Browse Products</span>}
                        </NavLink>
                        <NavLink 
                            to="/dashboard/staff" 
                            title={isCollapsed ? "Access Control" : undefined}
                            className={({ isActive }) => `flex items-center gap-3 ${isCollapsed ? 'px-3 justify-center' : 'px-4'} py-3 rounded-xl font-bold transition-all ${isActive ? 'bg-orange-500 text-white shadow-md' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#0F0F23] hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            <Users className="w-5 h-5 flex-shrink-0" />
                            {!isCollapsed && <span className="whitespace-nowrap">Access Control</span>}
                        </NavLink>
                    </div>
                </div>
                
                <div className={`p-4 border-t border-gray-200 dark:border-gray-800 flex ${isCollapsed ? 'flex-col' : 'flex-row'} items-center gap-2`}>
                    <button
                        onClick={toggleTheme}
                        title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                        className={`flex items-center justify-center ${isCollapsed ? 'w-10 h-10' : 'w-12 h-10'} bg-gray-100 dark:bg-[#0F0F23] hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl transition-colors`}
                    >
                        {isDark ? <Sun className="w-4 h-4 text-yellow-500" /> : <Moon className="w-4 h-4 text-indigo-500" />}
                    </button>
                    <button 
                        onClick={() => {
                            localStorage.removeItem('kravy_lite_token');
                            navigate('/login');
                        }}
                        title={isCollapsed ? "Logout" : undefined}
                        className={`flex-1 flex items-center justify-center gap-2 ${isCollapsed ? 'w-10 h-10 px-0' : 'px-4 py-3'} bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-bold transition-colors`}
                    >
                        <LogOut className="w-4 h-4 flex-shrink-0" /> {!isCollapsed && <span className="whitespace-nowrap">Logout</span>}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto">
                <Outlet />
            </div>
        </div>
    );
}
