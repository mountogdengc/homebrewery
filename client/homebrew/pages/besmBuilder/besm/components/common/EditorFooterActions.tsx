import React from 'react';

type EditorFooterActionsProps = {
  onCancel: () => void;
  onImport?: () => void;
  onExport?: () => void;
  onSave: () => void;
  cancelLabel?: string;
  importLabel?: string;
  exportLabel?: string;
  saveLabel?: string;
  primaryStyle?: React.CSSProperties;
  secondaryStyle?: React.CSSProperties;
  containerStyle?: React.CSSProperties;
};

const baseSecondary: React.CSSProperties = {
  padding: '10px 16px',
  borderRadius: 8,
  cursor: 'pointer',
  fontWeight: 800,
  letterSpacing: 0.5,
  background: 'white',
  color: 'var(--besm-dark-text)',
  border: '2px solid var(--besm-purple)'
};

const basePrimary: React.CSSProperties = {
  padding: '10px 16px',
  borderRadius: 8,
  cursor: 'pointer',
  fontWeight: 800,
  letterSpacing: 0.5,
  border: 'none',
  background: 'var(--besm-purple)',
  color: 'white'
};

export const EditorFooterActions: React.FC<EditorFooterActionsProps> = ({
  onCancel,
  onImport,
  onExport,
  onSave,
  cancelLabel = 'Cancel',
  importLabel = 'Import from Library',
  exportLabel = 'Save to Library',
  saveLabel = 'Save',
  primaryStyle,
  secondaryStyle,
  containerStyle
}) => {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, flexWrap: 'wrap', ...(containerStyle || {}) }}>
      <div>
        <button onClick={onCancel} style={{ ...baseSecondary, background: 'var(--besm-light-gray)', border: 'none' }}>{cancelLabel}</button>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {onImport && (
          <button onClick={onImport} style={{ ...baseSecondary, ...(secondaryStyle || {}) }}>{importLabel}</button>
        )}
        {onExport && (
          <button onClick={onExport} style={{ ...baseSecondary, ...(secondaryStyle || {}) }}>{exportLabel}</button>
        )}
        <button onClick={onSave} style={{ ...basePrimary, ...(primaryStyle || {}) }}>{saveLabel}</button>
      </div>
    </div>
  );
};

export default EditorFooterActions;
