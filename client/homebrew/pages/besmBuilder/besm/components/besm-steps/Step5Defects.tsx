import React, { useState, CSSProperties, useMemo } from 'react';
import { BesmCharacter, CharacterDefect } from '../../types/besm-character';
import { DEFECTS_LIBRARY, DefectTemplate } from '../../data/defectsLibrary';
import { formatRefs, cleanDescription, computeAvailableSources, matchesSource } from '../common/sourceRefs';

interface Step5DefectsProps {
  character: BesmCharacter;
  onDefectAdd: (defect: CharacterDefect) => void;
  onDefectUpdate: (defect: CharacterDefect) => void;
  onDefectRemove: (id: string) => void;
}

const styles: Record<string, CSSProperties> = {
  container: {
    fontFamily: 'var(--font-main)',
    color: 'var(--besm-dark-text)',
  },
  header: {
    fontFamily: 'var(--font-header)',
    color: 'var(--besm-purple)',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    textAlign: 'center',
    marginBottom: '8px',
  },
  description: {
    textAlign: 'center',
    marginBottom: '24px',
    fontSize: '1rem',
    color: 'var(--besm-dark-text)',
  },
  mainContent: {
    display: 'grid',
    gap: '24px',
    marginBottom: '24px',
  },
  leftPanel: {},
  rightPanel: {},
  searchFilterContainer: {
    display: 'flex',
    gap: '16px',
    marginBottom: '16px',
  },
  searchInput: {
    flex: '2 1 0%',
    padding: '12px',
    border: '2px solid var(--besm-purple)',
    borderRadius: '8px',
    fontSize: '1rem',
    fontFamily: 'var(--font-main)',
  },
  filterSelect: {
    flex: '1 1 0%',
    padding: '12px',
    border: '2px solid var(--besm-purple)',
    borderRadius: '8px',
    fontSize: '1rem',
    fontFamily: 'var(--font-main)',
    cursor: 'pointer',
  },
  itemList: {
    height: '450px',
    overflowY: 'auto',
    border: '2px solid var(--besm-purple)',
    borderRadius: '8px',
    backgroundColor: 'var(--besm-light-bg)',
  },
  item: {
    padding: '12px',
    borderBottom: '2px solid var(--besm-purple)',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  itemSelected: {
    backgroundColor: 'var(--besm-light-pink-bg)',
    borderLeft: '4px solid var(--besm-pink)',
  },
  itemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },
  itemName: {
    fontWeight: 'bold',
    fontSize: '1.1rem',
    color: 'var(--besm-drk-blue)',
  },
  itemCost: {
    backgroundColor: 'var(--besm-green)', 
    color: 'white',
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '0.8rem',
    fontWeight: 'bold',
  },
  itemDescription: {
    fontSize: '0.9rem',
  },
  detailsPanel: {
    padding: '16px',
    border: '2px solid var(--besm-purple)',
    borderRadius: '8px',
    backgroundColor: 'var(--besm-light-bg)',
    height: '529px',
    overflowY: 'auto',
    boxSizing: 'border-box',
  },
  detailHeader: {
    fontFamily: 'var(--font-header)',
    color: 'var(--besm-pink)',
    fontSize: '1.5rem',
    marginBottom: '4px',
  },
  costPerLevel: {
    fontWeight: 'bold',
    color: 'var(--besm-green)', 
    marginBottom: '16px',
  },
  levelSelector: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    margin: '16px 0',
  },
  inputLabel: {
    fontWeight: 'bold',
    fontSize: '1.1rem',
  },
  levelInput: {
    width: '80px',
    padding: '8px',
    border: '2px solid var(--besm-purple)',
    borderRadius: '8px',
    textAlign: 'center',
    fontSize: '1.1rem',
  },
  totalCost: {
    fontWeight: 'bold',
    fontSize: '1.2rem',
    color: 'var(--besm-green)', 
    textAlign: 'center',
    margin: '16px 0',
  },
  actionButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: 'var(--besm-blue)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  placeholder: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: 'var(--besm-dark-text)',
    textAlign: 'center',
    fontSize: '1.1rem',
  },
  selectedSection: {
    marginTop: '24px',
  },
  selectedGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px',
  },
  selectedCard: {
    padding: '12px',
    border: '2px solid var(--besm-purple)',
    borderRadius: '8px',
    backgroundColor: 'var(--besm-light-bg)',
    cursor: 'pointer',
  },
  selectedCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    fontWeight: 'bold',
  },
  removeButton: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: 'var(--besm-pink)',
    color: 'white',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '1rem',
  },
};

const Step5Defects: React.FC<Step5DefectsProps> = ({
  character,
  onDefectAdd,
  onDefectUpdate,
  onDefectRemove,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [selectedDefect, setSelectedDefect] = useState<DefectTemplate | null>(null);
  const [defectRank, setDefectRank] = useState(1);
  const [editingDefect, setEditingDefect] = useState<CharacterDefect | null>(null);

  const availableSources = useMemo(() => computeAvailableSources(DEFECTS_LIBRARY), []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterType(e.target.value);
  };

  const handleSelectDefect = (defect: DefectTemplate) => {
    setSelectedDefect(defect);
    const existingDefect = character.defects.find(d => d.template.key === defect.key);
    if (existingDefect) {
      setEditingDefect(existingDefect);
      setDefectRank(existingDefect.rank);
    } else {
      setEditingDefect(null);
      setDefectRank(1);
    }
  };

  const handleAddOrUpdateDefect = () => {
    if (!selectedDefect) return;

    const newDefect: CharacterDefect = {
      id: editingDefect ? editingDefect.id : `${selectedDefect.key}-${Date.now()}`,
      template: selectedDefect,
      rank: defectRank,
      cpRefund: selectedDefect.cp_refund * defectRank,
      notes: '',
      source: 'base',
      customInputs: {}
    };

    if (editingDefect) {
      onDefectUpdate(newDefect);
    } else {
      onDefectAdd(newDefect);
      // Immediately enter edit mode for the newly added defect
      setEditingDefect(newDefect);
      setSelectedDefect(selectedDefect);
      setDefectRank(newDefect.rank);
    }
  };

  const handleRemoveDefect = (defectId: string) => {
    const defectToRemove = character.defects.find(d => d.id === defectId);
    if (defectToRemove && defectToRemove.template.key === selectedDefect?.key) {
      setSelectedDefect(null);
      setDefectRank(1);
      setEditingDefect(null);
    }
    onDefectRemove(defectId);
  };

  const filteredDefects = DEFECTS_LIBRARY.filter((defect) => {
    const name = defect.name.toLowerCase();
    const description = cleanDescription(defect).toLowerCase();
    const refsStr = formatRefs(defect).toLowerCase();
    const search = searchTerm.toLowerCase();
    const searchTermMatch = name.includes(search) || description.includes(search) || (!!refsStr && refsStr.includes(search));
    const filterTypeMatch = filterType === 'All' || defect.rank_type === filterType;
    const matchesSourceFilter = matchesSource(defect, sourceFilter);
    return searchTermMatch && filterTypeMatch && matchesSourceFilter;
  });

  const calculateDefectRefund = () => {
    if (!selectedDefect) return 0;
    return selectedDefect.cp_refund * defectRank;
  };

  const totalCpRefund = character.defects.reduce((total, defect) => total + defect.cpRefund, 0);

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Step 5: Character Defects</h2>
      <p style={styles.description}>
        Select Defects for your character. Defects grant you extra Character Points (CP) to spend on Attributes or Skills. Total CP Refund from Defects: <strong>{totalCpRefund}</strong>
      </p>

      <div className="defects-main-content" style={styles.mainContent}>
        <div style={styles.leftPanel}>
          <div style={styles.searchFilterContainer}>
            <input
              type="text"
              placeholder="Search defects..."
              value={searchTerm}
              onChange={handleSearchChange}
              style={styles.searchInput}
              className="sheet-input"
            />
            <select style={styles.filterSelect} value={filterType} onChange={handleFilterChange} className="sheet-select">
              <option value="All">All Types</option>
              <option value="Lesser">Lesser</option>
              <option value="Greater">Greater</option>
              <option value="Serious">Serious</option>
            </select>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              style={styles.filterSelect}
              className="sheet-select"
            >
              <option value="all">All Sources</option>
              {availableSources.map(src => (
                <option key={src} value={src}>{src}</option>
              ))}
            </select>
          </div>
          <div style={styles.itemList}>
            {filteredDefects.map((defect) => (
              <div
                key={defect.key}
                style={selectedDefect?.key === defect.key ? { ...styles.item, ...styles.itemSelected } : styles.item}
                onClick={() => handleSelectDefect(defect)}
              >
                <div style={styles.itemHeader}>
                  <span style={styles.itemName}>{defect.name}</span>
                  <span style={styles.itemCost}>{defect.cp_refund} CP Refund/Rank</span>
                </div>
                <p style={styles.itemDescription}>{cleanDescription(defect)}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.rightPanel}>
          {selectedDefect ? (
            <div style={styles.detailsPanel}>
              <h3 style={styles.detailHeader}>{(() => {
                const baseName = selectedDefect?.name || '';
                const key = (selectedDefect?.key || baseName.toLowerCase());
                const isUnique = key === 'unique_defect' || baseName.toLowerCase().startsWith('unique defect');
                if (isUnique) {
                  const custom = (editingDefect?.customInputs as { custom_name?: string })?.custom_name;
                  if (custom && custom.trim().length > 0) return custom.trim();
                  // Fallback: strip any leading 'Unique Defect' prefix and colon
                  const idx = baseName.indexOf(':');
                  if (idx >= 0 && idx + 1 < baseName.length) return baseName.slice(idx + 1).trim();
                }
                return baseName;
              })()}</h3>
              <p style={styles.costPerLevel}>CP Refund: {selectedDefect.cp_refund} per rank</p>
              {(() => {
                const base = cleanDescription(selectedDefect);
                const refs = formatRefs(selectedDefect);
                const refsText = refs.replace(/^Source\(s\):\s*/, '');
                return (
                  <>
                    <p className="desc-desktop" style={styles.description}>{base}</p>
                    {refs && (
                      <p className="desc-desktop" style={{ ...styles.description, marginTop: '-6px' }}>
                        <strong>Source(s):</strong> {refsText}
                      </p>
                    )}
                  </>
                );
              })()}

              <div style={styles.levelSelector}>
                <label style={styles.inputLabel}>Rank:</label>
                <button
                  type="button"
                  onClick={() => setDefectRank((r) => Math.max(1, r - 1))}
                  disabled={defectRank <= 1}
                  aria-label="Decrease Rank"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    border: 'none',
                    backgroundColor: 'var(--besm-light-pink)',
                    color: 'white',
                    fontWeight: 'bold',
                    cursor: defectRank <= 1 ? 'not-allowed' : 'pointer',
                    opacity: defectRank <= 1 ? 0.5 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: 0, minWidth: 32, maxWidth: 32, lineHeight: 1,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}
                >
                  -
                </button>
                <div
                  style={{
                    fontSize: '1.5rem', fontWeight: 'bold', backgroundColor: 'var(--besm-button-blue)', color: 'white',
                    width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}
                  aria-live="polite"
                  aria-label={`Rank value`}
                >
                  {defectRank}
                </div>
                <button
                  type="button"
                  onClick={() => setDefectRank((r) => Math.min((selectedDefect.max_rank || 5), r + 1))}
                  disabled={defectRank >= (selectedDefect.max_rank || 5)}
                  aria-label="Increase Rank"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    border: 'none',
                    backgroundColor: 'var(--besm-light-pink)',
                    color: 'white',
                    fontWeight: 'bold',
                    cursor: defectRank >= (selectedDefect.max_rank || 5) ? 'not-allowed' : 'pointer',
                    opacity: defectRank >= (selectedDefect.max_rank || 5) ? 0.5 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: 0, minWidth: 32, maxWidth: 32, lineHeight: 1,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}
                >
                  +
                </button>
              </div>

              {/* Mobile-only defect description placed after controls */}
              <p className="desc-mobile" style={styles.description}>{selectedDefect.description}</p>

              {/* Total Refund (match attributes' total cost placement) */}
              <div style={styles.totalCost}>Total CP Refund: {calculateDefectRefund()} CP</div>

              <button
                style={{
                  ...styles.actionButton,
                  backgroundColor: '#ff3366',
                  color: 'white',
                  fontWeight: 'bold',
                  textShadow: '0px 1px 2px rgba(0,0,0,0.3)',
                }}
                onClick={handleAddOrUpdateDefect}
              >
                {editingDefect ? 'Update Defect' : 'Add Defect'}
              </button>
            </div>
          ) : (
            <div style={styles.placeholder}>
              <p>Select a defect to view its details</p>
            </div>
          )}
        </div>
      </div>

      <div style={styles.selectedSection}>
        <h3 style={styles.header}>Selected Defects</h3>

        {character.defects.length === 0 ? (
          <div style={styles.placeholder}>
            <p>No defects selected yet. Choose defects from the list above.</p>
          </div>
        ) : (
          <div style={styles.selectedGrid}>
            {character.defects.map((defect) => (
              <div
                key={defect.id}
                style={styles.selectedCard}
                onClick={() => {
                  setSelectedDefect(defect.template);
                  setEditingDefect(defect);
                  setDefectRank(defect.rank);
                }}
              >
                <div style={styles.selectedCardHeader}>
                  <span>{(() => {
                    const baseName = defect?.template?.name || '';
                    const key = (defect?.template?.key || baseName.toLowerCase());
                    const isUnique = key === 'unique_defect' || baseName.toLowerCase().startsWith('unique defect');
                    if (isUnique) {
                      const custom = (defect?.customInputs as { custom_name?: string })?.custom_name;
                      if (custom && custom.trim().length > 0) return custom.trim();
                      const idx = baseName.indexOf(':');
                      if (idx >= 0 && idx + 1 < baseName.length) return baseName.slice(idx + 1).trim();
                    }
                    return baseName;
                  })()}</span>
                  <button onClick={(e) => { e.stopPropagation(); handleRemoveDefect(defect.id); }} style={styles.removeButton}>×</button>
                </div>
                <div>
                  <div style={{ marginTop: '4px' }}>Rank: {defect.rank}</div>
                  <div>Refund: +{defect.cpRefund} CP</div>
                  {/* Small refs preview */}
                  {defect.template.sourcesRefs && defect.template.sourcesRefs.length > 0 && (
                    <div style={{ marginTop: '4px', fontSize: '0.8rem', color: 'var(--besm-dark-text)' }}>
                      {defect.template.sourcesRefs.map(r => `${r.abbr} p${r.page}`).join(', ')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export { Step5Defects };
