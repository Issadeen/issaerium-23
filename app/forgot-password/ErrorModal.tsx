import React from 'react';

interface ErrorModalProps {
  message: string;
  onClose: () => void;
}

const ErrorModal: React.FC<ErrorModalProps> = ({ message, onClose }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black opacity-50"></div>
      <div className="bg-gray-800 text-white rounded-lg p-6 z-10 max-w-sm w-full">
        <h2 className="text-xl font-bold mb-4">Error</h2>
        <p className="mb-4">Kindly verify your email</p>
        <button
          onClick={onClose}
          className="w-full py-2 px-4 bg-red-500 hover:bg-red-600 text-white rounded-md font-medium transition-colors duration-300"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default ErrorModal;