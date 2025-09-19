import React, { useState, useEffect } from 'react';
import dataRefreshManager from '../utils/dataRefresh';

const InterestCollection = ({ loan, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        collectionDate: new Date().toISOString().split('T')[0],
        collectedAmount: loan?.monthlyInterest || 0,
        paymentMethod: 'cash',
        notes: ''
    });

    const [calculations, setCalculations] = useState({
        monthlyInterest: 0,
        collectedAmount: 0,
        pendingAmount: 0,
        totalCollected: 0,
        monthsCollected: 0,
        monthsPending: 0
    });

    useEffect(() => {
        calculateInterestDetails();
    }, [loan, formData.collectedAmount]);

    const calculateInterestDetails = () => {
        const monthlyInterest = loan?.monthlyInterest || 0;
        const collectedAmount = parseFloat(formData.collectedAmount) || 0;
        const previouslyCollected = loan?.totalCollected || 0;

        // Calculate current month pending (before this collection)
        const currentMonthCollected = previouslyCollected % monthlyInterest;
        const currentMonthPending = monthlyInterest - currentMonthCollected;

        // Calculate how this collection affects the pending amount
        let remainingPending = 0;
        let extraAmount = 0;

        if (collectedAmount <= currentMonthPending) {
            // Collection covers part or all of current month pending
            remainingPending = currentMonthPending - collectedAmount;
        } else {
            // Collection exceeds current month pending
            extraAmount = collectedAmount - currentMonthPending;
            remainingPending = 0;
        }

        const totalCollected = previouslyCollected + collectedAmount;
        const monthsCollected = Math.floor(totalCollected / monthlyInterest);

        setCalculations({
            monthlyInterest: monthlyInterest || 0,
            collectedAmount: collectedAmount || 0,
            pendingAmount: remainingPending || 0,
            extraAmount: extraAmount || 0,
            totalCollected: totalCollected || 0,
            monthsCollected: monthsCollected || 0,
            currentMonthPending: currentMonthPending
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.collectedAmount <= 0) {
            alert('Please enter a valid collection amount');
            return;
        }

        try {
            const response = await fetch(`https://finance-backend-kappa.vercel.app/api/loans/${loan._id}/collect-interest`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    paymentMethod: formData.paymentMethod,
                    collectedAmount: formData.collectedAmount,
                    collectionDate: formData.collectionDate,
                    notes: formData.notes
                }),
            });

            if (response.ok) {
                showSuccessPopup();
                // Trigger global refresh to update all components
                dataRefreshManager.refreshAll();
                onSuccess();
                onClose();
            }
        } catch (error) {
            console.error('Error collecting interest:', error);
            showErrorPopup('Error collecting interest. Please try again.');
        }
    };

    const showSuccessPopup = () => {
        const popup = document.createElement('div');
        popup.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50';
        popup.innerHTML = `
      <div class="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full text-center">
        <div class="text-6xl mb-4">✅</div>
        <h3 class="text-xl font-bold text-gray-900 mb-2">Interest Collected Successfully!</h3>
        <p class="text-gray-600 mb-4">₹${formData.collectedAmount.toLocaleString()} collected from ${loan.client?.name}</p>
        <button onclick="this.parentElement.parentElement.remove()" class="btn btn-primary w-full">
          Continue
        </button>
      </div>
    `;
        document.body.appendChild(popup);
    };

    const showErrorPopup = (message) => {
        const popup = document.createElement('div');
        popup.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50';
        popup.innerHTML = `
      <div class="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full text-center">
        <div class="text-6xl mb-4">❌</div>
        <h3 class="text-xl font-bold text-gray-900 mb-2">Error!</h3>
        <p class="text-gray-600 mb-4">${message}</p>
        <button onclick="this.parentElement.parentElement.remove()" class="btn btn-danger w-full">
          Close
        </button>
      </div>
    `;
        document.body.appendChild(popup);
    };

    if (!loan) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
                <div className="card-header">
                    <div className="flex justify-between items-start sm:items-center">
                        <div className="flex-1 min-w-0">
                            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Collect Interest</h2>
                            <p className="text-xs sm:text-sm text-gray-500 mt-1">
                                <span className="block sm:inline">Client: {loan.client?.name}</span>
                                <span className="hidden sm:inline"> | </span>
                                <span className="block sm:inline">Monthly Interest: ₹{loan.monthlyInterest.toLocaleString()}</span>
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 text-xl sm:text-2xl ml-2 flex-shrink-0"
                        >
                            ×
                        </button>
                    </div>
                </div>

                <div className="card-body">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Interest Summary */}
                        <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                            <h3 className="font-semibold text-gray-900 mb-3 text-responsive-sm">Interest Collection Summary</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 text-xs sm:text-sm">
                                <div>
                                    <span className="text-gray-500">Monthly Interest:</span>
                                    <div className="font-semibold">₹{loan.monthlyInterest.toLocaleString()}</div>
                                </div>
                                <div>
                                    <span className="text-gray-500">Previously Collected:</span>
                                    <div className="font-semibold text-green-600">₹{loan.totalCollected.toLocaleString()}</div>
                                </div>
                                <div>
                                    <span className="text-gray-500">Monthly Pending:</span>
                                    <div className="font-semibold text-orange-600">₹{(loan.monthlyInterest - (loan.totalCollected % loan.monthlyInterest)).toLocaleString()}</div>
                                </div>
                                <div>
                                    <span className="text-gray-500">Months Collected:</span>
                                    <div className="font-semibold">{Math.floor(loan.totalCollected / loan.monthlyInterest)}</div>
                                </div>
                                <div>
                                    <span className="text-gray-500">Original Loan:</span>
                                    <div className="font-semibold">₹{loan.loanAmount.toLocaleString()}</div>
                                </div>
                            </div>
                        </div>

                        {/* Collection Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                            <div>
                                <label className="form-label">Collection Date</label>
                                <input
                                    type="date"
                                    name="collectionDate"
                                    value={formData.collectionDate}
                                    onChange={handleInputChange}
                                    className="form-input"
                                    required
                                />
                            </div>

                            <div>
                                <label className="form-label">Amount Collected (₹)</label>
                                <input
                                    type="number"
                                    name="collectedAmount"
                                    value={formData.collectedAmount}
                                    onChange={handleInputChange}
                                    className="form-input"
                                    placeholder={loan.monthlyInterest}
                                    min="0"
                                    step="0.01"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Monthly interest: ₹{loan.monthlyInterest.toLocaleString()}
                                </p>
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div>
                            <label className="form-label">Payment Method</label>
                            <select
                                name="paymentMethod"
                                value={formData.paymentMethod}
                                onChange={handleInputChange}
                                className="form-select"
                            >
                                <option value="cash">💵 Cash</option>
                                <option value="bank_transfer">🏦 Bank Transfer</option>
                                <option value="cheque">📄 Cheque</option>
                            </select>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="form-label">Notes</label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleInputChange}
                                className="form-textarea"
                                rows="3"
                                placeholder="Additional notes about this collection..."
                            />
                        </div>

                        {/* Collection Calculation */}
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <h3 className="font-semibold text-blue-900 mb-3">Collection Calculation</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span>Monthly Interest Due:</span>
                                    <span className="font-medium">₹{(calculations.monthlyInterest || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Amount Collected:</span>
                                    <span className="font-medium text-green-600">₹{(calculations.collectedAmount || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Current Month Pending:</span>
                                    <span className="font-medium text-orange-600">₹{(calculations.currentMonthPending || 0).toLocaleString()}</span>
                                </div>
                                {(calculations.pendingAmount || 0) > 0 && (
                                    <div className="flex justify-between">
                                        <span>Remaining Pending:</span>
                                        <span className="font-medium text-red-600">₹{(calculations.pendingAmount || 0).toLocaleString()}</span>
                                    </div>
                                )}
                                {(calculations.extraAmount || 0) > 0 && (
                                    <div className="flex justify-between">
                                        <span>Extra Amount:</span>
                                        <span className="font-medium text-blue-600">₹{(calculations.extraAmount || 0).toLocaleString()}</span>
                                    </div>
                                )}
                                <hr className="border-blue-200" />
                                <div className="flex justify-between">
                                    <span>Total Collected After This:</span>
                                    <span className="font-medium text-blue-900">₹{(calculations.totalCollected || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Total Months Collected:</span>
                                    <span className="font-medium text-blue-900">{calculations.monthsCollected || 0}</span>
                                </div>
                            </div>
                        </div>

                        {/* Status Messages */}
                        {(calculations.pendingAmount || 0) === 0 && (calculations.extraAmount || 0) === 0 && (
                            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                <div className="flex items-center">
                                    <span className="text-green-600 text-lg mr-2">✅</span>
                                    <span className="text-green-800 text-sm font-medium">
                                        Full monthly interest collected. No pending amount.
                                    </span>
                                </div>
                            </div>
                        )}

                        {(calculations.pendingAmount || 0) > 0 && (
                            <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                                <div className="flex items-center">
                                    <span className="text-orange-600 text-lg mr-2">⚠️</span>
                                    <span className="text-orange-800 text-sm font-medium">
                                        ₹{(calculations.pendingAmount || 0).toLocaleString()} still pending for this month.
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* {(calculations.extraAmount || 0) > 0 && (
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                <div className="flex items-center">
                                    <span className="text-blue-600 text-lg mr-2">ℹ️</span>
                                    <span className="text-blue-800 text-sm font-medium">
                                        Extra amount collected: ₹{(calculations.extraAmount || 0).toLocaleString()}. This will be applied to next month's interest.
                                    </span>
                                </div>
                            </div>
                        )} */}

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-4 border-t border-gray-200">
                            <button
                                type="button"
                                className="btn btn-outline text-responsive-sm w-full sm:w-auto"
                                onClick={onClose}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn btn-success text-responsive-sm w-full sm:w-auto"
                            >
                                💰 Collect Interest (₹{formData.collectedAmount.toLocaleString()})
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default InterestCollection;
