import React, { useState } from 'react';
import { ENHANCEMENTS_LIBRARY, EnhancementTemplate } from '../../data/enhancementsLibrary';
import { formatRefs, cleanDescription } from '../common/sourceRefs';

type EnhancementsLibraryProps = Record<string, never>;

export const EnhancementsLibrary: React.FC<EnhancementsLibraryProps> = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEnhancement, setSelectedEnhancement] = useState<EnhancementTemplate | null>(null);

  const filteredEnhancements = searchTerm.trim() === '' 
    ? ENHANCEMENTS_LIBRARY 
    : ENHANCEMENTS_LIBRARY.filter(enhancement => {
        const refsStr = formatRefs(enhancement).toLowerCase();
        const baseDesc = (() => {
          const refs = formatRefs(enhancement);
          return refs ? cleanDescription(enhancement) : String(enhancement.description || '');
        })().toLowerCase();
        return enhancement.name.toLowerCase().includes(searchTerm.toLowerCase()) 
          || baseDesc.includes(searchTerm.toLowerCase())
          || (!!refsStr && refsStr.includes(searchTerm.toLowerCase()));
      });

  const styles = {
    container: {
      display: 'flex',
      height: '70vh',
      gap: '20px',
    },
    sidebar: {
      width: '30%',
      borderRight: '1px solid #ddd',
      overflowY: 'auto' as const,
      padding: '10px',
    },
    content: {
      flex: 1,
      overflowY: 'auto' as const,
      padding: '10px',
    },
    searchInput: {
      width: '100%',
      padding: '8px',
      marginBottom: '16px',
      border: '1px solid #ccc',
      borderRadius: '4px',
    },
    enhancementItem: {
      padding: '8px',
      marginBottom: '8px',
      borderRadius: '4px',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
    },
    selectedItem: {
      backgroundColor: 'var(--besm-light-purple)',
      color: 'white',
    },
    enhancementTitle: {
      fontSize: '1.2rem',
      fontWeight: 'bold' as const,
      marginBottom: '8px',
      color: 'var(--besm-purple)',
    },
    enhancementDetails: {
      marginBottom: '16px',
    },
    label: {
      fontWeight: 'bold' as const,
      marginRight: '4px',
    },
    compatibleList: {
      display: 'flex',
      flexWrap: 'wrap' as const,
      gap: '4px',
      marginTop: '8px',
    },
    compatibleTag: {
      backgroundColor: 'var(--besm-light-pink)',
      color: 'var(--besm-dark-text)',
      padding: '2px 6px',
      borderRadius: '4px',
      fontSize: '0.8rem',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <input
          type="text"
          placeholder="Search enhancements..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />
        <div>
          {filteredEnhancements.map((enhancement) => (
            <div
              key={enhancement.key}
              style={{
                ...styles.enhancementItem,
                ...(selectedEnhancement?.key === enhancement.key ? styles.selectedItem : {}),
              }}
              onClick={() => setSelectedEnhancement(enhancement)}
            >
              {enhancement.name}
            </div>
          ))}
        </div>
      </div>
      <div style={styles.content}>
        {selectedEnhancement ? (
          <div>
            <h3 style={styles.enhancementTitle}>{selectedEnhancement.name}</h3>
            <div style={styles.enhancementDetails}>
              <p>
                {(() => {
                  const refs = formatRefs(selectedEnhancement);
                  const base = cleanDescription(selectedEnhancement);
                  return refs ? `${base} ${refs}` : base;
                })()}
              </p>
              <p>
                <span style={styles.label}>Picks:</span> {selectedEnhancement.picks}
                {selectedEnhancement.max_selections && ` (Max: ${selectedEnhancement.max_selections})`}
              </p>
              <div>
                <span style={styles.label}>Compatible with:</span>
                <div style={styles.compatibleList}>
                  {selectedEnhancement.compatible_with.map((item) => (
                    <span key={item} style={styles.compatibleTag}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', marginTop: '40px', color: 'var(--besm-dark-text)' }}>
            <p>Select an enhancement from the list to view details</p>
          </div>
        )}
      </div>
    </div>
  );
};
