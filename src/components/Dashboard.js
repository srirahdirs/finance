import React, { useState, useEffect } from 'react';
import dataRefreshManager from '../utils/dataRefresh';

const Dashboard = ({ onNavigate }) => {
    const [stats, setStats] = useState({
        totalClients: 0,
        activeLoans: 0,
        totalLoanAmount: 0,
        monthlyIncome: 0
    });

    const [recentTransactions, setRecentTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();

        // Register with global refresh manager
        dataRefreshManager.registerRefreshCallback(fetchDashboardData);

        // Cleanup on unmount
        return () => {
            dataRefreshManager.unregisterRefreshCallback(fetchDashboardData);
        };
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // Fetch all data in parallel for better performance
            const [clientsResponse, loansResponse, transactionsResponse] = await Promise.all([
                fetch('https://finance-backend-kappa.vercel.app/api/clients'),
                fetch('https://finance-backend-kappa.vercel.app/api/loans'),
                fetch('https://finance-backend-kappa.vercel.app/api/transactions')
            ]);

            const [clients, loans, transactions] = await Promise.all([
                clientsResponse.json(),
                loansResponse.json(),
                transactionsResponse.json()
            ]);

            // Calculate monthly income from transactions (more accurate)
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();

            const monthlyIncome = transactions
                .filter(transaction => {
                    const transactionDate = new Date(transaction.transactionDate);
                    return transaction.type === 'interest' &&
                        transactionDate.getMonth() === currentMonth &&
                        transactionDate.getFullYear() === currentYear;
                })
                .reduce((sum, transaction) => sum + transaction.amount, 0);

            setStats({
                totalClients: clients.length,
                activeLoans: loans.filter(loan => loan.status === 'active').length,
                totalLoanAmount: loans.reduce((sum, loan) => sum + loan.loanAmount, 0),
                monthlyIncome: monthlyIncome
            });

            setRecentTransactions(transactions.slice(0, 5));
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const StatCard = ({ title, value, subtitle, icon, color }) => (
        <div className="stat-card">
            <div className="flex items-center justify-between">
                <div>
                    <p className="stat-label">{title}</p>
                    <p className={`stat-number ${color}`}>{value}</p>
                    <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
                </div>
                <div className={`p-3 rounded-lg ${color === 'text-primary-600' ? 'bg-primary-100' : color === 'text-success-600' ? 'bg-success-100' : color === 'text-yellow-600' ? 'bg-yellow-100' : 'bg-gray-100'}`}>
                    <span className="text-2xl">{icon}</span>
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-responsive">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
                <div>
                    {/* <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-600 mt-1">Overview of your loan management system</p> */}
                </div>
                <button
                    onClick={fetchDashboardData}
                    className="btn btn-outline text-responsive-sm w-full sm:w-auto"
                >
                    🔄 Refresh Data
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <StatCard
                    title="Total Clients"
                    value={stats.totalClients}
                    subtitle="Active clients in system"
                    icon="👥"
                    color="text-primary-600"
                />

                <StatCard
                    title="Active Loans"
                    value={stats.activeLoans}
                    subtitle="Currently active loans"
                    icon="💰"
                    color="text-success-600"
                />

                <StatCard
                    title="Total Loan Amount"
                    value={`₹${stats.totalLoanAmount.toLocaleString()}`}
                    subtitle="Total amount disbursed"
                    icon="📊"
                    color="text-yellow-600"
                />

                <StatCard
                    title="Monthly Income"
                    value={`₹${stats.monthlyIncome.toLocaleString()}`}
                    subtitle="Interest collected this month"
                    icon="💵"
                    color="text-gray-600"
                />
            </div>

            {/* Recent Transactions */}
            <div className="card">
                <div className="card-header">
                    <h2 className="text-responsive-lg font-semibold text-gray-900">Recent Transactions</h2>
                    <p className="text-responsive-sm text-gray-500 mt-1">Latest financial activities</p>
                </div>
                <div className="card-body">
                    {recentTransactions.length > 0 ? (
                        <>
                            {/* Desktop Table */}
                            <div className="table-responsive hidden sm:block">
                                <table className="table">
                                    <thead className="table-header">
                                        <tr>
                                            <th className="table-header-cell">Date</th>
                                            <th className="table-header-cell">Client</th>
                                            <th className="table-header-cell">Type</th>
                                            <th className="table-header-cell">Amount</th>
                                            <th className="table-header-cell">Description</th>
                                        </tr>
                                    </thead>
                                    <tbody className="table-body">
                                        {recentTransactions.map((transaction, index) => (
                                            <tr key={index} className="table-row">
                                                <td className="table-cell">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {new Date(transaction.transactionDate).toLocaleDateString('en-IN', {
                                                            year: 'numeric',
                                                            month: '2-digit',
                                                            day: '2-digit'
                                                        })}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {new Date(transaction.transactionDate).toLocaleTimeString('en-IN', {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                            second: '2-digit',
                                                            hour12: true
                                                        })}
                                                    </div>
                                                </td>
                                                <td className="table-cell">
                                                    <div className="flex items-center">
                                                        <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                                                            <span className="text-primary-600 text-sm font-medium">
                                                                {transaction.client?.name?.charAt(0) || 'N'}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {transaction.client?.name || 'N/A'}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {transaction.client?.email || ''}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="table-cell">
                                                    <span className={`badge ${transaction.type === 'interest' ? 'badge-success' : 'badge-info'}`}>
                                                        {transaction.type}
                                                    </span>
                                                </td>
                                                <td className="table-cell">
                                                    <div className="text-sm font-semibold text-gray-900">
                                                        ₹{transaction.amount.toLocaleString()}
                                                    </div>
                                                </td>
                                                <td className="table-cell">
                                                    <div className="text-sm text-gray-900">
                                                        {transaction.description}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Cards */}
                            <div className="block sm:hidden space-y-4">
                                {recentTransactions.map((transaction, index) => (
                                    <div key={index} className="table-mobile-card">
                                        <div className="table-mobile-card-header">
                                            <div className="flex items-center">
                                                <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                                                    <span className="text-primary-600 text-sm font-medium">
                                                        {transaction.client?.name?.charAt(0) || 'N'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {transaction.client?.name || 'N/A'}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {transaction.client?.email || ''}
                                                    </div>
                                                </div>
                                            </div>
                                            <span className={`badge ${transaction.type === 'interest' ? 'badge-success' : 'badge-info'}`}>
                                                {transaction.type}
                                            </span>
                                        </div>
                                        <div className="table-mobile-card-body">
                                            <div className="table-mobile-card-row">
                                                <span className="table-mobile-card-label">Date</span>
                                                <span className="table-mobile-card-value">
                                                    {new Date(transaction.transactionDate).toLocaleDateString('en-IN', {
                                                        year: 'numeric',
                                                        month: '2-digit',
                                                        day: '2-digit'
                                                    })}
                                                </span>
                                            </div>
                                            <div className="table-mobile-card-row">
                                                <span className="table-mobile-card-label">Amount</span>
                                                <span className="table-mobile-card-value font-semibold">
                                                    ₹{transaction.amount.toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="table-mobile-card-row">
                                                <span className="table-mobile-card-label">Description</span>
                                                <span className="table-mobile-card-value">
                                                    {transaction.description}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-12">
                            <div className="text-gray-400 text-6xl mb-4">📋</div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions yet</h3>
                            <p className="text-gray-500">Start by creating loans and collecting interest payments.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="card">
                    <div className="card-body text-center">
                        <div className="text-4xl mb-4">👥</div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Clients</h3>
                        <p className="text-gray-500 text-sm mb-4">Add new clients and update their information</p>
                        <button
                            className="btn btn-primary w-full"
                            onClick={() => onNavigate('clients')}
                        >
                            Add New Client
                        </button>
                    </div>
                </div>

                <div className="card">
                    <div className="card-body text-center">
                        <div className="text-4xl mb-4">💰</div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Loan</h3>
                        <p className="text-gray-500 text-sm mb-4">Set up new loans with interest rates</p>
                        <button
                            className="btn btn-success w-full"
                            onClick={() => onNavigate('loans')}
                        >
                            Create New Loan
                        </button>
                    </div>
                </div>

                <div className="card">
                    <div className="card-body text-center">
                        <div className="text-4xl mb-4">📊</div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">View Reports</h3>
                        <p className="text-gray-500 text-sm mb-4">Check transaction history and analytics</p>
                        <button
                            className="btn btn-secondary w-full"
                            onClick={() => onNavigate('transactions')}
                        >
                            View Reports
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;