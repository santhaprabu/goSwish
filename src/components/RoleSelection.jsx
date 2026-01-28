import { Home, Sparkles, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function RoleSelection({ onRoleSelected }) {
    const { setRole } = useApp();

    const handleRoleSelect = (role) => {
        setRole(role);
        onRoleSelected(role);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col">
            {/* Header */}
            <div className="pt-12 pb-8 px-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl shadow-lg shadow-primary-500/30 mb-6">
                    <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to GoSwish</h1>
                <p className="text-gray-500 text-lg">How would you like to get started?</p>
            </div>

            {/* Role Cards */}
            <div className="flex-1 px-6 pb-8 flex flex-col justify-center gap-5 max-w-md mx-auto w-full">
                {/* Customer Card */}
                <button
                    onClick={() => handleRoleSelect('customer')}
                    className="card card-interactive p-6 flex items-start gap-5 text-left group
                     bg-gradient-to-br from-primary-500 to-primary-600 border border-gray-100
                     hover:border-primary-200 hover:shadow-primary-100/50"
                >
                    <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 
                          rounded-2xl flex items-center justify-center
                          group-hover:from-primary-200 group-hover:to-primary-300 transition-colors">
                        <Home className="w-8 h-8 text-white" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-xl font-bold text-gray-900">I'm a Home Owner</h2>
                            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-500 
                                     group-hover:translate-x-1 transition-all" />
                        </div>
                        <p className="text-gray-500 leading-relaxed">
                            Book trusted cleaning professionals for your home or office
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                            <span className="badge badge-primary">Book Instantly</span>
                            <span className="badge bg-gray-100 text-gray-600">Vetted Cleaners</span>
                        </div>
                    </div>
                </button>

                {/* Cleaner Card */}
                <button
                    onClick={() => handleRoleSelect('cleaner')}
                    className="card card-interactive p-6 flex items-start gap-5 text-left group
                     bg-gradient-to-br from-primary-500 to-primary-600 border border-gray-100
                     hover:border-primary-200 hover:shadow-primary-100/50"
                >
                    <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 
                          rounded-2xl flex items-center justify-center
                          group-hover:from-primary-200 group-hover:to-primary-300 transition-colors">
                        <Sparkles className="w-8 h-8 text-white" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-xl font-bold text-gray-900">I'm a Cleaner</h2>
                            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-secondary-500 
                                     group-hover:translate-x-1 transition-all" />
                        </div>
                        <p className="text-gray-500 leading-relaxed">
                            Join our network and earn money with flexible cleaning jobs
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                            <span className="badge badge-secondary">Flexible Hours</span>
                            <span className="badge bg-gray-100 text-gray-600">Weekly Pay</span>
                        </div>
                    </div>
                </button>
            </div>

            {/* Footer */}
            <div className="px-6 pb-8 text-center">
                <p className="text-sm text-gray-400">
                    By continuing, you agree to our{' '}
                    <a href="#" className="text-primary-500 hover:underline">Terms of Service</a>
                    {' '}and{' '}
                    <a href="#" className="text-primary-500 hover:underline">Privacy Policy</a>
                </p>
            </div>
        </div>
    );
}
