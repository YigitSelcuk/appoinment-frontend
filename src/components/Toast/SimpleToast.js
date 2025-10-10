import React, { useEffect, useState } from 'react';
import './SimpleToast.css';

const SimpleToast = ({ message, type = 'info', onClose, duration = 3000 }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300);
  };

  const getIcon = () => {
    switch (type) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'warning': return '⚠';
      case 'info': return 'i';
      default: return 'i';
    }
  };

  const getTypeClass = () => {
    switch (type) {
      case 'success': return 'simple-toast--success';
      case 'error': return 'simple-toast--error';
      case 'warning': return 'simple-toast--warning';
      case 'info': return 'simple-toast--info';
      default: return 'simple-toast--info';
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`simple-toast ${getTypeClass()} ${isExiting ? 'simple-toast--exiting' : ''}`}>
      <div className="simple-toast__icon">
        {getIcon()}
      </div>
      <div className="simple-toast__message">
        {message}
      </div>
      <button 
        className="simple-toast__close" 
        onClick={handleClose}
        aria-label="Kapat"
      >
        ×
      </button>
    </div>
  );
};

export default SimpleToast;