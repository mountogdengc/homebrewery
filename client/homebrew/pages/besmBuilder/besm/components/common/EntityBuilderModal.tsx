import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Modal } from '../common/Modal';

export type EntityBuilderContextType = {
  // Preferences
  readingMode: boolean;
  setReadingMode: React.Dispatch<React.SetStateAction<boolean>>;
  disableHoverTooltips: boolean;
  setDisableHoverTooltips: React.Dispatch<React.SetStateAction<boolean>>;

  // Tooltip helpers
  showTip: (text: string, e: React.MouseEvent) => void;
  moveTip: (e: React.MouseEvent) => void;
  hideTip: () => void;
  showTipAtElement: (text: string, el: HTMLElement) => void;

  // Info popover
  openInfoAtElement: (text: string, el: HTMLElement) => void;
  closeInfo: () => void;

  // Screen reader strings
  srText: string;
  setSrText: React.Dispatch<React.SetStateAction<string>>;
  srAnnounce: string;
  setSrAnnounce: React.Dispatch<React.SetStateAction<string>>;
};

const noop = (): void => {};
const noopSetBoolean: React.Dispatch<React.SetStateAction<boolean>> = () => undefined;
const noopSetString: React.Dispatch<React.SetStateAction<string>> = () => undefined;
const noopShowTip = (text: string, e: React.MouseEvent): void => { void text; void e; };
const noopMoveTip = (e: React.MouseEvent): void => { void e; };
const noopShowTipAtElement = (text: string, el: HTMLElement): void => { void text; void el; };
const noopOpenInfoAtElement = (text: string, el: HTMLElement): void => { void text; void el; };

const EntityBuilderContext = createContext<EntityBuilderContextType>({
  readingMode: false,
  setReadingMode: noopSetBoolean,
  disableHoverTooltips: false,
  setDisableHoverTooltips: noopSetBoolean,
  showTip: noopShowTip,
  moveTip: noopMoveTip,
  hideTip: noop,
  showTipAtElement: noopShowTipAtElement,
  openInfoAtElement: noopOpenInfoAtElement,
  closeInfo: noop,
  srText: '',
  setSrText: noopSetString,
  srAnnounce: '',
  setSrAnnounce: noopSetString,
});

// eslint-disable-next-line react-refresh/only-export-components
export const useEntityBuilder = () => useContext(EntityBuilderContext);

export type EntityBuilderModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  maxWidth?: string;
  storageKey: string; // localStorage key for persisting prefs
  showGear?: boolean;
  renderTooltipLayer?: boolean;
  renderInfoLayer?: boolean;
  renderScreenReaderRegions?: boolean;
  children: React.ReactNode | ((ctx: EntityBuilderContextType) => React.ReactNode);
};

// Shared styles (matches builder look & feel)
const buttonBase: React.CSSProperties = {
  padding: '10px 16px',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
  fontWeight: 800,
  letterSpacing: 0.5,
};

export const EntityBuilderModal: React.FC<EntityBuilderModalProps> = ({
  isOpen,
  onClose,
  title,
  maxWidth = '900px',
  storageKey,
  showGear = true,
  renderTooltipLayer = true,
  renderInfoLayer = true,
  renderScreenReaderRegions = true,
  children,
}) => {
  // Preferences
  const [readingMode, setReadingMode] = useState(false);
  const [disableHoverTooltips, setDisableHoverTooltips] = useState(false);

  // Tooltip state
  const [tip, setTip] = useState<{ text: string; x: number; y: number; visible: boolean }>({ text: '', x: 0, y: 0, visible: false });

  // Info popover state
  const [infoPop, setInfoPop] = useState<{ text: string; x: number; y: number; visible: boolean }>({ text: '', x: 0, y: 0, visible: false });
  const infoCloseRef = useRef<HTMLButtonElement>(null);

  // Screen reader regions
  const [srText, setSrText] = useState('');
  const [srAnnounce, setSrAnnounce] = useState('');

  // Persist/restore prefs
  useEffect(() => {
    if (!isOpen) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { readingMode?: boolean; disableHoverTooltips?: boolean } | null;
      if (parsed && typeof parsed === 'object') {
        if (typeof parsed.readingMode === 'boolean') setReadingMode(parsed.readingMode);
        if (typeof parsed.disableHoverTooltips === 'boolean') setDisableHoverTooltips(parsed.disableHoverTooltips);
      }
    } catch (err) {
      if (typeof console !== 'undefined' && typeof console.warn === 'function') {
        console.warn('[EBM] Failed to load prefs', err);
      }
    }
  }, [isOpen, storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ readingMode, disableHoverTooltips }));
    } catch (err) {
      if (typeof console !== 'undefined' && typeof console.warn === 'function') {
        console.warn('[EBM] Failed to save prefs', err);
      }
    }
  }, [storageKey, readingMode, disableHoverTooltips]);

  // Tooltip helpers
  const showTip = useCallback((text: string, e: React.MouseEvent) => {
    if (!text) return;
    if (disableHoverTooltips) return;
    if (typeof console !== 'undefined' && typeof console.debug === 'function') {
      console.debug('[EBM] showTip', { text: text.slice(0, 24) });
    }
    setTip({ text, x: e.clientX + 12, y: e.clientY + 12, visible: true });
  }, [disableHoverTooltips]);
  const moveTip = useCallback((e: React.MouseEvent) => {
    if (disableHoverTooltips) return;
    if (typeof console !== 'undefined' && typeof console.debug === 'function') {
      console.debug('[EBM] moveTip');
    }
    setTip(prev => (prev.visible ? { ...prev, x: e.clientX + 12, y: e.clientY + 12 } : prev));
  }, [disableHoverTooltips]);
  const hideTip = useCallback(() => {
    if (typeof console !== 'undefined' && typeof console.debug === 'function') {
      console.debug('[EBM] hideTip');
    }
    setTip(prev => ({ ...prev, visible: false }));
  }, []);
  const showTipAtElement = useCallback((text: string, el: HTMLElement) => {
    if (!text || !el) return;
    if (typeof console !== 'undefined' && typeof console.debug === 'function') {
      console.debug('[EBM] showTipAtElement', { text: text.slice(0, 24) });
    }
    const rect = el.getBoundingClientRect();
    setTip({ text, x: rect.left + 12, y: rect.bottom + 8, visible: true });
  }, []);

  // Info popover helpers
  useEffect(() => {
    if (!infoPop.visible) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setInfoPop(prev => ({ ...prev, visible: false })); };
    document.addEventListener('keydown', onKey);
    setTimeout(() => infoCloseRef.current?.focus(), 0);
    return () => document.removeEventListener('keydown', onKey);
  }, [infoPop.visible]);
  // If info popover opens, ensure tooltip is hidden so it doesn't visually overlay the Close button
  useEffect(() => {
    if (infoPop.visible) {
      setTip(prev => prev.visible ? { ...prev, visible: false } : prev);
    }
  }, [infoPop.visible]);

  const openInfoAtElement = useCallback((text: string, el: HTMLElement) => {
    if (!el) return;
    if (typeof console !== 'undefined' && typeof console.debug === 'function') {
      console.debug('[EBM] openInfoAtElement', { text: (text || '').slice(0, 24) });
    }
    // Hide tooltip to avoid overlaying the popover controls
    setTip(prev => prev.visible ? { ...prev, visible: false } : prev);
    const rect = el.getBoundingClientRect();
    setInfoPop({ text, x: rect.left + 12, y: rect.bottom + 8, visible: true });
  }, []);
  const closeInfo = useCallback(() => {
    if (typeof console !== 'undefined' && typeof console.debug === 'function') {
      console.debug('[EBM] closeInfo');
    }
    setInfoPop(prev => ({ ...prev, visible: false }));
  }, []);

  // Preferences gear menu
  const [prefsOpen, setPrefsOpen] = useState(false);
  const prefsBtnRef = useRef<HTMLButtonElement>(null);
  const [prefsPos, setPrefsPos] = useState<{ left: number; top: number }>({ left: 0, top: 0 });
  useEffect(() => {
    if (!prefsOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setPrefsOpen(false); };
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      const btn = prefsBtnRef.current;
      const menu = document.getElementById('entity-prefs-menu');
      if (btn && btn.contains(target)) return;
      if (menu && menu.contains(target)) return;
      setPrefsOpen(false);
    };
    // Compute menu position relative to the gear button so the menu does not overlap it
    try {
      const btn = prefsBtnRef.current;
      if (btn) {
        const rect = btn.getBoundingClientRect();
        const viewportW = window.innerWidth || document.documentElement.clientWidth || 1024;
        const menuWidth = 200; // approximate width incl. borders/padding
        const margin = 8;
        const left = Math.min(Math.max(rect.left, margin), viewportW - menuWidth - margin);
        const top = rect.bottom + margin; // below the gear
        setPrefsPos({ left, top });
      }
    } catch {}
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onClick); };
  }, [prefsOpen]);

  const ctxValue = useMemo<EntityBuilderContextType>(() => ({
    readingMode,
    setReadingMode,
    disableHoverTooltips,
    setDisableHoverTooltips,
    showTip,
    moveTip,
    hideTip,
    showTipAtElement,
    openInfoAtElement,
    closeInfo,
    srText,
    setSrText,
    srAnnounce,
    setSrAnnounce,
  }), [readingMode, disableHoverTooltips, srText, srAnnounce, showTip, moveTip, showTipAtElement, openInfoAtElement, closeInfo, hideTip]);

  const renderedChildren = typeof children === 'function' ? (children as (ctx: EntityBuilderContextType) => React.ReactNode)(ctxValue) : children;

  return (
    <EntityBuilderContext.Provider value={ctxValue}>
      <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth={maxWidth} closeOnBackdropClick={false} closeOnEscape={false}>
        {/* Gear button (optional) */}
        {showGear && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <button
              ref={prefsBtnRef}
              type="button"
              aria-haspopup="menu"
              aria-expanded={prefsOpen}
              onClick={() => setPrefsOpen(v => !v)}
              style={{
                ...buttonBase,
                background: 'white',
                color: 'var(--besm-dark-text)',
                border: '2px solid var(--besm-purple)'
              }}
              title="Preferences"
            >
              ⚙
            </button>
          </div>
        )}
        {prefsOpen && (
          <div
            id="entity-prefs-menu"
            role="menu"
            style={{ position: 'fixed', left: prefsPos.left, top: prefsPos.top, background: '#fff', border: '2px solid var(--besm-purple)', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.2)', padding: 6, zIndex: 10002, minWidth: 180 }}
          >
            <button
              role="menuitemcheckbox"
              aria-checked={readingMode}
              onClick={() => setReadingMode(v => !v)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '6px 8px', border: '1px solid #eee', background: '#fff', color: 'var(--besm-dark-text)', borderRadius: 6, cursor: 'pointer' }}
            >
              <span>Reading</span>
              <span>{readingMode ? '✔' : ''}</span>
            </button>
            <button
              role="menuitemcheckbox"
              aria-checked={disableHoverTooltips}
              onClick={() => setDisableHoverTooltips(v => !v)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '6px 8px', border: '1px solid #eee', background: '#fff', color: 'var(--besm-dark-text)', borderRadius: 6, cursor: 'pointer', marginTop: 6 }}
            >
              <span>No Hover</span>
              <span>{disableHoverTooltips ? '✔' : ''}</span>
            </button>
          </div>
        )}

        {/* Consumer content (disabled when info popover is visible to prevent click-through) */}
        <div style={{ pointerEvents: infoPop.visible ? 'none' : 'auto', color: 'var(--besm-dark-text)' }}>
          {renderedChildren}
        </div>

        {/* Screen-reader regions */}
        {renderScreenReaderRegions && (
          <>
            <div id="entity-sr-desc" style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }} aria-live="polite" aria-atomic="true">{srText}</div>
            <div id="entity-sr-announce" style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }} aria-live="polite" aria-atomic="true">{srAnnounce}</div>
          </>
        )}

        {/* Tooltip layer */}
        {renderTooltipLayer && tip.visible && tip.text && !infoPop.visible && typeof document !== 'undefined' && createPortal(
          <div
            style={{
              position: 'fixed',
              left: tip.x,
              top: tip.y,
              width: 320,
              maxWidth: 320,
              background: 'white',
              border: '1px solid #ccc',
              borderRadius: 6,
              padding: '8px 10px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              color: 'var(--besm-dark-text)',
              fontSize: 12,
              lineHeight: 1.35,
              zIndex: 99999999999,
              pointerEvents: 'none',
              whiteSpace: 'normal',
            }}
          >
            {tip.text}
          </div>,
          document.body
        )}

        {/* Info popover layer (Modal-based for reliable interactions) */}
        {renderInfoLayer && (
          <Modal isOpen={infoPop.visible} onClose={closeInfo} title="Details" maxWidth="480px">
            <div style={{ color: 'var(--besm-dark-text)', fontSize: 13, lineHeight: 1.5 }}>
              {infoPop.text || 'No description available.'}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
              <button ref={infoCloseRef} onClick={closeInfo} style={{ border: '1px solid #ccc', background: '#fff', padding: '6px 12px', borderRadius: 6, cursor: 'pointer' }}>Close</button>
            </div>
          </Modal>
        )}
      </Modal>
    </EntityBuilderContext.Provider>
  );
};
