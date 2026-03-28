import React, { useState, useEffect } from 'react';
import { AttributeEnhancement } from '../../types/besm-character';
import { ENHANCEMENTS_LIBRARY, EnhancementTemplate } from '../../data/enhancementsLibrary';
import { AttributeTemplate } from '../../data/attributesLibrary';
import { v4 as uuidv4 } from 'uuid';
import { formatRefs, cleanDescription } from '../common/sourceRefs';

interface EnhancementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  attribute: AttributeTemplate;
  currentEnhancements: AttributeEnhancement[];
  onAddEnhancement: (enhancement: AttributeEnhancement) => void;
}

export const EnhancementsModal: React.FC<EnhancementsModalProps> = ({
  isOpen,
  onClose,
  attribute,
  currentEnhancements,
  onAddEnhancement
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEnhancement, setSelectedEnhancement] = useState<EnhancementTemplate | null>(null);
  const [notes, setNotes] = useState('');

  // Reset state when modal opens and manage body class for pointer events
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setSelectedEnhancement(null);
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

  // After hooks: if attribute is missing, do not render anything
  if (!attribute) {
    return null;
  }

  // Filter enhancements that are compatible with the current attribute
  const compatibleEnhancements = ENHANCEMENTS_LIBRARY.filter(enhancement => 
    enhancement.compatible_with.length === 0 || enhancement.compatible_with.includes(attribute.key)
  );

  // Filter enhancements based on search term
  const filteredEnhancements = compatibleEnhancements.filter(enhancement => {
    const name = enhancement.name.toLowerCase();
    const refsStr = formatRefs(enhancement).toLowerCase();
    const baseDesc = (() => {
      const refs = formatRefs(enhancement);
      return refs ? cleanDescription(enhancement) : String(enhancement.description || '');
    })().toLowerCase();
    const search = searchTerm.toLowerCase();
    
    return name.includes(search) || baseDesc.includes(search) || (!!refsStr && refsStr.includes(search));
  });

  // Sort filtered enhancements alphabetically by name for display
  const sortedFilteredEnhancements = [...filteredEnhancements].sort((a, b) => a.name.localeCompare(b.name));

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleEnhancementSelect = (enhancement: EnhancementTemplate) => {
    setSelectedEnhancement(enhancement);
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
  };

  const handleAddEnhancement = () => {
    if (selectedEnhancement) {
      const newEnhancement: AttributeEnhancement = {
        id: uuidv4(),
        template: selectedEnhancement,
        notes: notes
      };
      
      onAddEnhancement(newEnhancement);
      setSelectedEnhancement(null);
      setNotes('');
    }
  };

  // Check if enhancement is already added to the attribute
  const isEnhancementAdded = (enhancementKey: string) => {
    return currentEnhancements.some(e => e.template.key === enhancementKey);
  };

  // Modal styles
  const styles: Record<string, React.CSSProperties> = {
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: isOpen ? 'flex' : 'none',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 999999,
      pointerEvents: 'auto',
    },
    modalContent: {
      backgroundColor: 'white',
      borderRadius: '8px',
      width: '90%',
      maxWidth: '800px',
      maxHeight: '90vh',
      overflow: 'auto',
      padding: '24px',
      position: 'relative',
      fontFamily: 'var(--font-main)',
      color: 'var(--besm-dark-text)',
      border: '3px solid var(--besm-purple)',
    },
    header: {
      fontFamily: 'var(--font-header)',
      color: 'var(--besm-purple)',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      textAlign: 'center',
      marginBottom: '16px',
    },
    closeButton: {
      position: 'absolute',
      top: '12px',
      right: '12px',
      background: 'none',
      border: 'none',
      fontSize: '24px',
      cursor: 'pointer',
      color: 'var(--besm-purple)',
    },
    searchInput: {
      width: '100%',
      padding: '12px',
      border: '2px solid var(--besm-purple)',
      borderRadius: '8px',
      fontSize: '1rem',
      marginBottom: '16px',
    },
    enhancementsList: {
      maxHeight: '300px',
      overflowY: 'auto',
      border: '2px solid var(--besm-purple)',
      borderRadius: '8px',
      marginBottom: '16px',
    },
    enhancementItem: {
      padding: '12px',
      borderBottom: '1px solid var(--besm-light-gray)',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
    },
    enhancementItemSelected: {
      backgroundColor: 'var(--besm-light-pink-bg)',
      borderLeft: '4px solid var(--besm-pink)',
    },
    enhancementItemDisabled: {
      opacity: 0.5,
      backgroundColor: '#f0f0f0',
      cursor: 'not-allowed',
    },
    enhancementItemHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '4px',
    },
    enhancementName: {
      fontWeight: 'bold',
      fontSize: '1.1rem',
    },
    enhancementCost: {
      fontWeight: 'bold',
      color: 'var(--besm-purple)',
    },
    enhancementDescription: {
      fontSize: '0.9rem',
      marginTop: '4px',
    },
    detailsSection: {
      marginTop: '16px',
      padding: '16px',
      backgroundColor: 'var(--besm-light-bg)',
      borderRadius: '8px',
      border: '2px solid var(--besm-purple)',
    },
    notesTextarea: {
      width: '100%',
      padding: '12px',
      border: '2px solid var(--besm-purple)',
      borderRadius: '8px',
      fontSize: '1rem',
      minHeight: '100px',
      marginTop: '8px',
      fontFamily: 'var(--font-main)',
    },
    actionButton: {
      padding: '10px 20px',
      fontSize: '1rem',
      fontWeight: 'bold',
      color: '#000',
      backgroundColor: 'var(--besm-yellow)',
      border: '2px solid black',
      borderRadius: '5px',
      cursor: 'pointer',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      marginTop: '16px',
      width: '100%',
    },
    disabledButton: {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
    noEnhancements: {
      textAlign: 'center',
      padding: '24px',
      color: 'var(--besm-dark-text)',
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      style={styles.modalOverlay} 
      className="modal-overlay-high-priority"
      onClick={onClose}
    >
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button style={styles.closeButton} onClick={onClose}>×</button>
        <h2 style={styles.header}>Enhancements for {attribute.name}</h2>
        
        <input
          type="text"
          placeholder="Search enhancements..."
          value={searchTerm}
          onChange={handleSearchChange}
          style={styles.searchInput}
        />
        
        {sortedFilteredEnhancements.length > 0 ? (
          <div style={styles.enhancementsList}>
            {sortedFilteredEnhancements.map(enhancement => {
              const isAdded = isEnhancementAdded(enhancement.key);
              const isSelected = selectedEnhancement?.key === enhancement.key;
              
              let itemStyle = { ...styles.enhancementItem };
              if (isSelected) itemStyle = { ...itemStyle, ...styles.enhancementItemSelected };
              if (isAdded) itemStyle = { ...itemStyle, ...styles.enhancementItemDisabled };
              
              return (
                <div
                  key={enhancement.key}
                  style={itemStyle}
                  onClick={() => !isAdded && handleEnhancementSelect(enhancement)}
                >
                  <div style={styles.enhancementItemHeader}>
                    <span style={styles.enhancementName}>{enhancement.name}</span>
                    <span style={styles.enhancementCost}>Picks: {enhancement.picks}</span>
                  </div>
                  <p style={styles.enhancementDescription}>
                    {(() => {
                      // List panel: show only cleaned description; refs appear in details panel
                      const refs = formatRefs(enhancement);
                      const base = refs ? cleanDescription(enhancement) : String(enhancement.description || '');
                      return base;
                    })()}
                  </p>
                  {isAdded && <p style={{color: 'var(--besm-pink)', fontWeight: 'bold', marginTop: '8px'}}>Already Added</p>}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={styles.noEnhancements}>
            <p>No compatible enhancements found for this attribute.</p>
          </div>
        )}
        
        {selectedEnhancement && (
          <div style={styles.detailsSection}>
            <h3>{selectedEnhancement.name}</h3>
            <p><strong>Picks:</strong> {selectedEnhancement.picks}</p>
            {(() => {
              const refs = formatRefs(selectedEnhancement);
              const base = cleanDescription(selectedEnhancement);
              const refsText = refs.replace(/^Source\(s\):\s*/, '');
              return (
                <>
                  <p>{base}</p>
                  {refs && (
                    <p style={{ marginTop: '-6px' }}>
                      <strong>Source(s):</strong> {refsText}
                    </p>
                  )}
                </>
              );
            })()}
            
            <label style={{display: 'block', marginTop: '16px', fontWeight: 'bold'}}>
              Notes:
              <textarea
                value={notes}
                onChange={handleNotesChange}
                placeholder="Add any notes about this enhancement..."
                style={styles.notesTextarea}
              />
            </label>
            
            <button
              style={styles.actionButton}
              onClick={handleAddEnhancement}
            >
              Add Enhancement
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancementsModal;
