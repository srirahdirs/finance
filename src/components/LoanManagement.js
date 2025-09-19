import React, { useState, useEffect } from 'react';
import PreCloseLoan from './PreCloseLoan';
import InterestCollection from './InterestCollection';
import ConfirmationPopup from './ConfirmationPopup';

const LoanManagement = () => {
    const [loans, setLoans] = useState([]);
    const [clients, setClients] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [showPreCloseModal, setShowPreCloseModal] = useState(false);
    const [showInterestModal, setShowInterestModal] = useState(false);
    const [showConfirmPopup, setShowConfirmPopup] = useState(false);
    const [selectedLoan, setSelectedLoan] = useState(null);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        clientId: '',
        loanAmount: '',
        interestRate: '',
        notes: ''
    });

    useEffect(() => {
        fetchLoans();
        fetchClients();
    }, []);

    const fetchLoans = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:5000/api/loans');
            const data = await response.json();
            setLoans(data);
        } catch (error) {
            console.error('Error fetching loans:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchClients = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/clients');
            const data = await response.json();
            setClients(data);
        } catch (error) {
            console.error('Error fetching clients:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const response = await fetch('http://localhost:5000/api/loans', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                setFormData({ clientId: '', loanAmount: '', interestRate: '', notes: '' });
                setShowForm(false);
                fetchLoans();
            }
        } catch (error) {
            console.error('Error creating loan:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleCollectInterest = (loan) => {
        setSelectedLoan(loan);
        setShowInterestModal(true);
    };

    const handleInterestSuccess = () => {
        fetchLoans();
        setShowInterestModal(false);
        setSelectedLoan(null);
    };

    const handleCloseInterestModal = () => {
        setShowInterestModal(false);
        setSelectedLoan(null);
    };

    const handlePreCloseLoan = (loan) => {
        setSelectedLoan(loan);
        setShowPreCloseModal(true);
    };

    const handlePreCloseSuccess = () => {
        fetchLoans();
        setShowPreCloseModal(false);
        setSelectedLoan(null);
    };

    const handleClosePreCloseModal = () => {
        setShowPreCloseModal(false);
        setSelectedLoan(null);
    };


    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'badge-success';
            case 'closed': return 'badge-danger';
            case 'renewed': return 'badge-info';
            default: return 'badge-secondary';
        }
    };

    const calculateMonthlyPending = (loan) => {
        if (loan.status === 'closed') return 0;

        // Calculate how much has been collected for the current month
        const currentMonthCollected = loan.totalCollected % loan.monthlyInterest;

        // If current month is fully collected, no pending
        if (currentMonthCollected === 0) return 0;

        // Calculate pending for current month
        const monthlyPending = loan.monthlyInterest - currentMonthCollected;

        return monthlyPending;
    };

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    {/* <h1 className="text-3xl font-bold text-gray-900">Loan Management</h1> */}
                    {/* <p className="text-gray-600 mt-1">Create and manage client loans</p> */}
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => setShowForm(!showForm)}
                >
                    {showForm ? '❌ Cancel' : '➕ Create New Loan'}
                </button>
            </div>

            {/* Create Loan Form */}
            {showForm && (
                <div className="card">
                    <div className="card-header">
                        <h2 className="text-lg font-semibold text-gray-900">Create New Loan</h2>
                        <p className="text-sm text-gray-500 mt-1">Set up a new loan for your client</p>
                    </div>
                    <div className="card-body">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="form-label">Select Client *</label>
                                    <select
                                        name="clientId"
                                        value={formData.clientId}
                                        onChange={handleInputChange}
                                        className="form-select"
                                        required
                                    >
                                        <option value="">Choose a client...</option>
                                        {clients.map((client) => (
                                            <option key={client._id} value={client._id}>
                                                {client.name} - {client.email}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="form-label">Loan Amount (₹) *</label>
                                    <input
                                        type="number"
                                        name="loanAmount"
                                        value={formData.loanAmount}
                                        onChange={handleInputChange}
                                        className="form-input"
                                        placeholder="100000"
                                        required
                                        min="1"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="form-label">Interest Rate (% per month) *</label>
                                    <input
                                        type="number"
                                        name="interestRate"
                                        value={formData.interestRate}
                                        onChange={handleInputChange}
                                        className="form-input"
                                        placeholder="3"
                                        required
                                        min="0"
                                        step="0.1"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Example: 3% = ₹3,000 monthly interest on ₹1,00,000
                                    </p>
                                </div>

                                <div>
                                    <label className="form-label">Notes</label>
                                    <textarea
                                        name="notes"
                                        value={formData.notes}
                                        onChange={handleInputChange}
                                        className="form-textarea"
                                        rows="3"
                                        placeholder="Additional notes about this loan..."
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={() => setShowForm(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={loading}
                                >
                                    {loading ? '⏳ Creating...' : '💾 Create Loan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Loans List */}
            <div className="card">
                <div className="card-header">
                    <h2 className="text-lg font-semibold text-gray-900">All Loans</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        {loans.length} total loans • {loans.filter(loan => loan.status === 'active').length} active • {loans.filter(loan => loan.status === 'closed').length} closed
                    </p>
                </div>
                <div className="card-body">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                        </div>
                    ) : loans.length > 0 ? (
                        <div className="overflow-hidden">
                            <table className="table">
                                <thead className="table-header">
                                    <tr>
                                        <th className="table-header-cell">Client</th>
                                        <th className="table-header-cell">Loan Details</th>
                                        <th className="table-header-cell">Interest</th>
                                        <th className="table-header-cell">Status</th>
                                        <th className="table-header-cell">Collected</th>
                                        <th className="table-header-cell">Pending Amount</th>
                                        <th className="table-header-cell">Monthly Pending</th>
                                        <th className="table-header-cell">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="table-body">
                                    {loans.map((loan) => (
                                        <tr key={loan._id} className="table-row">
                                            <td className="table-cell">
                                                <div className="flex items-center">
                                                    <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center mr-4">
                                                        <span className="text-primary-600 text-sm font-semibold">
                                                            {loan.client?.name?.charAt(0).toUpperCase() || 'N'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-semibold text-gray-900">
                                                            {loan.client?.name || 'N/A'}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {loan.client?.email || ''}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="table-cell">
                                                <div className="text-sm font-semibold text-gray-900">
                                                    ₹{loan.loanAmount.toLocaleString()}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {loan.interestRate}% per month
                                                </div>
                                            </td>
                                            <td className="table-cell">
                                                <div className="text-sm font-semibold text-success-600">
                                                    ₹{loan.monthlyInterest.toLocaleString()}
                                                </div>
                                                <div className="text-xs text-gray-500">per month</div>
                                            </td>
                                            <td className="table-cell">
                                                <span className={`badge ${getStatusColor(loan.status)}`}>
                                                    {loan.status}
                                                </span>
                                            </td>
                                            <td className="table-cell">
                                                <div className="text-sm font-semibold text-gray-900">
                                                    ₹{loan.totalCollected.toLocaleString()}
                                                </div>
                                            </td>
                                            <td className="table-cell">
                                                <div className="text-sm font-semibold text-danger-600">
                                                    ₹{loan.remainingAmount.toLocaleString()}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {loan.status === 'closed' ? 'Fully Paid' : 'Outstanding'}
                                                </div>
                                            </td>
                                            <td className="table-cell">
                                                <div className="text-sm font-semibold text-warning-600">
                                                    ₹{calculateMonthlyPending(loan).toLocaleString()}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {loan.status === 'closed' ? 'Complete' : 'This Month'}
                                                </div>
                                            </td>
                                            <td className="table-cell">
                                                {loan.status === 'active' && (
                                                    <div className="flex space-x-2">
                                                        <button
                                                            className="btn btn-success text-xs px-3 py-1"
                                                            onClick={() => handleCollectInterest(loan)}
                                                        >
                                                            💰 Collect
                                                        </button>
                                                        <button
                                                            className="btn btn-danger text-xs px-3 py-1"
                                                            onClick={() => handlePreCloseLoan(loan)}
                                                        >
                                                            🔒 Pre-Close
                                                        </button>
                                                    </div>
                                                )}
                                                {loan.status === 'closed' && (
                                                    <div className="flex space-x-2">
                                                        <span className="text-xs text-gray-400 px-3 py-1">
                                                            ✅ Completed
                                                        </span>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="text-gray-400 text-6xl mb-4">💰</div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No loans found</h3>
                            <p className="text-gray-500 mb-6">Create your first loan to get started.</p>
                            <button
                                className="btn btn-primary"
                                onClick={() => setShowForm(true)}
                            >
                                Create Your First Loan
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Loan Summary Cards */}
            {loans.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="stat-card">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="stat-label">Total Active Loans</p>
                                <p className="stat-number text-primary-600">
                                    {loans.filter(loan => loan.status === 'active').length}
                                </p>
                            </div>
                            <div className="p-3 rounded-lg bg-primary-100">
                                <span className="text-2xl">💰</span>
                            </div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="stat-label">Total Loan Amount</p>
                                <p className="stat-number text-success-600">
                                    ₹{loans.reduce((sum, loan) => sum + loan.loanAmount, 0).toLocaleString()}
                                </p>
                            </div>
                            <div className="p-3 rounded-lg bg-success-100">
                                <span className="text-2xl">📊</span>
                            </div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="stat-label">Total Pending Amount</p>
                                <p className="stat-number text-danger-600">
                                    ₹{loans.reduce((sum, loan) => sum + loan.remainingAmount, 0).toLocaleString()}
                                </p>
                            </div>
                            <div className="p-3 rounded-lg bg-red-100">
                                <span className="text-2xl">⏳</span>
                            </div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="stat-label">Monthly Interest Due</p>
                                <p className="stat-number text-yellow-600">
                                    ₹{loans.filter(loan => loan.status === 'active').reduce((sum, loan) => sum + loan.monthlyInterest, 0).toLocaleString()}
                                </p>
                            </div>
                            <div className="p-3 rounded-lg bg-yellow-100">
                                <span className="text-2xl">💵</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Pre-Close Loan Modal */}
            {showPreCloseModal && (
                <PreCloseLoan
                    loan={selectedLoan}
                    onClose={handleClosePreCloseModal}
                    onSuccess={handlePreCloseSuccess}
                />
            )}

            {/* Interest Collection Modal */}
            {showInterestModal && (
                <InterestCollection
                    loan={selectedLoan}
                    onClose={handleCloseInterestModal}
                    onSuccess={handleInterestSuccess}
                />
            )}
        </div>
    );
};

export default LoanManagement;