import React, { useState } from 'react';
import './ErrorModal.css'; // Import the CSS file

interface ErrorModalProps {
  message: string;
  onClose: () => void;
}

const ErrorModal: React.FC<ErrorModalProps> = ({ message, onClose }) => {
  const [isBreaking, setIsBreaking] = useState(false);

  const handleClose = () => {
    setIsBreaking(true);
    setTimeout(() => {
      onClose();
      setIsBreaking(false);
    }, 500); // Duration of the glass-break animation
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-black bg-opacity-50 absolute inset-0" onClick={handleClose}></div>
      <div className={`error-modal rounded-lg p-6 shadow-lg z-10 ${isBreaking ? 'breaking' : ''}`}>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Error</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-4">{message}</p>
        <button
          onClick={handleClose}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default ErrorModal;