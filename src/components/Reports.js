import React, { useState, useEffect } from 'react';
import dataRefreshManager from '../utils/dataRefresh';

const Reports = () => {
    const [reports, setReports] = useState({
        clients: [],
        loans: [],
        transactions: []
    });
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState('overview');
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        const refreshData = () => {
            fetchReportsData();
        };

        refreshData();

        // Register with global refresh manager
        dataRefreshManager.registerRefreshCallback(refreshData);

        // Cleanup on unmount
        return () => {
            dataRefreshManager.unregisterRefreshCallback(refreshData);
        };
    }, []);

    const fetchReportsData = async () => {
        try {
            setLoading(true);
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

            setReports({ clients, loans, transactions });
        } catch (error) {
            console.error('Error fetching reports data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getDateRangeTransactions = () => {
        const startDate = new Date(dateRange.startDate);
        const endDate = new Date(dateRange.endDate);

        return reports.transactions.filter(transaction => {
            const transactionDate = new Date(transaction.transactionDate);
            return transactionDate >= startDate && transactionDate <= endDate;
        });
    };

    const getMonthlyIncomeReport = () => {
        const monthlyData = {};

        reports.transactions
            .filter(t => t.type === 'interest')
            .forEach(transaction => {
                const date = new Date(transaction.transactionDate);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

                if (!monthlyData[monthKey]) {
                    monthlyData[monthKey] = {
                        month: date.toLocaleDateString('en-IN', { year: 'numeric', month: 'long' }),
                        totalIncome: 0,
                        transactionCount: 0,
                        clients: new Set()
                    };
                }

                monthlyData[monthKey].totalIncome += transaction.amount;
                monthlyData[monthKey].transactionCount += 1;
                monthlyData[monthKey].clients.add(transaction.client);
            });

        return Object.values(monthlyData).map(data => ({
            ...data,
            uniqueClients: data.clients.size,
            clients: undefined // Remove Set from final data
        })).sort((a, b) => b.month.localeCompare(a.month));
    };

    const getClientReport = () => {
        return reports.clients.map(client => {
            const clientLoans = reports.loans.filter(loan => loan.client._id === client._id);
            const clientTransactions = reports.transactions.filter(t => t.client === client._id);

            const totalLoanAmount = clientLoans.reduce((sum, loan) => sum + loan.loanAmount, 0);
            const totalCollected = clientLoans.reduce((sum, loan) => sum + loan.totalCollected, 0);
            const totalPending = clientLoans.reduce((sum, loan) => sum + loan.remainingAmount, 0);
            const activeLoans = clientLoans.filter(loan => loan.status === 'active').length;

            return {
                ...client,
                totalLoanAmount,
                totalCollected,
                totalPending,
                activeLoans,
                totalLoans: clientLoans.length,
                transactionCount: clientTransactions.length
            };
        });
    };

    const getLoanPerformanceReport = () => {
        return reports.loans.map(loan => {
            const loanTransactions = reports.transactions.filter(t => t.loan === loan._id);
            const interestTransactions = loanTransactions.filter(t => t.type === 'interest');

            const totalInterestCollected = interestTransactions.reduce((sum, t) => sum + t.amount, 0);
            const monthsActive = Math.floor((new Date() - new Date(loan.loanDate)) / (1000 * 60 * 60 * 24 * 30));
            const expectedInterest = monthsActive * loan.monthlyInterest;
            const performanceRate = expectedInterest > 0 ? (totalInterestCollected / expectedInterest) * 100 : 0;

            return {
                ...loan,
                totalInterestCollected,
                monthsActive,
                expectedInterest,
                performanceRate,
                transactionCount: loanTransactions.length
            };
        });
    };

    const getDateRangeReport = () => {
        const rangeTransactions = getDateRangeTransactions();
        const interestTransactions = rangeTransactions.filter(t => t.type === 'interest');

        const totalIncome = interestTransactions.reduce((sum, t) => sum + t.amount, 0);
        const uniqueClients = new Set(interestTransactions.map(t => t.client)).size;

        return {
            totalIncome,
            transactionCount: rangeTransactions.length,
            interestTransactions: interestTransactions.length,
            uniqueClients,
            averageTransaction: interestTransactions.length > 0 ? totalIncome / interestTransactions.length : 0
        };
    };

    const exportToCSV = (data, filename) => {
        if (!data || data.length === 0) return;

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const ReportCard = ({ title, value, subtitle, icon, color, trend }) => (
        <div className="stat-card">
            <div className="flex items-center justify-between">
                <div>
                    <p className="stat-label">{title}</p>
                    <p className={`stat-number text-${color}-600`}>{value}</p>
                    {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
                    {trend && <p className="text-xs text-green-600 mt-1">{trend}</p>}
                </div>
                <div className={`p-3 rounded-lg bg-${color}-100`}>
                    <span className="text-2xl">{icon}</span>
                </div>
            </div>
        </div>
    );

    const renderOverviewReport = () => {
        const monthlyIncome = getMonthlyIncomeReport();
        const currentMonth = monthlyIncome[0];
        const previousMonth = monthlyIncome[1];
        const growth = previousMonth ? ((currentMonth?.totalIncome - previousMonth.totalIncome) / previousMonth.totalIncome * 100) : 0;

        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    <ReportCard
                        title="Total Clients"
                        value={reports.clients.length}
                        subtitle="Active clients"
                        icon="👥"
                        color="primary"
                    />
                    <ReportCard
                        title="Active Loans"
                        value={reports.loans.filter(l => l.status === 'active').length}
                        subtitle="Currently active"
                        icon="💰"
                        color="success"
                    />
                    <ReportCard
                        title="Total Loan Amount"
                        value={`₹${reports.loans.reduce((sum, l) => sum + l.loanAmount, 0).toLocaleString()}`}
                        subtitle="Principal disbursed"
                        icon="📊"
                        color="info"
                    />
                    <ReportCard
                        title="Monthly Income"
                        value={`₹${currentMonth?.totalIncome.toLocaleString() || '0'}`}
                        subtitle={currentMonth?.month || 'Current month'}
                        icon="💵"
                        color="yellow"
                        trend={growth > 0 ? `↗️ +${growth.toFixed(1)}%` : growth < 0 ? `↘️ ${growth.toFixed(1)}%` : ''}
                    />
                </div>

                <div className="card">
                    <div className="card-header">
                        <h3 className="text-lg font-semibold text-gray-900">Monthly Income Trend</h3>
                        <p className="text-sm text-gray-500">Last 6 months performance</p>
                    </div>
                    <div className="card-body">
                        <div className="overflow-x-auto">
                            <table className="table">
                                <thead className="table-header">
                                    <tr>
                                        <th className="table-header-cell">Month</th>
                                        <th className="table-header-cell">Income</th>
                                        <th className="table-header-cell">Transactions</th>
                                        <th className="table-header-cell">Unique Clients</th>
                                        <th className="table-header-cell">Avg per Transaction</th>
                                    </tr>
                                </thead>
                                <tbody className="table-body">
                                    {monthlyIncome.slice(0, 6).map((month, index) => (
                                        <tr key={index} className="table-row">
                                            <td className="table-cell font-medium">{month.month}</td>
                                            <td className="table-cell text-green-600 font-semibold">₹{month.totalIncome.toLocaleString()}</td>
                                            <td className="table-cell">{month.transactionCount}</td>
                                            <td className="table-cell">{month.uniqueClients}</td>
                                            <td className="table-cell">₹{Math.round(month.totalIncome / month.transactionCount).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderClientReport = () => {
        const clientData = getClientReport();

        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">Client Performance Report</h3>
                    <button
                        onClick={() => exportToCSV(clientData, 'client-report.csv')}
                        className="btn btn-outline"
                    >
                        📊 Export CSV
                    </button>
                </div>

                <div className="card">
                    <div className="card-body">
                        <div className="overflow-x-auto">
                            <table className="table">
                                <thead className="table-header">
                                    <tr>
                                        <th className="table-header-cell">Client</th>
                                        <th className="table-header-cell">Total Loans</th>
                                        <th className="table-header-cell">Active Loans</th>
                                        <th className="table-header-cell">Total Amount</th>
                                        <th className="table-header-cell">Collected</th>
                                        <th className="table-header-cell">Pending</th>
                                        <th className="table-header-cell">Transactions</th>
                                    </tr>
                                </thead>
                                <tbody className="table-body">
                                    {clientData.map((client, index) => (
                                        <tr key={index} className="table-row">
                                            <td className="table-cell">
                                                <div className="flex items-center">
                                                    <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                                                        <span className="text-primary-600 text-sm font-medium">
                                                            {client.name.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">{client.name}</div>
                                                        <div className="text-xs text-gray-500">{client.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="table-cell">{client.totalLoans}</td>
                                            <td className="table-cell">
                                                <span className={`badge ${client.activeLoans > 0 ? 'badge-success' : 'badge-secondary'}`}>
                                                    {client.activeLoans}
                                                </span>
                                            </td>
                                            <td className="table-cell font-semibold">₹{client.totalLoanAmount.toLocaleString()}</td>
                                            <td className="table-cell text-green-600">₹{client.totalCollected.toLocaleString()}</td>
                                            <td className="table-cell text-red-600">₹{client.totalPending.toLocaleString()}</td>
                                            <td className="table-cell">{client.transactionCount}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderLoanPerformanceReport = () => {
        const loanData = getLoanPerformanceReport();

        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">Loan Performance Report</h3>
                    <button
                        onClick={() => exportToCSV(loanData, 'loan-performance.csv')}
                        className="btn btn-outline"
                    >
                        📊 Export CSV
                    </button>
                </div>

                <div className="card">
                    <div className="card-body">
                        <div className="overflow-x-auto">
                            <table className="table">
                                <thead className="table-header">
                                    <tr>
                                        <th className="table-header-cell">Client</th>
                                        <th className="table-header-cell">Loan Amount</th>
                                        <th className="table-header-cell">Monthly Interest</th>
                                        <th className="table-header-cell">Months Active</th>
                                        <th className="table-header-cell">Expected Interest</th>
                                        <th className="table-header-cell">Collected Interest</th>
                                        <th className="table-header-cell">Performance</th>
                                        <th className="table-header-cell">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="table-body">
                                    {loanData.map((loan, index) => (
                                        <tr key={index} className="table-row">
                                            <td className="table-cell font-medium">{loan.client?.name}</td>
                                            <td className="table-cell">₹{loan.loanAmount.toLocaleString()}</td>
                                            <td className="table-cell">₹{loan.monthlyInterest.toLocaleString()}</td>
                                            <td className="table-cell">{loan.monthsActive}</td>
                                            <td className="table-cell">₹{loan.expectedInterest.toLocaleString()}</td>
                                            <td className="table-cell text-green-600">₹{loan.totalInterestCollected.toLocaleString()}</td>
                                            <td className="table-cell">
                                                <span className={`badge ${loan.performanceRate >= 100 ? 'badge-success' :
                                                    loan.performanceRate >= 80 ? 'badge-warning' : 'badge-danger'
                                                    }`}>
                                                    {loan.performanceRate.toFixed(1)}%
                                                </span>
                                            </td>
                                            <td className="table-cell">
                                                <span className={`badge ${loan.status === 'active' ? 'badge-success' :
                                                    loan.status === 'closed' ? 'badge-danger' : 'badge-info'
                                                    }`}>
                                                    {loan.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderDateRangeReport = () => {
        const rangeData = getDateRangeReport();

        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">Date Range Report</h3>
                    <div className="flex space-x-3">
                        <input
                            type="date"
                            value={dateRange.startDate}
                            onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                            className="form-input"
                        />
                        <input
                            type="date"
                            value={dateRange.endDate}
                            onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                            className="form-input"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    <ReportCard
                        title="Total Income"
                        value={`₹${rangeData.totalIncome.toLocaleString()}`}
                        subtitle={`${dateRange.startDate} to ${dateRange.endDate}`}
                        icon="💵"
                        color="green"
                    />
                    <ReportCard
                        title="Total Transactions"
                        value={rangeData.transactionCount}
                        subtitle="All transaction types"
                        icon="📋"
                        color="blue"
                    />
                    <ReportCard
                        title="Interest Transactions"
                        value={rangeData.interestTransactions}
                        subtitle="Interest collections only"
                        icon="💰"
                        color="yellow"
                    />
                    <ReportCard
                        title="Unique Clients"
                        value={rangeData.uniqueClients}
                        subtitle="Active clients in period"
                        icon="👥"
                        color="purple"
                    />
                </div>

                <div className="card">
                    <div className="card-header">
                        <h3 className="text-lg font-semibold text-gray-900">Transaction Details</h3>
                        <p className="text-sm text-gray-500">All transactions in selected date range</p>
                    </div>
                    <div className="card-body">
                        <div className="overflow-x-auto">
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
                                    {getDateRangeTransactions().map((transaction, index) => (
                                        <tr key={index} className="table-row">
                                            <td className="table-cell">
                                                {new Date(transaction.transactionDate).toLocaleDateString('en-IN')}
                                            </td>
                                            <td className="table-cell">{transaction.client?.name || 'N/A'}</td>
                                            <td className="table-cell">
                                                <span className={`badge ${transaction.type === 'interest' ? 'badge-success' :
                                                    transaction.type === 'pre_close' ? 'badge-danger' : 'badge-info'
                                                    }`}>
                                                    {transaction.type}
                                                </span>
                                            </td>
                                            <td className="table-cell font-semibold">₹{transaction.amount.toLocaleString()}</td>
                                            <td className="table-cell">{transaction.description}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-responsive">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
                <div>
                    {/* <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
                    <p className="text-gray-600 mt-1">Comprehensive financial reports and insights</p> */}
                </div>
                <button
                    onClick={fetchReportsData}
                    className="btn btn-outline text-responsive-sm w-full sm:w-auto"
                >
                    🔄 Refresh Data
                </button>
            </div>

            {/* Report Type Selector */}
            <div className="card">
                <div className="card-body">
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                        <button
                            onClick={() => setSelectedReport('overview')}
                            className={`btn ${selectedReport === 'overview' ? 'btn-primary' : 'btn-outline'}`}
                        >
                            📊 Overview Report
                        </button>
                        <button
                            onClick={() => setSelectedReport('clients')}
                            className={`btn ${selectedReport === 'clients' ? 'btn-primary' : 'btn-outline'}`}
                        >
                            👥 Client Report
                        </button>
                        <button
                            onClick={() => setSelectedReport('loans')}
                            className={`btn ${selectedReport === 'loans' ? 'btn-primary' : 'btn-outline'}`}
                        >
                            💰 Loan Performance
                        </button>
                        <button
                            onClick={() => setSelectedReport('daterange')}
                            className={`btn ${selectedReport === 'daterange' ? 'btn-primary' : 'btn-outline'}`}
                        >
                            📅 Date Range Report
                        </button>
                    </div>
                </div>
            </div>

            {/* Report Content */}
            {selectedReport === 'overview' && renderOverviewReport()}
            {selectedReport === 'clients' && renderClientReport()}
            {selectedReport === 'loans' && renderLoanPerformanceReport()}
            {selectedReport === 'daterange' && renderDateRangeReport()}
        </div>
    );
};

export default Reports;
