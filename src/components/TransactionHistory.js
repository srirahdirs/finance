import React, { useState, useEffect } from 'react';
import dataRefreshManager from '../utils/dataRefresh';

const TransactionHistory = () => {
    const [transactions, setTransactions] = useState([]);
    const [incomeSummary, setIncomeSummary] = useState({
        totalIncome: 0,
        transactionCount: 0,
        monthlyIncome: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const refreshData = () => {
            fetchTransactions();
            fetchIncomeSummary();
        };

        refreshData();

        // Register with global refresh manager
        dataRefreshManager.registerRefreshCallback(refreshData);

        // Cleanup on unmount
        return () => {
            dataRefreshManager.unregisterRefreshCallback(refreshData);
        };
    }, []);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const response = await fetch('https://finance-backend-kappa.vercel.app/api/transactions');
            const data = await response.json();
            setTransactions(data);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
        }
    };


    const fetchIncomeSummary = async () => {
        try {
            const response = await fetch('https://finance-backend-kappa.vercel.app/api/transactions');
            const transactions = await response.json();

            // Calculate income summary from actual transactions
            const interestTransactions = transactions.filter(t => t.type === 'interest');
            const totalIncome = interestTransactions.reduce((sum, t) => sum + t.amount, 0);

            // Calculate monthly income
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            const monthlyIncome = interestTransactions
                .filter(transaction => {
                    const transactionDate = new Date(transaction.transactionDate);
                    return transactionDate.getMonth() === currentMonth &&
                        transactionDate.getFullYear() === currentYear;
                })
                .reduce((sum, transaction) => sum + transaction.amount, 0);

            setIncomeSummary({
                totalIncome,
                transactionCount: interestTransactions.length,
                monthlyIncome
            });
        } catch (error) {
            console.error('Error fetching income summary:', error);
        }
    };

    const getTransactionTypeColor = (type) => {
        switch (type) {
            case 'interest': return 'badge-success';
            case 'principal': return 'badge-info';
            case 'pre_close': return 'badge-danger';
            case 'renewal': return 'badge-warning';
            default: return 'badge-info';
        }
    };

    const getPaymentMethodIcon = (method) => {
        switch (method) {
            case 'cash': return '💵';
            case 'bank_transfer': return '🏦';
            case 'cheque': return '📄';
            default: return '💰';
        }
    };


    return (
        <div className="space-y-responsive">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
                <div>
                    {/* <h1 className="text-3xl font-bold text-gray-900">Transaction History</h1>
                    <p className="text-gray-600 mt-1">Complete financial transaction records</p> */}
                </div>
                <button
                    onClick={() => {
                        fetchTransactions();
                        fetchIncomeSummary();
                    }}
                    className="btn btn-outline text-responsive-sm w-full sm:w-auto"
                >
                    🔄 Refresh Data
                </button>
            </div>

            {/* Income Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="stat-card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="stat-label">Total Income</p>
                            <p className="stat-number text-success-600">
                                ₹{incomeSummary.totalIncome.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">All time interest collected</p>
                        </div>
                        <div className="p-3 rounded-lg bg-success-100">
                            <span className="text-2xl">💵</span>
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="stat-label">Total Transactions</p>
                            <p className="stat-number text-primary-600">
                                {incomeSummary.transactionCount}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">Interest collection transactions</p>
                        </div>
                        <div className="p-3 rounded-lg bg-primary-100">
                            <span className="text-2xl">📋</span>
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="stat-label">This Month Income</p>
                            <p className="stat-number text-yellow-600">
                                ₹{incomeSummary.monthlyIncome.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">Interest collected this month</p>
                        </div>
                        <div className="p-3 rounded-lg bg-yellow-100">
                            <span className="text-2xl">📊</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="card">
                <div className="card-header">
                    <h2 className="text-responsive-lg font-semibold text-gray-900">All Transactions</h2>
                    <p className="text-responsive-sm text-gray-500 mt-1">
                        {transactions.length} transactions recorded
                    </p>
                </div>
                <div className="card-body">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                        </div>
                    ) : transactions.length > 0 ? (
                        <div className="table-responsive">
                            <table className="table">
                                <thead className="table-header">
                                    <tr>
                                        <th className="table-header-cell">Date & Time</th>
                                        <th className="table-header-cell">Client</th>
                                        <th className="table-header-cell">Type</th>
                                        <th className="table-header-cell">Amount</th>
                                        <th className="table-header-cell">Description</th>
                                        <th className="table-header-cell">Payment Method</th>
                                    </tr>
                                </thead>
                                <tbody className="table-body">
                                    {transactions.map((transaction, index) => (
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
                                                            {transaction.client?.name?.charAt(0).toUpperCase() || 'N'}
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
                                                <span className={`badge ${getTransactionTypeColor(transaction.type)}`}>
                                                    {transaction.type.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="table-cell">
                                                <div className="text-sm font-semibold text-gray-900">
                                                    ₹{transaction.amount.toLocaleString()}
                                                </div>
                                            </td>
                                            <td className="table-cell">
                                                <div className="text-sm text-gray-900 max-w-xs">
                                                    {transaction.description}
                                                </div>
                                            </td>
                                            <td className="table-cell">
                                                <div className="flex items-center">
                                                    <span className="mr-2">{getPaymentMethodIcon(transaction.paymentMethod)}</span>
                                                    <span className="text-sm text-gray-700 capitalize">
                                                        {transaction.paymentMethod.replace('_', ' ')}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="text-gray-400 text-6xl mb-4">📋</div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
                            <p className="text-gray-500">Start collecting interest payments to see transaction history.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Transaction Insights */}
            {transactions.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                        </div>
                        <div className="card-body">
                            <div className="space-y-4">
                                {transactions.slice(0, 5).map((transaction, index) => (
                                    <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                                        <div className="flex items-center">
                                            <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                                                <span className="text-primary-600 text-xs">
                                                    {getPaymentMethodIcon(transaction.paymentMethod)}
                                                </span>
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {transaction.client?.name || 'N/A'}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {new Date(transaction.transactionDate).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-semibold text-gray-900">
                                                ₹{transaction.amount.toLocaleString()}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {transaction.type}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h3 className="text-lg font-semibold text-gray-900">Payment Methods</h3>
                        </div>
                        <div className="card-body">
                            <div className="space-y-3">
                                {['cash', 'bank_transfer', 'cheque'].map((method) => {
                                    const count = transactions.filter(t => t.paymentMethod === method).length;
                                    const total = transactions.filter(t => t.paymentMethod === method)
                                        .reduce((sum, t) => sum + t.amount, 0);

                                    return (
                                        <div key={method} className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <span className="mr-2">{getPaymentMethodIcon(method)}</span>
                                                <span className="text-sm font-medium text-gray-700 capitalize">
                                                    {method.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-semibold text-gray-900">
                                                    {count} transactions
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    ₹{total.toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TransactionHistory;