import React, { useState, useEffect, useRef } from 'react';
import { AppliedTemplate } from '../../types/besm-character';
import { ClassTemplate, getAllClassTemplates } from '../../data/classTemplatesLibrary';
import { RaceTemplate, getAllRaceTemplates } from '../../data/raceTemplatesLibrary';
import { SizeTemplate, getAllSizeTemplates } from '../../data/sizeTemplatesLibrary';
import { formatRefs, cleanDescription, WithSources } from '../common/sourceRefs';
import { computeAttributeCpCost, computeDefectCpRefund, computeTemplateCp } from '../../utils/templateCpUtils';

interface Step3TemplatesProps {
  onClassTemplateChange: (template: ClassTemplate | null) => void;
  onRaceTemplateChange: (template: RaceTemplate | null) => void;
  onSizeTemplateChange: (template: SizeTemplate | null) => void;
  appliedTemplates?: AppliedTemplate[];
  onRemoveAppliedTemplate?: (appliedId: string) => void;
}

// Helper function to safely access attribute name
const getAttributeName = (attr: unknown): string => {
  if (!attr) return 'Unknown';
  const a = attr as { custom_name?: string; name?: string; attribute?: unknown };
  if (typeof a.custom_name === 'string') return a.custom_name;
  if (typeof a.name === 'string') return a.name;
  if (a.attribute && typeof a.attribute === 'object') {
    return getAttributeName(a.attribute);
  }
  return 'Unknown';
};

// Helper function to safely access defect name
const getDefectName = (defect: unknown): string => {
  if (!defect) return 'Unknown';
  const d = defect as { custom_name?: string; name?: string; defect?: unknown };
  if (typeof d.custom_name === 'string') return d.custom_name;
  if (typeof d.name === 'string') return d.name;
  if (d.defect && typeof d.defect === 'object') {
    return getDefectName(d.defect);
  }
  return 'Unknown';
};

// Helper function to get template name
const getTemplateName = (template: unknown): string => {
  if (!template) return '';
  const t = template as { race_name?: string; name?: string };
  if (typeof t.race_name === 'string') return t.race_name;
  return t.name || '';
};


export const Step3Templates: React.FC<Step3TemplatesProps> = ({
  onClassTemplateChange,
  onRaceTemplateChange,
  onSizeTemplateChange,
  appliedTemplates = [],
  onRemoveAppliedTemplate,
}) => {
  const [classTemplates, setClassTemplates] = useState<ClassTemplate[]>([]);
  const [raceTemplates, setRaceTemplates] = useState<RaceTemplate[]>([]);
  const [sizeTemplates, setSizeTemplates] = useState<SizeTemplate[]>([]);
  
  const [selectedClass, setSelectedClass] = useState<ClassTemplate | null>(null);
  const [selectedRace, setSelectedRace] = useState<RaceTemplate | null>(null);
  const [selectedSize, setSelectedSize] = useState<SizeTemplate | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'class' | 'race' | 'size'>('race');

  useEffect(() => {
    setClassTemplates(getAllClassTemplates());
    setRaceTemplates(getAllRaceTemplates());
    setSizeTemplates(getAllSizeTemplates());
  }, []);

  // Detect number of columns in the templates grid to target the 3-column breakpoint
  const gridRef = useRef<HTMLDivElement | null>(null);
  const [isThreeCol, setIsThreeCol] = useState(false);
  useEffect(() => {
    const measureCols = () => {
      const el = gridRef.current;
      if (!el) return;
      const children = Array.from(el.children) as HTMLElement[];
      if (!children.length) return;
      const firstTop = children[0].offsetTop;
      let firstRowCount = 0;
      for (const child of children) {
        if (child.offsetTop !== firstTop) break;
        firstRowCount++;
      }
      setIsThreeCol(firstRowCount === 3);
    };
    // Measure after layout
    const raf = requestAnimationFrame(measureCols);
    const onResize = () => requestAnimationFrame(measureCols);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Hydrate local selections from appliedTemplates when entering the step
  // or when template libraries finish loading. This ensures summary and card
  // highlighting persist after navigation.
  useEffect(() => {
    if (!appliedTemplates || appliedTemplates.length === 0) return;

    function findByName<T>(list: T[], getName: (t: T) => string, name?: string | null) {
      if (!name) return null;
      const target = name.trim().toLowerCase();
      return list.find((t) => getName(t)?.toLowerCase() === target) || null;
    }

    const appliedClass = appliedTemplates.find((t) => t.type === 'class');
    const appliedRace = appliedTemplates.find((t) => t.type === 'race');
    const appliedSize = appliedTemplates.find((t) => t.type === 'size');

    // Only set if not already selected (avoid overriding an in-progress change)
    if (!selectedClass && classTemplates.length) {
      const match = findByName(classTemplates, (t) => getTemplateName(t), appliedClass?.name);
      if (match) setSelectedClass(match as ClassTemplate);
    }
    if (!selectedRace && raceTemplates.length) {
      const match = findByName(raceTemplates, (t) => getTemplateName(t), appliedRace?.name);
      if (match) setSelectedRace(match as RaceTemplate);
    }
    if (!selectedSize && sizeTemplates.length) {
      const match = findByName(sizeTemplates, (t) => getTemplateName(t), appliedSize?.name);
      if (match) setSelectedSize(match as SizeTemplate);
    }
  }, [appliedTemplates, classTemplates, raceTemplates, sizeTemplates, selectedClass, selectedRace, selectedSize]);

  const handleClassSelect = (template: ClassTemplate | null) => {
    setSelectedClass(template);
    onClassTemplateChange(template);
  };
  
  const handleRaceSelect = (template: RaceTemplate | null) => {
    setSelectedRace(template);
    onRaceTemplateChange(template);
  };
  
  const handleSizeSelect = (template: SizeTemplate | null) => {
    setSelectedSize(template);
    onSizeTemplateChange(template);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const selectedTemplate = React.useMemo(() => {
    return activeTab === 'class' ? selectedClass :
           activeTab === 'race' ? selectedRace :
           selectedSize;
  }, [activeTab, selectedClass, selectedRace, selectedSize]);

  const filteredTemplates = (() => {
    const templates = activeTab === 'class' ? classTemplates :
                     activeTab === 'race' ? raceTemplates :
                     sizeTemplates;
    // Hide pseudo-races that are actually Alternate Forms
    const baseFiltered = activeTab === 'race'
      ? (templates as RaceTemplate[]).filter((t) => (t as { race_name?: string }).race_name !== 'WEREWOLF - WOLF FORM')
      : templates;
    if (!searchTerm.trim()) return baseFiltered;
    const searchLower = searchTerm.toLowerCase();
    return baseFiltered.filter(template => {
      const name = getTemplateName(template);
      const description = 'description' in (template as object)
        ? cleanDescription(template as unknown as WithSources)
        : '';
      const refsStr = formatRefs(template as unknown as WithSources).toLowerCase();
      return (
        name.toLowerCase().includes(searchLower) ||
        description.toLowerCase().includes(searchLower) ||
        (!!refsStr && refsStr.includes(searchLower))
      );
    });
  })();

  // Fallback names from appliedTemplates for display when local selections are null
  const appliedClassNames = (appliedTemplates || [])
    .filter(t => t.type === 'class' && t.name)
    .map(t => t.name.trim())
    .filter(Boolean);
  const appliedRaceNames = (appliedTemplates || [])
    .filter(t => t.type === 'race' && t.name)
    .map(t => t.name.trim())
    .filter(Boolean);
  const appliedSizeName = appliedTemplates?.find(t => t.type === 'size')?.name;
  const joinDedupe = (arr: string[]) => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const n of arr) {
      const k = n.toLowerCase();
      if (!seen.has(k)) { seen.add(k); out.push(n); }
    }
    return out.join(' ');
  };
  const appliedClassJoined = joinDedupe(appliedClassNames);
  const appliedRaceJoined = joinDedupe(appliedRaceNames);

  // Helpers to work with applied templates for highlight/toggle
  const isApplied = (type: 'class' | 'race', name: string) =>
    (appliedTemplates || []).some(t => t.type === type && (t.name || '').toLowerCase() === name.toLowerCase());

  const removeAppliedByName = (type: 'class' | 'race', name: string) => {
    if (!onRemoveAppliedTemplate) return;
    const matches = (appliedTemplates || [])
      .filter(t => t.type === type && (t.name || '').toLowerCase() === name.toLowerCase());
    const last = matches[matches.length - 1];
    if (last) onRemoveAppliedTemplate(last.id);
  };

  const styles: { [key: string]: React.CSSProperties } = {
    templatesStep: {
      maxWidth: '900px',
      margin: '0 auto',
      padding: '0 10px',
      fontFamily: 'var(--font-main)',
      color: 'var(--besm-dark-text)',
    },
    header: {
      fontFamily: "'Permanent Marker', cursive",
      color: 'var(--besm-pink)',
      textShadow: '1px 1px 0px var(--besm-light-bg)',
      letterSpacing: '1px',
      textTransform: 'uppercase',
      marginBottom: '24px',
      textAlign: 'center',
    },
    templatesInfo: {
      backgroundColor: 'var(--besm-light-bg)',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '24px',
      border: '2px solid var(--besm-purple)',
    },
    tabContainer: {
      display: 'flex',
      borderBottom: '2px solid var(--besm-light-gray)',
      marginBottom: '24px',
    },
    tabButton: {
      padding: '10px 20px',
      fontFamily: "'Bangers', cursive",
      fontSize: '1.2rem',
      letterSpacing: '1px',
      cursor: 'pointer',
      backgroundColor: 'transparent',
      border: 'none',
      color: 'var(--besm-drk-blue)',
      borderBottom: '4px solid transparent',
      marginBottom: '-2px',
    },
    tabButtonActive: {
      color: 'var(--besm-pink)',
      borderBottom: '4px solid var(--besm-pink)',
    },
    searchInput: {
      width: '100%',
      padding: '12px',
      border: '2px solid var(--besm-purple)',
      borderRadius: '8px',
      fontSize: '1rem',
      marginBottom: '24px',
      fontFamily: "'Comic Neue', cursive",
    },
    selectedTemplatesSummary: {
      padding: '16px',
      backgroundColor: 'var(--besm-light-bg)',
      borderRadius: '8px',
      marginBottom: '24px',
      border: '2px solid var(--besm-purple)',
    },
    appliedList: {
      marginTop: '12px',
      borderTop: '1px dashed var(--besm-light-gray)',
      paddingTop: '12px',
    },
    appliedItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: '#fff',
      border: '1px solid var(--besm-light-gray)',
      borderRadius: '6px',
      padding: '8px 12px',
      marginBottom: '8px',
    },
    removeBtn: {
      backgroundColor: 'var(--besm-pink)',
      color: '#fff',
      border: 'none',
      borderRadius: '4px',
      padding: '6px 10px',
      cursor: 'pointer',
      fontFamily: "'Bangers', cursive",
      letterSpacing: '0.5px',
    },
    summaryGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
    },
    summaryItem: {
      fontFamily: "'Comic Neue', cursive",
      color: 'var(--besm-dark-text)',
    },
    templatesGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: '16px',
    },
    templateCard: {
      backgroundColor: '#fff',
      color: 'var(--besm-dark-text)',
      border: '2px solid var(--besm-purple)',
      borderRadius: '8px',
      padding: 0, // remove padding so image can reach edges
      cursor: 'pointer',
      transition: 'all 0.2s ease-in-out',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      overflow: 'hidden', // ensure inner content does not spill outside the card
    },
    templateCardRow: {
      display: 'grid',
      gridTemplateColumns: '120px 1fr',
      alignItems: 'stretch',
      columnGap: '12px',
      height: '171px',
    },
    imageSlot: {
      overflow: 'hidden', // crop image within slot
      borderRadius: 0, // let the card clip the image with its own radius
      alignSelf: 'stretch', // fill top to bottom of the row
      backgroundColor: '#fff',
      display: 'flex', // Make the slot a flex container
      height: '100%', // ensure it always matches the row height
    },
    cardContent: {
      flex: 1,
      padding: '16px 10px',
    },
    templateCardSelected: {
      border: '2px solid var(--besm-pink)',
      backgroundColor: 'var(--besm-light-pink-bg)',
      transform: 'translateY(-2px)',
    },
    selectedTemplateDetails: {
      backgroundColor: 'var(--besm-light-bg)',
      borderRadius: '8px',
      padding: '24px',
      marginTop: '24px',
      border: '2px solid var(--besm-pink)',
    },
    detailSection: {
      marginBottom: '16px',
    },
    detailHeader: {
      fontFamily: "'Bangers', cursive",
      fontSize: '1.2rem',
      color: 'var(--besm-drk-blue)',
      marginBottom: '8px',
    },
    detailList: {
      listStyle: 'none',
      paddingLeft: '0',
      color: 'var(--besm-dark-text)',
    },
    detailListItem: {
      fontFamily: "'Comic Neue', cursive",
      marginBottom: '4px',
      color: 'var(--besm-dark-text)',
    },
  };

  // Short description helper
  const getTemplateDescription = (template: unknown): string => {
    if (!template) return '';
    const t = template as { short_description?: unknown; description?: unknown };
    if (t.short_description != null) return String(t.short_description);
    if (t.description != null) return String(t.description);
    return '';
  };

  // Image helper — all BESM images served from /staticImages/besm/
  const getTemplateImageUrl = (template: unknown): string => {
    if (!template) return '';
    const t = template as { imageUrl?: unknown; template?: string };
    if (t.imageUrl) {
      let raw = String(t.imageUrl);
      // Normalize legacy class image paths
      if (t?.template === 'class' && raw.startsWith('/images/') && !raw.startsWith('/images/classes/')) {
        raw = raw.replace('/images/', '/images/classes/');
      }
      // Normalize legacy race image paths
      if (t?.template === 'race' && raw.startsWith('/images/') && !raw.startsWith('/images/races/')) {
        raw = raw.replace('/images/', '/images/races/');
      }
      // Normalize legacy race profile_* image paths
      if (raw.startsWith('/images/profile_')) {
        raw = raw.replace('/images/', '/images/races/');
      }
      // Remap /images/ to /staticImages/besm/
      if (raw.startsWith('/images/')) {
        return raw.replace('/images/', '/staticImages/besm/');
      }
      return raw;
    }
    return '';
  };


  // Render helpers for stat adjustments: omit null/undefined and 0; add '+' for positives
  const formatAdj = (label: string, v: number | null | undefined): string | null => {
    if (v == null || v === 0) return null;
    const sign = v > 0 ? '+' : '';
    return `${label}: ${sign}${v}`;
  };

  const renderStatAdjustments = (
    s: { body_adj?: number | null; mind_adj?: number | null; soul_adj?: number | null; stat?: string; value?: number; points?: number }
  ): string | null => {
    const parts = [
      formatAdj('Body', s.body_adj),
      formatAdj('Mind', s.mind_adj),
      formatAdj('Soul', s.soul_adj),
    ].filter(Boolean) as string[];

    if (parts.length) return parts.join(', ');

    if (s.stat && s.value != null) {
      const sign = s.value > 0 ? '+' : '';
      const cp = s.points != null ? ` (${s.points} CP)` : '';
      return `${s.stat}: ${sign}${s.value}${cp}`;
    }
    return null;
  };

  return (
    <div style={styles.templatesStep}>
      <h2 style={styles.header}>Character Templates</h2>
      
      <div style={styles.templatesInfo}>
        <p style={{ marginBottom: '8px' }}>
          Templates provide pre-defined sets of stats, attributes, and defects for common character archetypes.
          Selecting a template will automatically apply its costs to your character.
        </p>
        <p style={{ fontSize: '0.9rem' }}>
          <strong>Note:</strong> Templates are optional. You can skip this step if you prefer to build your character from scratch.
        </p>
      </div>
      
      <div style={styles.tabContainer}>
        <button
          style={{...styles.tabButton, ...(activeTab === 'race' ? styles.tabButtonActive : {})}}
          onClick={() => setActiveTab('race')}
        >
          Race
        </button>
        <button
          style={{...styles.tabButton, ...(activeTab === 'class' ? styles.tabButtonActive : {})}}
          onClick={() => setActiveTab('class')}
        >
          Class
        </button>
        <button
          style={{...styles.tabButton, ...(activeTab === 'size' ? styles.tabButtonActive : {})}}
          onClick={() => setActiveTab('size')}
        >
          Size
        </button>
      </div>
      
      <input
        type="text"
        placeholder={`Search ${activeTab} templates...`}
        value={searchTerm}
        onChange={handleSearchChange}
        style={styles.searchInput}
        className="sheet-input"
      />
      
      <div style={styles.selectedTemplatesSummary}>
        <h3 style={{...styles.detailHeader, marginBottom: '12px' }}>Selected Templates:</h3>
        <div style={styles.summaryGrid}>
          <div style={styles.summaryItem}>
            <h4 style={{ fontWeight: 'bold' }}>Class:</h4>
            <p>{appliedClassJoined || 'None'}</p>
          </div>
          <div style={styles.summaryItem}>
            <h4 style={{ fontWeight: 'bold' }}>Race:</h4>
            <p>{appliedRaceJoined || 'None'}</p>
          </div>
          <div style={styles.summaryItem}>
            <h4 style={{ fontWeight: 'bold' }}>Size:</h4>
            <p style={{ textTransform: 'uppercase' }}>{selectedSize?.name || appliedSizeName || 'Medium'}</p>
          </div>
        </div>
        {/* Applied Templates list removed; removal now handled by clicking highlighted cards */}
      </div>
      
      <div style={styles.templatesGrid} ref={gridRef}>
        <div 
          style={{
            ...styles.templateCard,
            ...(((activeTab === 'class' && appliedClassNames.length === 0) || 
               (activeTab === 'race' && appliedRaceNames.length === 0) ||
               (activeTab === 'size' && !selectedSize && !appliedSizeName)) 
              ? styles.templateCardSelected 
              : {}),
          }}
          onClick={() => {
            if (activeTab === 'class') handleClassSelect(null);
            else if (activeTab === 'race') handleRaceSelect(null);
            else handleSizeSelect(null);
          }}
        >
          <div style={{ ...styles.templateCardRow, ...(isThreeCol ? { height: '171px' } : {}) }}>
            {activeTab !== 'size' && (
              activeTab === 'class' ? (
                <div style={{ ...styles.imageSlot, ...(isThreeCol ? { flex: '0 0 120px' } : {}) }}>
                  <img
                    src="/staticImages/besm/classes/no_class.png"
                    alt="No Class Template"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </div>
              ) : activeTab === 'race' ? (
                <div
                  style={{
                    ...styles.imageSlot,
                    flex: '0 0 120px',
                    ...(isThreeCol ? { flex: '0 0 120px' } : {}),
                    backgroundImage: 'url(/staticImages/besm/races/profile_no_race.png)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                  }}
                />
              ) : (
                <div style={{ ...styles.imageSlot, ...(isThreeCol ? { flex: '0 0 120px' } : {}) }}>Image here</div>
              )
            )}
            <div style={styles.cardContent}>
              <h3 style={{...styles.detailHeader, fontSize: '1.1rem'}}>No {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Template</h3>
              <p style={{fontFamily: "'Comic Neue', cursive", marginBottom: 6}}>CP: 0</p>
              <p style={{fontFamily: "'Comic Neue', cursive", fontSize: '0.85rem'}}>Build your character from scratch without this template.</p>
            </div>
          </div>
        </div>
        
        {filteredTemplates.map(template => {
          const templateName = getTemplateName(template);
          const isSelected = 
            (activeTab === 'class' && isApplied('class', templateName)) ||
            (activeTab === 'race' && isApplied('race', templateName)) ||
            (activeTab === 'size' && selectedSize === template);
            
          const cp = computeTemplateCp(template);
          const desc = getTemplateDescription(template);
          return (
            <div 
              key={templateName}
              style={{...styles.templateCard, ...(isSelected ? styles.templateCardSelected : {})}}
              onClick={() => {
                if (activeTab === 'class') {
                  isApplied('class', templateName)
                    ? removeAppliedByName('class', templateName)
                    : handleClassSelect(template as ClassTemplate);
                } else if (activeTab === 'race') {
                  isApplied('race', templateName)
                    ? removeAppliedByName('race', templateName)
                    : handleRaceSelect(template as RaceTemplate);
                } else {
                  handleSizeSelect(template as SizeTemplate);
                }
              }}
            >
              <div style={{ ...styles.templateCardRow, ...(isThreeCol ? { height: '171px' } : {}) }}>
                {activeTab !== 'size' && (() => {
                  const imgUrl = getTemplateImageUrl(template);
                  const scale = (template as { imageScale?: number }).imageScale;
                  const offsetY = (template as { imageOffsetY?: string }).imageOffsetY;
                  const backgroundStyle: React.CSSProperties = {
                    ...styles.imageSlot,
                    flex: '0 0 120px',
                    ...(isThreeCol ? { flex: '0 0 120px' } : {}),
                    backgroundImage: imgUrl ? `url(${imgUrl})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    transform: scale || offsetY ? `translateY(${offsetY || '0'}) scale(${scale || 1})` : undefined,
                    transformOrigin: 'center',
                  };

                  return (
                    <div style={backgroundStyle}>
                      {!imgUrl && 'Image here'}
                    </div>
                  );
                })()}
                <div style={styles.cardContent}>
                  <h3 style={{...styles.detailHeader, fontSize: '1.1rem'}}>{templateName}</h3>
                  {cp != null && (
                    <p style={{fontFamily: "'Comic Neue', cursive", fontWeight: 700, margin: '2px 0 8px'}}>CP: {cp}</p>
                  )}
                  {(() => {
                    // Small card: show only cleaned description; no page refs here
                    const base = desc ? cleanDescription({ description: desc } as WithSources) : '';
                    return base ? (
                      <p style={{fontFamily: "'Comic Neue', cursive", fontSize: '0.85rem'}}>{base}</p>
                    ) : null;
                  })()}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {selectedTemplate && (
        <div style={styles.selectedTemplateDetails}>
          <h3 style={{...styles.detailHeader, textAlign: 'left', fontSize: '1.5rem', color: 'var(--besm-pink)'}}>
            {getTemplateName(selectedTemplate)}
          </h3>
          
          {(() => {
            const cp = computeTemplateCp(selectedTemplate);
            if (cp == null) return null;
            const refs = formatRefs(selectedTemplate as unknown as WithSources);
            const refsText = refs ? refs.replace(/^Source\(s\):\s*/, '') : null;
            return (
              <>
                <p style={{fontWeight: 'bold', color: 'var(--besm-purple)', marginBottom: '6px'}}>Total CP Cost: {cp}</p>
                {refsText && (
                  <p style={{ margin: '0 0 16px 0', color: 'var(--besm-dark-text)' }}>
                    <strong>Source(s):</strong> {refsText}
                  </p>
                )}
              </>
            );
          })()}
          
          <div style={styles.summaryGrid}>
            {'stats' in selectedTemplate && selectedTemplate.stats?.length > 0 && (
              <div style={styles.detailSection}>
                <h4 style={styles.detailHeader}>
                  {activeTab === 'race' ? 'Stat Adjustments' : 'Stats'}:
                </h4>
                <ul style={styles.detailList}>
                  {selectedTemplate.stats.map((stat, index) => {
                    const text = renderStatAdjustments(stat);
                    if (!text) return null;
                    return (
                      <li key={index} style={styles.detailListItem}>
                        {text}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {selectedTemplate.attributes?.length > 0 && (
              <div style={styles.detailSection}>
                <h4 style={styles.detailHeader}>Attributes:</h4>
                <ul style={styles.detailList}>
                  {selectedTemplate.attributes.map((attr: unknown, index: number) => (
                    <li key={index} style={styles.detailListItem}>
                      {getAttributeName(attr)}
                      {(attr as { level?: number })?.level != null && ` (Level ${(attr as { level?: number }).level})`}
                      {(() => {
                        const cost = computeAttributeCpCost(attr);
                        return cost != null ? ` (${cost} CP)` : '';
                      })()}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selectedTemplate.defects?.length > 0 && (
              <div style={styles.detailSection}>
                <h4 style={styles.detailHeader}>Defects:</h4>
                <ul style={styles.detailList}>
                  {selectedTemplate.defects.map((defect: unknown, index: number) => (
                    <li key={index} style={styles.detailListItem}>
                      {getDefectName(defect)}
                      {(defect as { rank?: number })?.rank != null && ` (Rank ${(defect as { rank?: number }).rank})`}
                      {(() => {
                        const refund = computeDefectCpRefund(defect);
                        return refund != null ? ` (-${refund} CP)` : '';
                      })()}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};