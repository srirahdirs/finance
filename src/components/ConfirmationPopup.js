import React from 'react';

const ConfirmationPopup = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    type = "warning" // success, warning, danger, info
}) => {
    if (!isOpen) return null;

    const getIconAndColors = () => {
        switch (type) {
            case 'success':
                return {
                    icon: '✅',
                    bgColor: 'bg-green-50',
                    borderColor: 'border-green-200',
                    textColor: 'text-green-800',
                    buttonColor: 'btn-success'
                };
            case 'danger':
                return {
                    icon: '❌',
                    bgColor: 'bg-red-50',
                    borderColor: 'border-red-200',
                    textColor: 'text-red-800',
                    buttonColor: 'btn-danger'
                };
            case 'info':
                return {
                    icon: 'ℹ️',
                    bgColor: 'bg-blue-50',
                    borderColor: 'border-blue-200',
                    textColor: 'text-blue-800',
                    buttonColor: 'btn-primary'
                };
            default: // warning
                return {
                    icon: '⚠️',
                    bgColor: 'bg-yellow-50',
                    borderColor: 'border-yellow-200',
                    textColor: 'text-yellow-800',
                    buttonColor: 'btn-warning'
                };
        }
    };

    const { icon, bgColor, borderColor, textColor, buttonColor } = getIconAndColors();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                <div className={`p-6 ${bgColor} ${borderColor} border-t-4 rounded-t-xl`}>
                    <div className="flex items-center">
                        <div className="text-4xl mr-4">{icon}</div>
                        <div>
                            <h3 className={`text-lg font-bold ${textColor}`}>{title}</h3>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    <p className="text-gray-700 mb-6">{message}</p>

                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={onClose}
                            className="btn btn-outline"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`btn ${buttonColor}`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationPopup;
