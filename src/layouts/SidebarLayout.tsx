import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Sparkles, LayoutGrid, LogOut } from 'lucide-react';

export default function SidebarLayout() {
    const navigate = useNavigate();

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-[#0B0B1A] font-['Outfit'] text-gray-900 dark:text-gray-100">
            {/* Sidebar */}
            <div className="w-64 bg-white dark:bg-[#1A1A2E] border-r border-gray-200 dark:border-gray-800 flex flex-col justify-between">
                <div>
                    <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                        <h2 className="text-xl font-black text-orange-500">Kravy Admin</h2>
                        <p className="text-xs text-gray-500 mt-1 tracking-wider uppercase font-bold">Internal Tools</p>
                    </div>
                    <div className="p-4 space-y-2">
                        <NavLink 
                            to="/dashboard/auto-apply" 
                            className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${isActive ? 'bg-orange-500 text-white shadow-md' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#0F0F23] hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            <Sparkles className="w-5 h-5" />
                            Auto Apply
                        </NavLink>
                        <NavLink 
                            to="/dashboard/menu/view" 
                            className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${isActive ? 'bg-orange-500 text-white shadow-md' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#0F0F23] hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            <LayoutGrid className="w-5 h-5" />
                            Browse Products
                        </NavLink>
                    </div>
                </div>
                
                <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                    <button 
                        onClick={() => navigate('/login')}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-bold transition-colors"
                    >
                        <LogOut className="w-4 h-4" /> Logout
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
