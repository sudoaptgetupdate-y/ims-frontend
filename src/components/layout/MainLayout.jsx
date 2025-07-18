// src/components/layout/MainLayout.jsx

import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from "react-router-dom";
// --- START: ส่วนที่แก้ไข 1: เพิ่ม ArrowRightLeft และลบ PackageOpen ที่ไม่ได้ใช้ออก ---
import { LogOut, Menu, X, UserCircle, User, ArrowRightLeft, Building2, ShoppingCart, Settings, Package, Boxes, Tag, Users } from "lucide-react";
// --- END ---
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import useAuthStore from "@/store/authStore";
import { Button } from "@/components/ui/button";

// คอมโพเนนต์สำหรับรายการเมนูแต่ละอันเพื่อลดการเขียนโค้ดซ้ำ
const NavItem = ({ to, children, handleclick }) => (
    <NavLink
        to={to}
        onClick={handleclick}
        className={({ isActive }) => `flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm transition-colors ${isActive ? 'bg-slate-700 font-semibold' : 'hover:bg-slate-800'}`}
    >
        {children}
    </NavLink>
);

const MainLayout = () => {
    const navigate = useNavigate();
    const logout = useAuthStore((state) => state.logout);
    const currentUser = useAuthStore((state) => state.user);
    const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleLogout = () => {
        logout();
    };

    const onNavLinkClick = () => {
        if (isSidebarOpen) {
            setIsSidebarOpen(false);
        }
    }

    const SidebarContent = () => (
        <div className="flex flex-col h-full text-slate-200">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                <h1 className="text-2xl font-bold">IMS</h1>
                <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white">
                    <X size={24} />
                </button>
            </div>
            
            <nav className="flex-1 px-2 py-4 space-y-2 overflow-y-auto">
                <NavItem to="/dashboard" handleclick={onNavLinkClick}>
                    <Boxes size={18} /> Dashboard
                </NavItem>

                <div>
                    <p className="px-3 py-2 text-slate-400 text-xs font-bold uppercase">Business</p>
                    <div className="space-y-1">
                        <NavItem to="/sales" handleclick={onNavLinkClick}><ShoppingCart size={18} /> Sales</NavItem>
                        {/* --- START: ส่วนที่แก้ไข 2: เปลี่ยนไอคอน --- */}
                        <NavItem to="/borrowings" handleclick={onNavLinkClick}><ArrowRightLeft size={18} /> Borrowing</NavItem>
                        {/* --- END --- */}
                        <NavItem to="/customers" handleclick={onNavLinkClick}><Users size={18} /> Customers</NavItem>
                    </div>
                </div>
                <div>
                    <p className="px-3 py-2 text-slate-400 text-xs font-bold uppercase">Products</p>
                     <div className="space-y-1">
                        <NavItem to="/inventory" handleclick={onNavLinkClick}><Package size={18}/> Inventory</NavItem>
                        <NavItem to="/product-models" handleclick={onNavLinkClick}><Boxes size={18} /> Product Models</NavItem>
                        <NavItem to="/brands" handleclick={onNavLinkClick}><Building2 size={18} /> Brands</NavItem>
                        <NavItem to="/categories" handleclick={onNavLinkClick}><Tag size={18} /> Categories</NavItem>
                    </div>
                </div>
                {isSuperAdmin && (
                     <div>
                        <p className="px-3 py-2 text-slate-400 text-xs font-bold uppercase">System</p>
                        <div className="space-y-1">
                            <NavItem to="/users" handleclick={onNavLinkClick}><Settings size={18}/> User Management</NavItem>
                        </div>
                    </div>
                )}
            </nav>
        </div>
    );

    return (
        <div className="relative min-h-screen md:flex">
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black opacity-50 z-20 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}

            <aside
                className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <SidebarContent />
            </aside>

            <div className="flex-1 flex flex-col max-h-screen">
                <header className="bg-white shadow-sm flex justify-between items-center p-2 md:p-4">
                    <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsSidebarOpen(true)}>
                        <Menu className="h-6 w-6" />
                    </Button>

                    <div className="hidden md:block flex-1"></div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100">
                                <UserCircle className="h-8 w-8 text-slate-500" />
                                <div className="hidden sm:block text-left">
                                    <p className="font-semibold text-sm">{currentUser?.name || 'User'}</p>
                                    <p className="text-xs text-slate-500">{currentUser?.role}</p>
                                </div>
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end">
                            <DropdownMenuLabel>My Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => navigate('/profile')}>
                                <User className="mr-2 h-4 w-4" />
                                <span>Profile</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Logout</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </header>

                <main className="flex-1 p-4 md:p-6 overflow-y-auto bg-gray-100">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default MainLayout;