import React, { useState } from 'react';
import { ModernDaySubgenres, FantasySubgenres, FutureSubgenres, HistoricalSubgenres } from '../../data/skillsCostsByGenre';
import { BesmCharacter } from '../../types/besm-character';

interface Step1CharacterConceptProps {
  character: BesmCharacter;
  onCharacterChange: (updates: Partial<BesmCharacter>) => void;
  onCharacterPointsChange: (totalCP: number) => void;
  onPowerLevelCPChange?: (cp: number) => void; // lift advisory selection to parent
}

export const Step1CharacterConcept: React.FC<Step1CharacterConceptProps> = ({
  character,
  onCharacterChange,
  onCharacterPointsChange,
  onPowerLevelCPChange,
}) => {

  const [cpValue, setCpValue] = useState(0); // Advisory-only: benchmark selector (default to 0)
  const [earnedCP, setEarnedCP] = useState<number>(character.totalCP || 0);
  const [showBenchmarks, setShowBenchmarks] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onCharacterChange({ [name]: value });
  };

  const handleCPChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    // Power Level is advisory only; do not change character CP
    const newCP = parseInt(e.target.value);
    setCpValue(newCP);
    onPowerLevelCPChange?.(newCP);
  };

  const handleEarnedCPDirectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    const newEarned = isNaN(val) ? 0 : Math.max(0, val);
    setEarnedCP(newEarned);
    onCharacterPointsChange(newEarned);
  };

  const benchmarks = [
    { powerLevel: 'Sub-Human',   minCP: 0,   maxCP: 24,  maxStat: 5,   attributeLevels: '2',    combatValues: '1 / 6',   hpEp: '10 / 40',   damageMultiplier: '2 / 4' },
    { powerLevel: 'Human',       minCP: 25,  maxCP: 49,  maxStat: 7,   attributeLevels: '3',    combatValues: '2 / 7',   hpEp: '30 / 60',   damageMultiplier: '3 / 6' },
    { powerLevel: 'Adventurer',  minCP: 50,  maxCP: 74,  maxStat: 9,   attributeLevels: '4',    combatValues: '3 / 8',   hpEp: '40 / 80',   damageMultiplier: '4 / 8' },
    { powerLevel: 'Heroic',      minCP: 75,  maxCP: 99,  maxStat: 10,  attributeLevels: '5',    combatValues: '4 / 9',   hpEp: '50 / 100',  damageMultiplier: '4 / 9' },
    { powerLevel: 'Mythical',    minCP: 100, maxCP: 149, maxStat: 12,  attributeLevels: '6',    combatValues: '5 / 10',  hpEp: '60 / 120',  damageMultiplier: '5 / 10' },
    { powerLevel: 'Superhuman',  minCP: 150, maxCP: 199, maxStat: '12+', attributeLevels: '7-8', combatValues: '6 / 12',  hpEp: '70 / 140',  damageMultiplier: '5 / 11' },
    { powerLevel: 'Superpowered',minCP: 200, maxCP: 249, maxStat: '12+', attributeLevels: '8-9', combatValues: '7 / 12+', hpEp: '80 / 160',  damageMultiplier: '6 / 12' },
    { powerLevel: 'Godlike',     minCP: 250, maxCP: Infinity, maxStat: '12+', attributeLevels: '10+', combatValues: '8 / 12+', hpEp: '100 / 200+', damageMultiplier: '6 / 14+' },
  ];

  const currentBenchmark = benchmarks.find(b => cpValue >= b.minCP && cpValue <= b.maxCP) || benchmarks[benchmarks.length - 1];

  // (Indicators moved to StepNavigation; parsing helpers kept inline there.)

  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      maxWidth: '800px',
      margin: '0 auto',
      padding: '0 10px',
    },
    title: {
      fontFamily: "'Permanent Marker', cursive",
      color: 'var(--besm-pink)',
      textShadow: '1px 1px 0px #ffffff',
      letterSpacing: '1px',
      textTransform: 'uppercase',
      marginBottom: '24px',
      textAlign: 'center',
    },
    section: {
      backgroundColor: 'var(--besm-light-bg)',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '24px',
      border: '2px solid var(--besm-purple)',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    },
    formGroup: {
      marginBottom: '16px',
    },
    label: {
      display: 'block',
      marginBottom: '8px',
      fontWeight: 'bold',
      fontFamily: "'Bangers', cursive",
      color: 'var(--besm-purple)',
      fontSize: '1.2rem',
      letterSpacing: '1px',
    },
    input: {
      width: '100%',
      padding: '10px 15px',
      border: '2px solid var(--besm-black)',
      borderRadius: '4px',
      fontSize: '1rem',
      fontFamily: "'Comic Neue', sans-serif",
      backgroundColor: '#fff',
      color: 'var(--besm-dark-text)',
    },
    textarea: {
      width: '100%',
      padding: '10px 15px',
      border: '2px solid var(--besm-black)',
      borderRadius: '4px',
      fontSize: '1rem',
      fontFamily: "'Comic Neue', sans-serif",
      backgroundColor: '#fff',
      color: 'var(--besm-dark-text)',
      resize: 'vertical',
      minHeight: '100px',
    },
    select: {
      width: '100%',
      padding: '10px 15px',
      border: '2px solid var(--besm-black)',
      borderRadius: '4px',
      fontSize: '1rem',
      fontFamily: "'Comic Neue', sans-serif",
      backgroundColor: '#fff',
      color: 'var(--besm-dark-text)',
    },
    benchmarkInfo: {
      marginTop: '16px',
      padding: '16px',
      backgroundColor: 'rgba(0, 123, 255, 0.05)',
      borderRadius: '8px',
      border: '1px solid rgba(0, 123, 255, 0.2)',
    },
    benchmarkTitle: {
      fontFamily: "'Bangers', cursive",
      color: 'var(--besm-button-blue)',
      fontSize: '1.1rem',
      marginBottom: '8px',
    },
    toggleButton: {
      background: 'none',
      border: 'none',
      color: 'var(--besm-button-blue)',
      fontWeight: 'bold',
      cursor: 'pointer',
      padding: '5px',
      fontSize: '0.9rem',
    },
    tableContainer: {
      marginTop: '12px',
      overflowX: 'auto',          // allow horizontal scroll
      overflowY: 'hidden',        // avoid vertical scrollbar here
    },
    table: {
      minWidth: '100%',
      borderCollapse: 'collapse',
      backgroundColor: '#fff',
      borderRadius: '4px',
      overflow: 'hidden',
    },
    th: {
      backgroundColor: 'var(--besm-purple)',
      color: 'white',
      padding: '10px',
      textAlign: 'center',
      fontFamily: "'Bangers', cursive",
      letterSpacing: '1px',
    },
    td: {
      padding: '10px',
      border: '1px solid #ddd',
      textAlign: 'center',
      color: 'var(--besm-dark-text)',
    },
    highlightRow: {
      backgroundColor: 'rgba(233, 58, 125, 0.1)',
      fontWeight: 'bold',
    },
    cpSection: {
      marginTop: '16px',
      paddingTop: '16px',
      borderTop: '2px dashed var(--besm-purple)',
    },
    addCpButton: {
      padding: '10px 15px',
      backgroundColor: 'var(--besm-button-blue)',
      color: 'white',
      border: '2px solid var(--besm-black)',
      borderRadius: '4px',
      fontWeight: 'bold',
      cursor: 'pointer',
    },
    guideBox: {
      backgroundColor: '#e9f7fe',
      borderLeft: '4px solid #3498db',
      padding: '12px',
      borderRadius: '4px',
      fontFamily: "'Trebuchet MS', sans-serif",
      color: 'var(--besm-dark-text)',
    },
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Character Concept</h2>
      
      <div style={styles.section}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
          <div style={styles.formGroup}>
            <label htmlFor="playerName" style={styles.label}>Player Name</label>
            <input
              type="text"
              id="playerName"
              name="playerName"
              value={character.playerName ?? ''}
              onChange={handleInputChange}
              style={styles.input}
              className="sheet-input"
              placeholder="Enter player's name"
            />
          </div>
          <div style={styles.formGroup}>
            <label htmlFor="gmName" style={styles.label}>Game Master Name</label>
            <input
              type="text"
              id="gmName"
              name="gmName"
              value={character.gmName ?? ''}
              onChange={handleInputChange}
              style={styles.input}
              className="sheet-input"
              placeholder="Enter GM's name"
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
          <div style={styles.formGroup}>
            <label htmlFor="habitat" style={styles.label}>Homeworld / Habitat</label>
            <input
              type="text"
              id="habitat"
              name="habitat"
              value={character.habitat ?? ''}
              onChange={handleInputChange}
              style={styles.input}
              className="sheet-input"
              placeholder="E.g., Earth, Mars Colony, Undersea Habitat"
            />
          </div>
          <div style={styles.formGroup}>
            <label htmlFor="gender" style={styles.label}>Gender</label>
            <input
              type="text"
              id="gender"
              name="gender"
              value={character.gender ?? ''}
              onChange={handleInputChange}
              style={styles.input}
              className="sheet-input"
              placeholder="Enter gender"
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
          <div style={styles.formGroup}>
            <label htmlFor="height" style={styles.label}>Height</label>
            <input
              type="text"
              id="height"
              name="height"
              value={character.height ?? ''}
              onChange={handleInputChange}
              style={styles.input}
              className="sheet-input"
              placeholder={'e.g., 5\'11" or 180 cm'}
            />
          </div>
          <div style={styles.formGroup}>
            <label htmlFor="weight" style={styles.label}>Weight</label>
            <input
              type="text"
              id="weight"
              name="weight"
              value={character.weight ?? ''}
              onChange={handleInputChange}
              style={styles.input}
              className="sheet-input"
              placeholder="e.g., 170 lb or 77 kg"
            />
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.formGroup}>
          <label htmlFor="name" style={styles.label}>Character Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={character.name}
            onChange={handleInputChange}
            style={styles.input}
            className="sheet-input"
            placeholder="Enter character name"
          />
        </div>
        
        <div style={styles.formGroup}>
          <label htmlFor="identity" style={styles.label}>Identity / Alias</label>
          <input
            type="text"
            id="identity"
            name="identity"
            value={character.identity}
            onChange={handleInputChange}
            style={styles.input}
            className="sheet-input"
            placeholder="Enter character identity or alias"
          />
        </div>
      </div>
      
      <div style={styles.section}>
        <div style={styles.formGroup}>
          <label htmlFor="description" style={styles.label}>Character Description</label>
          <textarea
            id="description"
            name="description"
            value={character.description}
            onChange={handleInputChange}
            style={styles.textarea}
            className="sheet-input"
            placeholder="Describe your character's concept, personality, and background"
            rows={5}
          />
        </div>
      </div>
      
      <div style={styles.section}>
        <div style={styles.formGroup}>
          <label htmlFor="cp" style={styles.label}>Power Level</label>
          <select
            id="cp"
            value={cpValue}
            onChange={handleCPChange}
            style={styles.select}
            className="sheet-select"
          >
            <option value="0">Sub-Human (0-24 CP)</option>
            <option value="25">Human (25-49 CP)</option>
            <option value="50">Adventurer (50-74 CP)</option>
            <option value="75">Heroic (75-99 CP)</option>
            <option value="100">Mythical (100-149 CP)</option>
            <option value="150">Superhuman (150-199 CP)</option>
            <option value="200">Superpowered (200-249 CP)</option>
            <option value="250">Godlike (250+ CP)</option>
          </select>
          <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '4px' }}>
            Choose a Power Level for guidance. It does not change your CP. Enter your total CP under Total CP below.
          </p>
          
          <div style={styles.benchmarkInfo}>
            <h4 style={styles.benchmarkTitle}>Power Level: {currentBenchmark.powerLevel}</h4>
            <p style={{ fontSize: '0.9rem' }}>Suggested Max Stat: {currentBenchmark.maxStat}</p>
            
            <div>
              <button 
                onClick={() => setShowBenchmarks(!showBenchmarks)}
                style={styles.toggleButton}
              >
                {showBenchmarks ? '▼ Hide' : '▶ Show'} All Benchmarks
              </button>
              
              {showBenchmarks && (
                <div style={styles.tableContainer}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Power Level</th>
                        <th style={styles.th}>CP</th>
                        <th style={styles.th}>Max Stat</th>
                        <th style={styles.th}>Attributes</th>
                        <th style={styles.th}>Combat</th>
                        <th style={styles.th}>HP/EP</th>
                        <th style={styles.th}>Damage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {benchmarks.map((b, i) => (
                        <tr key={i} style={b.powerLevel === currentBenchmark.powerLevel ? styles.highlightRow : {}}>
                          <td style={styles.td}>{b.powerLevel}</td>
                          <td style={styles.td}>{b.maxCP === Infinity ? `${b.minCP}+` : `${b.minCP}-${b.maxCP}`}</td>
                          <td style={styles.td}>{b.maxStat}</td>
                          <td style={styles.td}>{b.attributeLevels}</td>
                          <td style={styles.td}>{b.combatValues}</td>
                          <td style={styles.td}>{b.hpEp}</td>
                          <td style={styles.td}>{b.damageMultiplier}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Advisory indicators moved to persistent StepNavigation */}

            <div style={styles.cpSection}>
              <h4 style={{...styles.label, fontSize: '1.1rem', marginBottom: '8px'}}>Total CP</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="number"
                  style={{...styles.input, flex: 1}}
                  value={earnedCP}
                  onChange={handleEarnedCPDirectChange}
                  placeholder="Enter total CP for this character"
                  min="0"
                  className="sheet-input"
                />
              </div>
              <div style={{ marginTop: '8px', fontSize: '0.9rem', color: 'var(--besm-dark-text)' }}>
                <p style={{ fontWeight: 'bold' }}>Total CP: {earnedCP}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Genre selection */}
      <div style={styles.section}>
        <div style={styles.formGroup}>
          <label htmlFor="selectedGenre" style={styles.label}>Campaign Genre (affects Skill rank costs)</label>
          <select
            id="selectedGenre"
            name="selectedGenre"
            value={character.selectedGenre ?? 'Multi-Genre'}
            onChange={(e) => onCharacterChange({ selectedGenre: e.target.value, selectedSubgenre: null })}
            style={styles.select}
            className="sheet-select"
          >
            {/* Alphabetized */}
            <option value="Fantasy">Fantasy</option>
            <option value="Future">Future</option>
            <option value="Historical">Historical</option>
            <option value="Modern Day">Modern Day</option>
            <option value="Multi-Genre">Multi-Genre</option>
          </select>
          <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '4px' }}>
            Choose the exact genre used for your campaign. Skill rank costs will follow the selected table.
          </p>
        </div>
      </div>

      {(character.selectedGenre === 'Modern Day') && (
        <div style={styles.section}>
          <div style={styles.formGroup}>
            <label htmlFor="selectedSubgenre" style={styles.label}>Modern Day Subgenre</label>
            <select
              id="selectedSubgenre"
              name="selectedSubgenre"
              value={character.selectedSubgenre ?? ''}
              onChange={(e) => onCharacterChange({ selectedSubgenre: e.target.value || null })}
              style={styles.select}
              className="sheet-select"
            >
              <option value="">(none)</option>
              {ModernDaySubgenres.map((sg) => (
                <option key={sg} value={sg}>{sg}</option>
              ))}
            </select>
            <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '4px' }}>
              Select a Modern Day subgenre to refine skill costs.
            </p>
          </div>
        </div>
      )}

      {(character.selectedGenre === 'Fantasy') && (
        <div style={styles.section}>
          <div style={styles.formGroup}>
            <label htmlFor="selectedSubgenreFantasy" style={styles.label}>Fantasy Subgenre</label>
            <select
              id="selectedSubgenreFantasy"
              name="selectedSubgenreFantasy"
              value={character.selectedSubgenre ?? ''}
              onChange={(e) => onCharacterChange({ selectedSubgenre: e.target.value || null })}
              style={styles.select}
              className="sheet-select"
            >
              <option value="">(none)</option>
              {FantasySubgenres.map((sg) => (
                <option key={sg} value={sg}>{sg}</option>
              ))}
            </select>
            <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '4px' }}>
              Select a Fantasy subgenre to refine skill costs.
            </p>
          </div>
        </div>
      )}

      {(character.selectedGenre === 'Future') && (
        <div style={styles.section}>
          <div style={styles.formGroup}>
            <label htmlFor="selectedSubgenreFuture" style={styles.label}>Future Subgenre</label>
            <select
              id="selectedSubgenreFuture"
              name="selectedSubgenreFuture"
              value={character.selectedSubgenre ?? ''}
              onChange={(e) => onCharacterChange({ selectedSubgenre: e.target.value || null })}
              style={styles.select}
              className="sheet-select"
            >
              <option value="">(none)</option>
              {FutureSubgenres.map((sg) => (
                <option key={sg} value={sg}>{sg}</option>
              ))}
            </select>
            <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '4px' }}>
              Select a Future subgenre to refine skill costs.
            </p>
          </div>
        </div>
      )}

      {(character.selectedGenre === 'Historical') && (
        <div style={styles.section}>
          <div style={styles.formGroup}>
            <label htmlFor="selectedSubgenreHistorical" style={styles.label}>Historical Subgenre</label>
            <select
              id="selectedSubgenreHistorical"
              name="selectedSubgenreHistorical"
              value={character.selectedSubgenre ?? ''}
              onChange={(e) => onCharacterChange({ selectedSubgenre: e.target.value || null })}
              style={styles.select}
              className="sheet-select"
            >
              <option value="">(none)</option>
              {HistoricalSubgenres.map((sg) => (
                <option key={sg} value={sg}>{sg}</option>
              ))}
            </select>
            <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '4px' }}>
              Select a Historical subgenre to refine skill costs.
            </p>
          </div>
        </div>
      )}

      {/* Guide section removed per user request */}
    </div>
  );
};
