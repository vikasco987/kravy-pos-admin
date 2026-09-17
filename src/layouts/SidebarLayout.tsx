import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Sparkles, LayoutGrid, LogOut, Users } from 'lucide-react';

export default function SidebarLayout() {
    const navigate = useNavigate();

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-[#0B0B1A] font-['Outfit'] text-gray-900 dark:text-gray-100">
            {/* Sidebar */}
            <div className="w-64 bg-white dark:bg-[#1A1A2E] border-r border-gray-200 dark:border-gray-800 flex flex-col justify-between">
                <div>
                    <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3">
                        <img src="/logo.png" alt="Kravy Logo" className="w-10 h-10 object-contain rounded-xl" />
                        <div>
                            <h2 className="text-xl font-black text-blue-600 dark:text-blue-500">Kravy</h2>
                            <p className="text-[10px] text-gray-500 mt-0.5 tracking-widest uppercase font-bold">Internal</p>
                        </div>
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
                        <NavLink 
                            to="/dashboard/staff" 
                            className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${isActive ? 'bg-orange-500 text-white shadow-md' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#0F0F23] hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            <Users className="w-5 h-5" />
                            Access Control
                        </NavLink>
                    </div>
                </div>
                
                <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                    <button 
                        onClick={() => {
                            localStorage.removeItem('kravy_lite_token');
                            navigate('/login');
                        }}
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
