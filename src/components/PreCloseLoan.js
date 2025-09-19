import React, { useState, useEffect } from 'react';

const PreCloseLoan = ({ loan, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        principalAmount: loan?.loanAmount || 0,
        interestPaid: loan?.totalCollected || 0,
        remainingPrincipal: loan?.remainingAmount || 0,
        penaltyAmount: 0,
        discountAmount: 0,
        finalAmount: 0,
        paymentMethod: 'cash',
        notes: ''
    });

    const [calculations, setCalculations] = useState({
        totalOutstanding: 0,
        penaltyApplied: 0,
        discountApplied: 0,
        finalSettlement: 0,
        savings: 0
    });

    useEffect(() => {
        calculateFinalAmount();
    }, [formData.penaltyAmount, formData.discountAmount, loan]);

    const calculateFinalAmount = () => {
        const remainingPrincipal = parseFloat(loan.remainingAmount) || 0;
        const penaltyAmount = parseFloat(formData.penaltyAmount) || 0;
        const discountAmount = parseFloat(formData.discountAmount) || 0;

        const totalOutstanding = remainingPrincipal + penaltyAmount;
        const afterDiscount = totalOutstanding - discountAmount;
        const finalSettlement = Math.max(0, afterDiscount);
        const savings = discountAmount;

        setCalculations({
            totalOutstanding,
            penaltyApplied: penaltyAmount,
            discountApplied: discountAmount,
            finalSettlement,
            savings
        });

        setFormData(prev => ({
            ...prev,
            finalAmount: finalSettlement
        }));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const showConfirmationPopup = () => {
        const popup = document.createElement('div');
        popup.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50';
        popup.innerHTML = `
            <div class="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full">
                <div class="text-center">
                    <div class="text-6xl mb-4">🔒</div>
                    <h3 class="text-xl font-bold text-gray-900 mb-2">Pre-Close Loan Confirmation</h3>
                    <p class="text-gray-600 mb-4">Please review the details before confirming:</p>
                    
                    <div class="bg-gray-50 p-4 rounded-lg mb-4 text-left">
                        <div class="space-y-2 text-sm">
                            <div class="flex justify-between">
                                <span class="text-gray-500">Client:</span>
                                <span class="font-medium">${loan.client?.name}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-500">Original Loan:</span>
                                <span class="font-medium">₹${loan.loanAmount.toLocaleString()}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-500">Interest Collected:</span>
                                <span class="font-medium text-green-600">₹${loan.totalCollected.toLocaleString()}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-500">Remaining Principal:</span>
                                <span class="font-medium">₹${loan.remainingAmount.toLocaleString()}</span>
                            </div>
                            ${formData.penaltyAmount > 0 ? `
                            <div class="flex justify-between">
                                <span class="text-gray-500">Penalty Applied:</span>
                                <span class="font-medium text-red-600">₹${formData.penaltyAmount.toLocaleString()}</span>
                            </div>
                            ` : ''}
                            ${formData.discountAmount > 0 ? `
                            <div class="flex justify-between">
                                <span class="text-gray-500">Discount Applied:</span>
                                <span class="font-medium text-green-600">₹${formData.discountAmount.toLocaleString()}</span>
                            </div>
                            ` : ''}
                            <hr class="border-gray-200 my-2">
                            <div class="flex justify-between">
                                <span class="text-gray-900 font-semibold">Final Settlement:</span>
                                <span class="font-bold text-blue-600 text-lg">₹${calculations.finalSettlement.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex space-x-3">
                        <button onclick="this.parentElement.parentElement.parentElement.parentElement.remove()" 
                                class="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors">
                            Cancel
                        </button>
                        <button onclick="window.confirmPreCloseLoan()" 
                                class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                            Confirm Pre-Close
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Store the popup reference for cleanup
        window.currentPreClosePopup = popup;
        document.body.appendChild(popup);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        showConfirmationPopup();
    };

    const confirmPreCloseLoan = async () => {
        try {
            // Remove the popup
            if (window.currentPreClosePopup) {
                window.currentPreClosePopup.remove();
                window.currentPreClosePopup = null;
            }

            const response = await fetch(`https://finance-backend-kappa.vercel.app/api/loans/${loan._id}/pre-close`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    paymentMethod: formData.paymentMethod,
                    finalAmount: calculations.finalSettlement,
                    penaltyAmount: formData.penaltyAmount,
                    discountAmount: formData.discountAmount,
                    notes: formData.notes
                }),
            });

            if (response.ok) {
                showSuccessPopup();
                onSuccess();
                onClose();
            }
        } catch (error) {
            console.error('Error pre-closing loan:', error);
            showErrorPopup('Error pre-closing loan. Please try again.');
        }
    };

    // Make the function globally available
    window.confirmPreCloseLoan = confirmPreCloseLoan;

    const showSuccessPopup = () => {
        const popup = document.createElement('div');
        popup.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50';
        popup.innerHTML = `
            <div class="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full text-center">
                <div class="text-6xl mb-4">✅</div>
                <h3 class="text-xl font-bold text-gray-900 mb-2">Loan Pre-Closed Successfully!</h3>
                <p class="text-gray-600 mb-4">The loan has been closed and all records have been updated.</p>
                <button onclick="this.parentElement.parentElement.remove()" class="btn btn-success w-full">
                    Close
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
                            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Pre-Close Loan</h2>
                            <p className="text-xs sm:text-sm text-gray-500 mt-1">
                                <span className="block sm:inline">Client: {loan.client?.name}</span>
                                <span className="hidden sm:inline"> | </span>
                                <span className="block sm:inline">Loan Amount: ₹{loan.loanAmount.toLocaleString()}</span>
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
                        {/* Loan Summary */}
                        <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                            <h3 className="font-semibold text-gray-900 mb-3 text-responsive-sm">Loan Summary</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
                                <div>
                                    <span className="text-gray-500">Principal Amount:</span>
                                    <div className="font-semibold">₹{loan.loanAmount.toLocaleString()}</div>
                                </div>
                                <div>
                                    <span className="text-gray-500">Interest Collected:</span>
                                    <div className="font-semibold text-green-600">₹{loan.totalCollected.toLocaleString()}</div>
                                </div>
                                <div>
                                    <span className="text-gray-500">Remaining Principal:</span>
                                    <div className="font-semibold">₹{loan.remainingAmount.toLocaleString()}</div>
                                </div>
                                <div>
                                    <span className="text-gray-500">Monthly Interest:</span>
                                    <div className="font-semibold">₹{loan.monthlyInterest.toLocaleString()}</div>
                                </div>
                            </div>
                        </div>

                        {/* Settlement Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                            <div>
                                <label className="form-label">Penalty Amount (₹)</label>
                                <input
                                    type="number"
                                    name="penaltyAmount"
                                    value={formData.penaltyAmount}
                                    onChange={handleInputChange}
                                    className="form-input"
                                    placeholder="0"
                                    min="0"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Early closure penalty (if applicable)
                                </p>
                            </div>

                            <div>
                                <label className="form-label">Discount Amount (₹)</label>
                                <input
                                    type="number"
                                    name="discountAmount"
                                    value={formData.discountAmount}
                                    onChange={handleInputChange}
                                    className="form-input"
                                    placeholder="0"
                                    min="0"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Discount for early payment
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
                                placeholder="Additional notes about this pre-closure..."
                            />
                        </div>

                        {/* Calculation Summary */}
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <h3 className="font-semibold text-blue-900 mb-3">Settlement Calculation</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span>Remaining Principal:</span>
                                    <span className="font-medium">₹{loan.remainingAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Penalty Amount:</span>
                                    <span className="font-medium text-red-600">+₹{calculations.penaltyApplied.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Discount Amount:</span>
                                    <span className="font-medium text-green-600">-₹{calculations.discountApplied.toLocaleString()}</span>
                                </div>
                                <hr className="border-blue-200" />
                                <div className="flex justify-between text-lg font-bold">
                                    <span>Final Settlement Amount:</span>
                                    <span className="text-blue-900">₹{calculations.finalSettlement.toLocaleString()}</span>
                                </div>
                                {calculations.discountApplied > 0 && (
                                    <div className="flex justify-between text-sm text-green-600">
                                        <span>Client Savings:</span>
                                        <span>₹{calculations.savings.toLocaleString()}</span>
                                    </div>
                                )}
                            </div>
                        </div>

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
                                className="btn btn-danger text-responsive-sm w-full sm:w-auto"
                            >
                                🔒 Pre-Close Loan (₹{calculations.finalSettlement.toLocaleString()})
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PreCloseLoan;
