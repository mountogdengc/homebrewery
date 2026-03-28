import React from 'react';
import { usePow } from '../hooks/usePow';

export const ExamplePowButton: React.FC = () => {
  const pow = usePow();
  return (
    <button
      onClick={() => pow('POW!')}
      style={{
        position: 'fixed',
        right: 16,
        bottom: 16,
        zIndex: 1000,
        background: '#ff0080',
        color: 'white',
        border: 'none',
        borderRadius: 999,
        padding: '10px 14px',
        fontWeight: 800,
        boxShadow: '0 4px 10px rgba(0,0,0,0.25)'
      }}
      aria-label="Trigger POW effect"
    >
      POW!
    </button>
  );
};
