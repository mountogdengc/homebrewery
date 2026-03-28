import React, { useState } from 'react';
import { DEFECTS_LIBRARY, DefectTemplate } from '../../data/defectsLibrary';
import { formatRefs, cleanDescription } from '../common/sourceRefs';

type DefectsLibraryProps = Record<string, never>;

export const DefectsLibrary: React.FC<DefectsLibraryProps> = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDefect, setSelectedDefect] = useState<DefectTemplate | null>(null);
  const [filterType, setFilterType] = useState<'All' | 'Lesser' | 'Greater' | 'Serious'>('All');

  // Use shared helpers for formatting

  const filteredDefects = DEFECTS_LIBRARY.filter(defect => {
    const refsStr = formatRefs(defect).toLowerCase();
    const matchesSearch = searchTerm.trim() === '' || 
      defect.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      cleanDescription(defect).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (!!refsStr && refsStr.includes(searchTerm.toLowerCase()));
    
    const matchesType = filterType === 'All' || defect.rank_type === filterType;
    
    return matchesSearch && matchesType;
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
      marginBottom: '8px',
      border: '1px solid #ccc',
      borderRadius: '4px',
    },
    filterContainer: {
      display: 'flex',
      gap: '8px',
      marginBottom: '16px',
    },
    filterButton: {
      padding: '4px 8px',
      border: '1px solid #ccc',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '0.9rem',
      backgroundColor: 'white',
    },
    activeFilter: {
      backgroundColor: 'var(--besm-light-purple)',
      color: 'white',
      borderColor: 'var(--besm-purple)',
    },
    defectItem: {
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
    defectTitle: {
      fontSize: '1.2rem',
      fontWeight: 'bold' as const,
      marginBottom: '8px',
      color: 'var(--besm-purple)',
    },
    defectDetails: {
      marginBottom: '16px',
    },
    label: {
      fontWeight: 'bold' as const,
      marginRight: '4px',
    },
    rankType: {
      display: 'inline-block',
      padding: '2px 6px',
      borderRadius: '4px',
      fontSize: '0.8rem',
      marginLeft: '8px',
    },
    lesserRank: {
      backgroundColor: '#d1e7dd',
      color: '#0f5132',
    },
    greaterRank: {
      backgroundColor: '#fff3cd',
      color: '#664d03',
    },
    seriousRank: {
      backgroundColor: '#f8d7da',
      color: '#842029',
    },
    rankTable: {
      width: '100%',
      borderCollapse: 'collapse' as const,
      marginTop: '16px',
    },
    tableHeader: {
      textAlign: 'left' as const,
      padding: '8px',
      borderBottom: '1px solid #ddd',
      backgroundColor: 'var(--besm-light-purple)',
      color: 'white',
    },
    tableCell: {
      padding: '8px',
      borderBottom: '1px solid #ddd',
    },
  };

  const getRankTypeStyle = (rankType: string) => {
    switch (rankType) {
      case 'Lesser': return styles.lesserRank;
      case 'Greater': return styles.greaterRank;
      case 'Serious': return styles.seriousRank;
      default: return {};
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <input
          type="text"
          placeholder="Search defects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />
        <div style={styles.filterContainer}>
          {(['All', 'Lesser', 'Greater', 'Serious'] as const).map((type) => (
            <button
              key={type}
              style={{
                ...styles.filterButton,
                ...(filterType === type ? styles.activeFilter : {}),
              }}
              onClick={() => setFilterType(type)}
            >
              {type}
            </button>
          ))}
        </div>
        <div>
          {filteredDefects.map((defect) => (
            <div
              key={defect.key}
              style={{
                ...styles.defectItem,
                ...(selectedDefect?.key === defect.key ? styles.selectedItem : {}),
              }}
              onClick={() => setSelectedDefect(defect)}
            >
              {defect.name}
            </div>
          ))}
        </div>
      </div>
      <div style={styles.content}>
        {selectedDefect ? (
          <div>
            <h3 style={styles.defectTitle}>
              {selectedDefect.name}
              <span style={{
                ...styles.rankType,
                ...getRankTypeStyle(selectedDefect.rank_type),
              }}>
                {selectedDefect.rank_type}
              </span>
            </h3>
            <div style={styles.defectDetails}>
              <p>
                {(() => {
                  const base = cleanDescription(selectedDefect);
                  const refs = formatRefs(selectedDefect);
                  return refs ? `${base} ${refs}` : base;
                })()}
              </p>
              <p>
                <span style={styles.label}>CP Refund:</span> {selectedDefect.cp_refund} per rank
              </p>
              <p>
                <span style={styles.label}>Max Rank:</span> {selectedDefect.max_rank}
              </p>
              
              {selectedDefect.ranks && selectedDefect.ranks.length > 0 && (
                <>
                  <h4>Ranks</h4>
                  <table style={styles.rankTable}>
                    <thead>
                      <tr>
                        <th style={styles.tableHeader}>Rank</th>
                        <th style={styles.tableHeader}>Description</th>
                        {selectedDefect.ranks.some(r => r.modifier) && (
                          <th style={styles.tableHeader}>Modifier</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedDefect.ranks.map((rank, index) => (
                        <tr key={index}>
                          <td style={styles.tableCell}>{rank.rank}</td>
                          <td style={styles.tableCell}>{rank.description}</td>
                          {selectedDefect.ranks.some(r => r.modifier) && (
                            <td style={styles.tableCell}>{rank.modifier || '-'}</td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', marginTop: '40px', color: 'var(--besm-dark-text)' }}>
            <p>Select a defect from the list to view details</p>
          </div>
        )}
      </div>
    </div>
  );
};
