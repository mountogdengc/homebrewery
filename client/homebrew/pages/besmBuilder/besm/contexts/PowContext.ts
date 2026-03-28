import { createContext } from 'react';

// Context provides a trigger function to show a POW effect
export const PowContext = createContext<(text?: string) => void>(() => {});
