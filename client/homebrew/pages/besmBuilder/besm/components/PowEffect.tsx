import React, { useState, useCallback } from 'react';
import { PowContext } from '../contexts/PowContext';

interface PowEffect {
  id: number;
  text: string;
  left: number;
  top: number;
}

export const PowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [effects, setEffects] = useState<PowEffect[]>([]);
  const [id, setId] = useState(0);

  const triggerPow = useCallback((text: string = 'POW!') => {
    const left = Math.random() * (window.innerWidth - 200);
    const top = Math.random() * (window.innerHeight - 100);
    const newEffect: PowEffect = { id, text, left, top };
    setEffects(effects => [...effects, newEffect]);
    setId(id => id + 1);
    setTimeout(() => {
      setEffects(effects => effects.filter(e => e.id !== newEffect.id));
    }, 1000);
  }, [id]);

  return (
    <PowContext.Provider value={triggerPow}>
      {children}
      {effects.map(effect => (
        <div
          key={effect.id}
          className="pow-effect"
          style={{ left: effect.left, top: effect.top, position: 'fixed' }}
        >
          {effect.text}
        </div>
      ))}
    </PowContext.Provider>
  );
}; 