import React, { useEffect } from 'react';
import { BesmCharacter, CharacterDefect } from '../../types/besm-character';

interface Step2StatsProps {
  character: BesmCharacter;
  onStatChange: (stat: 'body' | 'mind' | 'soul', value: number) => void;
}

export const Step2Stats: React.FC<Step2StatsProps> = ({
  character,
  onStatChange
}) => {
  // Define all styles as React inline styles
  const styles = {
    statsStep: {
      maxWidth: '780px',
      margin: '0 auto',
      padding: '0 10px'
    },
    statsInfo: {
      backgroundColor: 'var(--besm-light-bg)',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '24px',
      border: '2px solid var(--besm-purple)'
    },
    cpSummary: {
      marginTop: '12px',
      padding: '8px',
      backgroundColor: '#007bff',
      color: 'white',
      borderRadius: '4px',
      fontSize: '0.9rem'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
      marginBottom: '24px',
      width: '95%',
      margin: '0 auto'
    },
    statControl: {
      backgroundColor: '#fff',
      borderRadius: '8px',
      padding: '12px',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      width: '100%',
      boxSizing: 'border-box' as const,
      border: '2px solid var(--besm-purple)',
      marginBottom: '24px'
    },
    statHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '8px'
    },
    statName: {
      fontSize: '1.25rem',
      fontWeight: 'bold',
      margin: '0',
      fontFamily: "'Permanent Marker', cursive",
      color: 'var(--besm-pink)',
      textTransform: 'uppercase' as const
    },
    statValue: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      backgroundColor: 'var(--besm-button-blue)',
      color: 'white',
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
    },
    statDescription: {
      marginBottom: '16px',
      fontSize: '0.9rem',
      color: '#6c757d',
      height: '100px',
      display: 'flex',
      alignItems: 'flex-start'
    },
    statSliderContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      marginBottom: '8px',
      marginTop: '8px'
    },
    statButton: {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      border: 'none',
      backgroundColor: 'var(--besm-light-pink)',
      color: 'white',
      fontWeight: 'bold',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 0,
      minWidth: '32px',
      maxWidth: '32px',
      lineHeight: '1',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
    },
    statButtonDisabled: {
      opacity: '0.5',
      cursor: 'not-allowed'
    },
    statButtonHover: {
      backgroundColor: '#dee2e6'
    },
    statCost: {
      fontSize: '0.9rem',
      color: 'var(--color-text-light)',
      marginTop: '8px',
      fontWeight: 'bold'
    },
    statLabel: {
      fontWeight: 'bold',
      fontSize: '1.2rem',
      marginBottom: '10px',
      color: 'var(--color-text-dark)',
      fontFamily: 'var(--font-family-main)',
    },
    statInput: {
      width: '60px',
      padding: '8px',
      textAlign: 'center' as const,
      borderRadius: '4px',
      border: '1px solid var(--color-border)',
      backgroundColor: 'var(--color-background-light)',
      fontSize: '1.2rem',
    },
    derivedValues: {
      backgroundColor: 'var(--besm-light-bg)',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '24px',
      border: '2px solid var(--besm-purple)'
    },
    derivedGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '24px',
      marginTop: '12px'
    },
    derivedStat: {
      backgroundColor: '#fff',
      padding: '12px',
      borderRadius: '4px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
    },
    derivedLabel: {
      fontWeight: 'bold',
      display: 'block',
      marginBottom: '4px',
      fontFamily: "'Permanent Marker', cursive",
      color: 'var(--besm-pink)',
      fontSize: '1.1rem'
    },
    derivedValue: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      fontFamily: "'Bangers', cursive",
      color: 'var(--besm-purple)',
      letterSpacing: '1px'
    },
    derivedFormula: {
      fontSize: '0.8rem',
      color: '#6c757d',
      fontStyle: 'italic'
    },
    derivedValueBox: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '4px 8px',
      backgroundColor: 'var(--color-background-light)',
      borderRadius: '4px',
      marginBottom: '8px'
    },
    derivedValuesGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '20px',
      marginTop: '20px',
    },
    derivedValuesContainer: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '8px',
    },
    derivedHeader: {
      fontFamily: 'var(--font-family-main)',
      fontSize: '1.5em',
      fontWeight: 'bold',
      textDecoration: 'underline',
      marginBottom: '10px',
      color: 'var(--besm-pink)',
    },
  };

  // Use React's useState and useEffect for responsive design


  const calculateCost = (statValue: number) => {
    if (statValue <= 0) return 0;
    return statValue < 12 ? statValue * 2 : 24 + (statValue - 12) * 4;
  };

  const availableCP = character.totalCP - character.totalPointsSpent;

  // Compute Augmented bonuses per stat from current character attributes
  const augmentedBonus = (() => {
    let body = 0, mind = 0, soul = 0;
    (character.attributes || []).forEach(attr => {
      if (attr?.template?.key === 'augmented' && attr.level && attr.customInputs?.stat_target) {
        const target = String(attr.customInputs.stat_target);
        if (target === 'Body') body += attr.level;
        if (target === 'Mind') mind += attr.level;
        if (target === 'Soul') soul += attr.level;
      }
    });
    return { body, mind, soul };
  })();

  const calculateDerivedValues = () => {
    // 1. Start with base stats
    const { body: baseBody, mind: baseMind, soul: baseSoul } = character.stats;

    // 2. Initialize modifiers and multipliers
    let bodyMods = 0;
    let mindMods = 0;
    let soulMods = 0;

    const derivedMods: { [key: string]: number } = { CV: 0, ACV: 0, DCV: 0, HP: 0, EP: 0, DM: 0, SV: 0, SP: 0, SCV: 0, SOP: 0 };
    const multipliers: { [key: string]: number } = { CV: 1, ACV: 1, DCV: 1, HP: 1, EP: 1, DM: 1, SV: 1, SP: 1, SCV: 1, SOP: 1 };

    // Process Attributes
    (character.attributes || []).forEach(attr => {
      const statMods = attr.template.stat_mods;
      if (!statMods) return;

      const level = attr.level || 1;

      if (statMods.dynamic && attr.template.key === 'augmented' && attr.customInputs?.stat_target) {
        const target = attr.customInputs.stat_target;
        if (target === 'Body') bodyMods += level;
        if (target === 'Mind') mindMods += level;
        if (target === 'Soul') soulMods += level;
      }

      if (statMods.base) {
        bodyMods += (statMods.base.Body || 0) * level;
        mindMods += (statMods.base.Mind || 0) * level;
        soulMods += (statMods.base.Soul || 0) * level;
      }

      if (statMods.derived) {
        for (const key in statMods.derived) {
          if (key in derivedMods) derivedMods[key] += statMods.derived[key] * level;
        }
      }

      const attrMultipliers = (statMods as { multipliers?: Record<string, number> }).multipliers;
      if (attrMultipliers) {
        for (const key in attrMultipliers) {
          if (key in multipliers) multipliers[key] *= attrMultipliers[key];
        }
      }
    });

    // Process Defects
    (character.defects || []).forEach(d => {
      const defect = d as CharacterDefect;
      const statMods = defect.template?.stat_mods;
      const defMultipliers = (statMods as { multipliers?: Record<string, number> })?.multipliers;
      if (defMultipliers) {
        for (const key in defMultipliers) {
          if (key in multipliers) {
            multipliers[key] *= defMultipliers[key];
          }
        }
      }
    });

    // 3. Calculate final stats
    const finalBody = Math.max(0, baseBody + bodyMods);
    const finalMind = Math.max(0, baseMind + mindMods);
    const finalSoul = Math.max(0, baseSoul + soulMods);

    // 4. Calculate derived values
    let cv = Math.floor((finalBody + finalMind + finalSoul) / 3);
    let hp = (finalBody + finalSoul) * 5;
    let ep = (finalMind + finalSoul) * 5;
    let sv = finalBody * 2;
    let dm = 5;
    let sp = finalMind + finalSoul;
    let sop = finalMind * 10;
    let scv = Math.floor((finalMind + finalSoul) / 2);

    // 5. Apply direct modifiers
    cv += derivedMods.CV;
    let acv = cv + derivedMods.ACV;
    let dcv = cv + derivedMods.DCV;
    hp += derivedMods.HP;
    ep += derivedMods.EP;
    sv += derivedMods.SV;
    dm += derivedMods.DM;
    sp += derivedMods.SP;
    sop += derivedMods.SOP;
    scv += derivedMods.SCV;

    // 6. Apply multipliers
    acv = Math.floor(acv * multipliers.ACV * multipliers.CV);
    dcv = Math.floor(dcv * multipliers.DCV * multipliers.CV);
    hp = Math.floor(hp * multipliers.HP);
    ep = Math.floor(ep * multipliers.EP);
    sv = Math.floor(sv * multipliers.SV);
    dm = Math.floor(dm * multipliers.DM);
    sp = Math.floor(sp * multipliers.SP);
    sop = Math.floor(sop * multipliers.SOP);
    scv = Math.floor(scv * multipliers.SCV);

    // --- Movement Calculations ---
    const getSpeedRangeMultiplier = () => {
      const speedMod = character.size?.modifiers?.speedRangeMultiplier;
      if (!speedMod) return 1;
      const value = parseFloat(speedMod.replace(/[^\d.-]/g, ''));
      if (isNaN(value)) return 1;
      return speedMod.includes('÷') ? 1 / value : value;
    };
    const sizeMultiplier = getSpeedRangeMultiplier();
    const fastMultiplier = (character.attributes || []).reduce((multiplier, attr) => {
      if (attr.template.key === 'special_movement' && (attr.notes?.toLowerCase().includes('fast') || attr.template.name.toLowerCase().includes('fast'))) {
        return multiplier * 2;
      }
      return multiplier;
    }, 1);
    const calculateFinalSpeed = (base: number) => (finalBody * base) * sizeMultiplier * fastMultiplier;

    return {
      finalBody, finalMind, finalSoul,
      HP: hp, EP: ep, ACV: acv, DCV: dcv, SV: sv, DM: dm, SP: sp, SOP: sop, SCV: scv,
      movement: {
        walk: calculateFinalSpeed(1),
        jog: calculateFinalSpeed(1.5),
        run: calculateFinalSpeed(2),
        sprint: calculateFinalSpeed(4),
        swim: calculateFinalSpeed(0.5),
        crawl: calculateFinalSpeed(0.25),
        standingHighJump: finalBody * 0.125,
        standingLongJump: finalBody * 0.25,
        runningLongJump: finalBody * 1,
      }
    };
  };

  const derivedValues = calculateDerivedValues();

  // Update character's CP when it changes
  useEffect(() => {
    if (character.availableCP !== availableCP) {
      // This effect can be used to notify other components of CP changes if needed.
      console.log('CP updated:', { availableCP, totalCP: character.totalCP });
    }
  }, [availableCP, character]);

  return (
    <div style={styles.statsStep} className="step2-stats">
      <h2 style={{
        fontFamily: "'Permanent Marker', cursive",
        color: 'var(--besm-pink)',
        textShadow: '1px 1px 0px #ffffff',
        letterSpacing: '1px',
        textTransform: 'uppercase' as const
      }}>
        Step 2: Core Stats
      </h2>

      <div style={styles.statsGrid}>
        {(['body', 'mind', 'soul'] as const).map((stat) => {
          const statDescriptions = {
            body: 'Physical strength, endurance, and toughness. Affects Health Points and Attack Combat Value.',
            mind: 'Intelligence, awareness, and mental discipline. Affects Attack Combat Value and skill checks.',
            soul: 'Willpower, charisma, and spiritual strength. Affects Energy Points and Defense Combat Value.',
          };
          const currentValue = character.stats[stat];
          const aug = stat === 'body' ? augmentedBonus.body : stat === 'mind' ? augmentedBonus.mind : augmentedBonus.soul;
          const effectiveValue = currentValue + aug;

          return (
            <div key={stat} style={styles.statControl}>
              <div style={styles.statHeader}>
                <h3 style={styles.statName}>{stat.charAt(0).toUpperCase() + stat.slice(1)}</h3>
              </div>

              <div style={styles.statDescription}>
                <p style={{ margin: 0 }}>{statDescriptions[stat]}</p>
              </div>

              <div style={{ ...styles.statSliderContainer }}>
                <button
                  style={{
                    ...styles.statButton,
                    ...(currentValue <= 0 ? styles.statButtonDisabled : {}),
                  }}
                  aria-label={`Decrease ${stat}`}
                  onClick={() => onStatChange(stat, currentValue - 1)}
                  disabled={currentValue <= 0}
                >
                  -
                </button>

                <div style={styles.statValue} aria-live="polite" aria-label={`${stat} value`}>
                  {effectiveValue}
                </div>

                <button
                  style={{ ...styles.statButton }}
                  aria-label={`Increase ${stat}`}
                  onClick={() => onStatChange(stat, currentValue + 1)}
                >
                  +
                </button>
              </div>

              <div style={styles.statCost}>
                Cost (base only): {calculateCost(currentValue)} CP
                {aug > 0 && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--besm-dark-text)' }}>
                    Base {currentValue} + Augmented {aug} = {effectiveValue}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div style={styles.derivedGrid}>
        <div style={styles.derivedValues}>
          <h3 style={styles.derivedHeader}>Derived Values</h3>
          <div style={styles.derivedValueBox}><span className="derived-label" style={styles.derivedLabel}>Health Points (HP)</span><span className="derived-value" style={styles.derivedValue}>{derivedValues.HP}</span></div>
          <div style={styles.derivedValueBox}><span className="derived-label" style={styles.derivedLabel}>Energy Points (EP)</span><span className="derived-value" style={styles.derivedValue}>{derivedValues.EP}</span></div>
          <div style={styles.derivedValueBox}><span className="derived-label" style={styles.derivedLabel}>Attack Combat Value (ACV)</span><span className="derived-value" style={styles.derivedValue}>{derivedValues.ACV}</span></div>
          <div style={styles.derivedValueBox}><span className="derived-label" style={styles.derivedLabel}>Defense Combat Value (DCV)</span><span className="derived-value" style={styles.derivedValue}>{derivedValues.DCV}</span></div>
          <div style={styles.derivedValueBox}><span className="derived-label" style={styles.derivedLabel}>Shock Value (SV)</span><span className="derived-value" style={styles.derivedValue}>{derivedValues.SV}</span></div>
          <div style={styles.derivedValueBox}><span className="derived-label" style={styles.derivedLabel}>Damage Multiplier (DM)</span><span className="derived-value" style={styles.derivedValue}>{derivedValues.DM}x</span></div>
          <div style={styles.derivedValueBox}><span className="derived-label" style={styles.derivedLabel}>Sanity Points (SaP)</span><span className="derived-value" style={styles.derivedValue}>{derivedValues.SP}</span></div>
          <div style={styles.derivedValueBox}><span className="derived-label" style={styles.derivedLabel}>Social Combat Value (SCV)</span><span className="derived-value" style={styles.derivedValue}>{derivedValues.SCV}</span></div>
          <div style={styles.derivedValueBox}><span className="derived-label" style={styles.derivedLabel}>Social Points (SoP)</span><span className="derived-value" style={styles.derivedValue}>{derivedValues.SOP}</span></div>
        </div>

        <div style={styles.derivedValues}>
          <h3 style={styles.derivedHeader}>Movement</h3>
          <div style={styles.derivedValueBox}><span className="derived-label" style={styles.derivedLabel}>Walk</span><span className="derived-value" style={styles.derivedValue}>{derivedValues.movement.walk.toFixed(1)} m/rd</span></div>
          <div style={styles.derivedValueBox}><span className="derived-label" style={styles.derivedLabel}>Jog</span><span className="derived-value" style={styles.derivedValue}>{derivedValues.movement.jog.toFixed(1)} m/rd</span></div>
          <div style={styles.derivedValueBox}><span className="derived-label" style={styles.derivedLabel}>Run</span><span className="derived-value" style={styles.derivedValue}>{derivedValues.movement.run.toFixed(1)} m/rd</span></div>
          <div style={styles.derivedValueBox}><span className="derived-label" style={styles.derivedLabel}>Sprint</span><span className="derived-value" style={styles.derivedValue}>{derivedValues.movement.sprint.toFixed(1)} m/rd</span></div>
          <div style={styles.derivedValueBox}><span className="derived-label" style={styles.derivedLabel}>Swim</span><span className="derived-value" style={styles.derivedValue}>{derivedValues.movement.swim.toFixed(1)} m/rd</span></div>
          <div style={styles.derivedValueBox}><span className="derived-label" style={styles.derivedLabel}>Crawl</span><span className="derived-value" style={styles.derivedValue}>{derivedValues.movement.crawl.toFixed(1)} m/rd</span></div>
          <div style={styles.derivedValueBox}><span className="derived-label" style={styles.derivedLabel}>Standing High Jump</span><span className="derived-value" style={styles.derivedValue}>{derivedValues.movement.standingHighJump.toFixed(2)} m</span></div>
          <div style={styles.derivedValueBox}><span className="derived-label" style={styles.derivedLabel}>Standing Long Jump</span><span className="derived-value" style={styles.derivedValue}>{derivedValues.movement.standingLongJump.toFixed(2)} m</span></div>
          <div style={styles.derivedValueBox}><span className="derived-label" style={styles.derivedLabel}>Running Long Jump</span><span className="derived-value" style={styles.derivedValue}>{derivedValues.movement.runningLongJump.toFixed(2)} m</span></div>
        </div>
      </div>
    </div>
  );
};

export default Step2Stats;
