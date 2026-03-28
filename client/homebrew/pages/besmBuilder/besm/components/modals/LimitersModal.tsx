import React, { useState, useEffect } from 'react';
import { AttributeTemplate } from '../../data/attributesLibrary';
import { LimiterTemplate, LIMITERS_LIBRARY } from '../../data/limitersLibrary';
import { AttributeLimiter } from '../../types/besm-character';
import { v4 as uuidv4 } from 'uuid';
import { formatRefs, cleanDescription } from '../common/sourceRefs';

interface LimitersModalProps {
  isOpen: boolean;
  onClose: () => void;
  attribute: AttributeTemplate;
  currentLimiters: AttributeLimiter[];
  onAddLimiter: (limiter: AttributeLimiter) => void;
}

const LimitersModal: React.FC<LimitersModalProps> = ({
  isOpen,
  onClose,
  attribute,
  currentLimiters,
  onAddLimiter
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLimiter, setSelectedLimiter] = useState<LimiterTemplate | null>(null);
  const [selectedAssignments, setSelectedAssignments] = useState(1);
  const [notes, setNotes] = useState('');
  const [focus, setFocus] = useState('');

  // Defensive: attribute may be temporarily null/undefined when modal opens
  const attrKey = attribute?.key || '';
  const attrName = attribute?.name || 'Attribute';

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setSelectedLimiter(null);
      setNotes('');
      // Add modal-open class to body to disable underlying interactions
      document.body.classList.add('modal-open');
    } else {
      // Remove modal-open class when modal closes
      document.body.classList.remove('modal-open');
    }
    
    // Cleanup function to remove class if component unmounts while modal is open
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  // Filter limiters that are compatible with the current attribute
  const compatibleLimitersAll = LIMITERS_LIBRARY.filter(limiter =>
    limiter.compatible_with.length === 0 || (attrKey && limiter.compatible_with.includes(attrKey))
  );
  // Deduplicate by key in case the library contains accidental duplicates
  const compatibleLimiters = Array.from(
    new Map(compatibleLimitersAll.map(l => [l.key, l])).values()
  );

  // Filter limiters based on search term
  const filteredLimiters = compatibleLimiters.filter(limiter => {
    const name = limiter.name.toLowerCase();
    const refsStr = formatRefs(limiter).toLowerCase();
    const baseDesc = (() => {
      const refs = formatRefs(limiter);
      return refs ? cleanDescription(limiter) : String(limiter.description || '');
    })().toLowerCase();
    const search = searchTerm.toLowerCase();
    
    return name.includes(search) || baseDesc.includes(search) || (!!refsStr && refsStr.includes(search));
  });

  // Sort filtered limiters alphabetically by name for display
  const sortedFilteredLimiters = [...filteredLimiters].sort((a, b) => a.name.localeCompare(b.name));

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleLimiterSelect = (limiter: LimiterTemplate) => {
    setSelectedLimiter(limiter);
    setSelectedAssignments(1);
    setNotes('');
    setFocus('');
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
  };

  const handleAssignmentsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedAssignments(parseInt(e.target.value));
  };

  const handleAddLimiter = () => {
    if (selectedLimiter) {
      // Check if this limiter is already added
      const isAlreadyAdded = currentLimiters.some(
        limiter => limiter.template.key === selectedLimiter.key
      );

      if (isAlreadyAdded) {
        alert('This limiter has already been added to this attribute.');
        return;
      }

      const newLimiter: AttributeLimiter = {
        id: uuidv4(),
        template: selectedLimiter,
        assignments: selectedAssignments,
        // Include optional focus for Armour: Emphasised/Optimised
        focus: (() => {
          const needsFocus = (attribute.key === 'armour') && (selectedLimiter.key === 'emphasised' || selectedLimiter.key === 'optimised');
          const val = (focus || '').trim();
          return needsFocus && val ? val : undefined;
        })(),
        notes: notes.trim()
      };

      onAddLimiter(newLimiter);
      setSelectedLimiter(null);
      setNotes('');
    }
  };

  if (!isOpen) return null;

  const modalStyles: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999999,
    pointerEvents: 'auto',
  };

  const contentStyles: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '24px',
    maxWidth: '800px',
    maxHeight: '80vh',
    width: '90%',
    overflow: 'auto',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  };

  const headerStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    borderBottom: '2px solid var(--besm-purple)',
    paddingBottom: '10px',
  };

  const searchStyles: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid var(--besm-light-gray)',
    borderRadius: '4px',
    marginBottom: '16px',
    fontSize: '14px',
  };

  const limiterListStyles: React.CSSProperties = {
    maxHeight: '300px',
    overflowY: 'auto',
    border: '1px solid var(--besm-light-gray)',
    borderRadius: '4px',
    marginBottom: '16px',
  };

  const limiterItemStyles: React.CSSProperties = {
    padding: '12px',
    borderBottom: '1px solid var(--besm-light-gray)',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  };

  const selectedLimiterItemStyles: React.CSSProperties = {
    ...limiterItemStyles,
    backgroundColor: 'var(--besm-light-bg)',
    borderLeft: '4px solid var(--besm-purple)',
  };

  const buttonStyles: React.CSSProperties = {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    marginRight: '8px',
  };

  const primaryButtonStyles: React.CSSProperties = {
    ...buttonStyles,
    backgroundColor: 'var(--besm-purple)',
    color: 'white',
  };

  const secondaryButtonStyles: React.CSSProperties = {
    ...buttonStyles,
    backgroundColor: 'var(--besm-light-gray)',
    color: 'var(--besm-dark-text)',
  };

  return (
    <div style={modalStyles} onClick={onClose}>
      <div style={contentStyles} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyles}>
          <h2>Select Limiters for {attrName}</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: 'var(--besm-dark-text)',
            }}
          >
            ×
          </button>
        </div>

        <input
          type="text"
          placeholder="Search limiters..."
          value={searchTerm}
          onChange={handleSearchChange}
          style={searchStyles}
        />

        {sortedFilteredLimiters.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
            {compatibleLimiters.length === 0 
              ? `No limiters are compatible with ${attrName}`
              : 'No limiters match your search criteria'
            }
          </div>
        ) : (
          <div style={limiterListStyles}>
            {sortedFilteredLimiters.map((limiter) => (
              <div
                key={limiter.key}
                style={
                  selectedLimiter?.key === limiter.key
                    ? selectedLimiterItemStyles
                    : limiterItemStyles
                }
                onClick={() => handleLimiterSelect(limiter)}
              >
                <h4 style={{ margin: '0 0 8px 0', color: 'var(--besm-purple)' }}>
                  {limiter.name}
                </h4>
                <p style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
                  {(() => {
                    // List panel: show only cleaned description; refs appear in details panel
                    const refs = formatRefs(limiter);
                    const base = refs ? cleanDescription(limiter) : String(limiter.description || '');
                    return base;
                  })()}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#666' }}>
                  <span>Picks: {limiter.picks}</span>
                  <span>Source: {limiter.source}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedLimiter && (
          <div style={{ marginBottom: '16px', padding: '16px', backgroundColor: 'var(--besm-light-bg)', borderRadius: '4px' }}>
            <h3>Selected: {selectedLimiter.name}</h3>
            {(() => {
              const refs = formatRefs(selectedLimiter);
              const base = cleanDescription(selectedLimiter);
              const refsText = refs.replace(/^Source\(s\):\s*/, '');
              return (
                <>
                  <p style={{ margin: '8px 0', fontSize: '14px' }}>{base}</p>
                  {refs && (
                    <p style={{ margin: '-6px 0 8px 0', fontSize: '14px' }}>
                      <strong>Source(s):</strong> {refsText}
                    </p>
                  )}
                </>
              );
            })()}

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                Notes (optional):
              </label>
              <textarea
                value={notes}
                onChange={handleNotesChange}
                placeholder="Add any additional notes about this limiter..."
                style={{
                  width: '100%',
                  minHeight: '60px',
                  padding: '8px',
                  border: '1px solid var(--besm-light-gray)',
                  borderRadius: '4px',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Armour-specific focus field for Emphasised/Optimised */}
            {selectedLimiter && attrKey === 'armour' && (selectedLimiter.key === 'emphasised' || selectedLimiter.key === 'optimised') && (
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Focus (required)</label>
                <input
                  type="text"
                  value={focus}
                  onChange={(e) => setFocus(e.target.value)}
                  placeholder={selectedLimiter.key === 'emphasised' ? 'e.g., Fire, Acid, Psychic' : 'e.g., Slashing, Piercing, Ballistic'}
                  style={{ width: '100%', padding: 8, border: '1px solid var(--besm-light-gray)', borderRadius: 4 }}
                  className="sheet-input"
                />
                <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>Specify what the Armour is {selectedLimiter.name.toLowerCase()} against.</div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 'bold', color: 'var(--besm-purple)' }}>
                    Assignments: {selectedAssignments}
                  </span>
                  <span style={{ fontWeight: 'bold', color: 'var(--besm-purple)', marginLeft: 8 }}>
                    Max: {selectedLimiter.max_selections || 1}
                  </span>
                </div>
                {selectedLimiter.max_selections && selectedLimiter.max_selections > 1 && (
                  <select value={selectedAssignments} onChange={handleAssignmentsChange} style={{ padding: '6px', border: '1px solid var(--besm-light-gray)', borderRadius: '4px' }}>
                    {Array.from({ length: selectedLimiter.max_selections }, (_, i) => i + 1).map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                )}
              </div>
              <button
                onClick={handleAddLimiter}
                style={primaryButtonStyles}
                disabled={(() => {
                  const needsFocus = selectedLimiter && attrKey === 'armour' && (selectedLimiter.key === 'emphasised' || selectedLimiter.key === 'optimised');
                  return !!needsFocus && !focus.trim();
                })()}
              >
                Add Limiter
              </button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={secondaryButtonStyles}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default LimitersModal;
