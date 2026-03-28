import React, { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  onDismiss: (id: string) => void;
}

const toastStyles = {
  base: {
    padding: '16px',
    borderRadius: '8px',
    color: 'white',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.3s ease-in-out',
    opacity: 0,
    transform: 'translateY(20px)',
    fontFamily: 'var(--font-main)',
    fontSize: '1rem',
    marginBottom: '10px',
  },
  visible: {
    opacity: 1,
    transform: 'translateY(0)',
  },
  success: {
    backgroundColor: 'var(--besm-green, #28a745)',
  },
  error: {
    backgroundColor: 'var(--besm-red, #dc3545)',
  },
  info: {
    backgroundColor: 'var(--besm-blue, #17a2b8)',
  },
  dismissButton: {
    background: 'none',
    border: 'none',
    color: 'white',
    fontSize: '1.2rem',
    cursor: 'pointer',
    marginLeft: '16px',
    lineHeight: '1',
  },
};

export const Toast: React.FC<ToastProps> = ({ id, message, type, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Fade in
    const fadeInTimer = setTimeout(() => setIsVisible(true), 10);

    // Auto-dismiss
    const dismissTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onDismiss(id), 300); // Wait for fade out
    }, 5000);

    return () => {
      clearTimeout(fadeInTimer);
      clearTimeout(dismissTimer);
    };
  }, [id, onDismiss]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => onDismiss(id), 300); // Wait for fade out
  };

  const style = {
    ...toastStyles.base,
    ...toastStyles[type],
    ...(isVisible ? toastStyles.visible : {}),
  };

  return (
    <div style={style}>
      <span>{message}</span>
      <button onClick={handleDismiss} style={toastStyles.dismissButton}>&times;</button>
    </div>
  );
};
