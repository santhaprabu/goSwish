import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getCleanerJobs, getCleanerByUserId, createTransaction } from '../storage';
import { ChevronLeft, Download, Plus, DollarSign, Calendar, ArrowUpRight, ArrowDownLeft, AlertCircle } from 'lucide-react';

export default function PayoutManagement({ onBack }) {
    const { user } = useApp();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [balance, setBalance] = useState(0);

    const loadData = async () => {
        if (!user?.uid) return;
        try {
            setLoading(true);
            const cleanerProfile = await getCleanerByUserId(user.uid);
            if (!cleanerProfile) return;

            const allDocs = await getCleanerJobs(cleanerProfile.id);

            // Calculate Balance & Filter Transactions
            let currentBalance = 0;
            const history = allDocs.map(doc => {
                const isPayout = doc.id.startsWith('txn_') || doc.type === 'payout' || doc.type === 'withdrawal';
                const amount = doc.amount || doc.earnings || 0;

                // If it's a generic job, it ADDS to balance. 
                // If it's a payout transaction, it SUBTRACTS (usually stored as negative?) or we treat it as negative.
                // Our createTransaction stores amount. If it's a payout, it should be negative or handled as such.
                // Let's assume earnings are +, payouts are -.
                const effectiveAmount = isPayout ? -Math.abs(amount) : Math.abs(amount);
                currentBalance += effectiveAmount;

                return {
                    id: doc.id,
                    type: isPayout ? 'payout' : 'earning',
                    date: new Date(doc.createdAt || doc.completedAt || Date.now()),
                    amount: effectiveAmount,
                    description: isPayout
                        ? (doc.description || 'Payout to Bank')
                        : `${doc.serviceType || 'Service'} - ${doc.customerName || 'Client'}`
                };
            }).sort((a, b) => b.date - a.date);

            setTransactions(history);
            setBalance(currentBalance);

        } catch (error) {
            console.error('Error loading payouts:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [user?.uid]);

    const handleRequestPayout = async () => {
        if (balance <= 0) return;

        // Simulating Payout
        const amount = balance;
        const confirm = window.confirm(`Request payout of $${amount.toFixed(2)}?`);
        if (!confirm) return;

        try {
            const cleanerProfile = await getCleanerByUserId(user.uid);
            await createTransaction(cleanerProfile.id, {
                type: 'payout',
                amount: amount,
                description: 'Withdrawal to Bank Account',
                status: 'processing'
            });
            await loadData(); // Refresh
        } catch (e) {
            console.error("Payout failed", e);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <div className="app-bar flex items-center justify-between px-4 py-3">
                <button onClick={onBack} className="p-2">
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <h1 className="text-lg font-semibold">Payouts</h1>
                <div className="w-10"></div>
            </div>

            <div className="p-6">
                <div className="bg-black rounded-2xl p-6 text-white shadow-lg mb-6">
                    <p className="text-primary-100 text-sm mb-1">Available Balance</p>
                    <h2 className="text-4xl font-bold mb-4">${balance.toFixed(2)}</h2>
                    <button
                        onClick={handleRequestPayout}
                        disabled={balance <= 0}
                        className="w-full py-3 bg-white text-primary-700 font-semibold rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <Download className="w-5 h-5" />
                        Request Payout
                    </button>
                    <p className="text-xs text-primary-200 mt-3 text-center">
                        Payouts typically process within 1-2 business days.
                    </p>
                </div>

                <h3 className="font-semibold text-gray-900 mb-4">Transaction History</h3>

                <div className="space-y-4">
                    {loading ? (
                        <div className="text-center py-10 text-gray-500">Loading...</div>
                    ) : transactions.length === 0 ? (
                        <div className="text-center py-10">
                            <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">No transactions yet.</p>
                        </div>
                    ) : (
                        transactions.map(txn => (
                            <div key={txn.id} className="card p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${txn.type === 'earning' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                        {txn.type === 'earning' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{txn.description}</p>
                                        <p className="text-xs text-gray-500">{txn.date.toLocaleDateString()} • {txn.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                </div>
                                <span className={`font-bold ${txn.type === 'earning' ? 'text-green-600' : 'text-gray-900'}`}>
                                    {txn.amount > 0 ? '+' : ''}{txn.amount.toFixed(2)}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
