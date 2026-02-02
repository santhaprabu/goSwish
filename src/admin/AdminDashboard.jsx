import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
    LayoutDashboard, Users, UserCog, Settings, Tag,
    Briefcase, LogOut, Menu, X, DollarSign, Layers
} from 'lucide-react';

// Sub-components (Will be fleshed out in separate files, imported here)
import AdminOverview from './AdminOverview';
import ServiceConfig from './ServiceConfig';
import UserManagement from './UserManagement';
import PromoConfig from './PromoConfig';
import SettingsConfig from './SettingsConfig';

export default function AdminDashboard() {
    const { logout } = useApp();
    const [activeTab, setActiveTab] = useState('overview');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const renderContent = () => {
        switch (activeTab) {
            case 'overview': return <AdminOverview />;
            case 'services': return <ServiceConfig />;
            case 'users': return <UserManagement />;
            case 'promos': return <PromoConfig />;
            case 'settings': return <SettingsConfig />;
            default: return <AdminOverview />;
        }
    };

    const NavItem = ({ id, icon: Icon, label }) => (
        <button
            onClick={() => {
                setActiveTab(id);
                setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium
                ${activeTab === id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                    : 'text-gray-500 hover:bg-white hover:text-gray-900'
                }`}
        >
            <Icon className="w-5 h-5" />
            {label}
        </button>
    );

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar - Desktop */}
            <aside className="hidden md:flex flex-col w-64 bg-slate-100 border-r border-gray-200 p-4 h-screen sticky top-0">
                <div className="flex items-center gap-3 px-2 mb-8 mt-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Settings className="w-5 h-5 text-white" />
                    </div>
                    <h1 className="text-xl font-bold text-gray-900">GoSwish Admin</h1>
                </div>

                <nav className="flex-1 space-y-1">
                    <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-4">Main</p>
                    <NavItem id="overview" icon={LayoutDashboard} label="Dashboard" />

                    <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-6">Management</p>
                    <NavItem id="users" icon={Users} label="Users & Cleaners" />
                    <NavItem id="services" icon={Layers} label="Services & Pricing" />
                    <NavItem id="promos" icon={Tag} label="Promo Codes" />

                    <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-6">System</p>
                    <NavItem id="settings" icon={Settings} label="Settings" />
                </nav>

                <button
                    onClick={logout}
                    className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all font-medium mt-auto"
                >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                </button>
            </aside>

            {/* Mobile Header */}
            <div className={`md:hidden fixed inset-0 z-50 bg-slate-100 transform transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex flex-col h-full p-4">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <Settings className="w-5 h-5 text-white" />
                            </div>
                            <h1 className="text-xl font-bold text-gray-900">Admin</h1>
                        </div>
                        <button onClick={() => setIsMobileMenuOpen(false)} className="p-2">
                            <X className="w-6 h-6 text-gray-600" />
                        </button>
                    </div>

                    <nav className="flex-1 space-y-1">
                        <NavItem id="overview" icon={LayoutDashboard} label="Dashboard" />
                        <NavItem id="users" icon={Users} label="Users & Cleaners" />
                        <NavItem id="services" icon={Layers} label="Services & Pricing" />
                        <NavItem id="promos" icon={Tag} label="Promo Codes" />
                    </nav>

                    <button onClick={logout} className="flex items-center gap-3 px-4 py-3 text-red-600 mt-auto">
                        <LogOut className="w-5 h-5" />
                        Sign Out
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 min-w-0 h-screen overflow-y-auto">
                {/* Mobile Header Bar */}
                <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
                    <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -ml-2">
                        <Menu className="w-6 h-6 text-gray-600" />
                    </button>
                    <span className="font-semibold text-gray-900">Admin Panel</span>
                    <div className="w-8" />
                </div>

                <div className="p-6 md:p-10 max-w-7xl mx-auto">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
}
