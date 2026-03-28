import React from 'react';
import type { BesmCharacter } from '../types/besm-character';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface StepNavigationProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onGoToStep: (step: number) => void;
  onStepChange?: (step: number) => void; // Optional for backward compatibility
  canProceed?: boolean;
  character?: BesmCharacter; // for advisory indicators
  powerLevelCP?: number;     // selected power level CP (advisory)
}

const STEP_NAMES = [
  'Character Concept',
  'Stats', 
  'Templates',
  'Attributes',
  'Defects',
  'Final Touches'
];

export const StepNavigation: React.FC<StepNavigationProps> = ({
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  onGoToStep,
  onStepChange = onGoToStep, // Default to onGoToStep if not provided
  canProceed = true,
  character,
  powerLevelCP = 80,
}) => {
  // Benchmarks copied from Step 1 for consistency
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

  const currentBenchmark = (() => {
    const b = benchmarks.find(b => powerLevelCP >= b.minCP && powerLevelCP <= b.maxCP);
    return b || benchmarks[benchmarks.length - 1];
  })();

  const parseSingleOrRange = (value: string | number): { min: number; max: number } => {
    if (typeof value === 'number') {
      if (Number.isFinite(value)) return { min: value, max: value };
      return { min: 0, max: Number.POSITIVE_INFINITY };
    }
    const v = String(value).trim();
    if (v.includes('-')) {
      const [a, b] = v.split('-').map(s => s.trim());
      const min = parseInt(a, 10);
      const max = b.includes('+') ? Number.POSITIVE_INFINITY : parseInt(b, 10);
      return { min: isNaN(min) ? 0 : min, max: isNaN(max) ? Number.POSITIVE_INFINITY : max };
    }
    if (v.includes('+')) {
      const min = parseInt(v, 10);
      return { min: isNaN(min) ? 0 : min, max: Number.POSITIVE_INFINITY };
    }
    const n = parseInt(v, 10);
    if (isNaN(n)) return { min: 0, max: Number.POSITIVE_INFINITY };
    return { min: n, max: n };
  };

  const parseSlashRange = (value: string): { min: number; max: number } => {
    const [a, b] = value.split('/').map(s => s.trim());
    const min = parseInt(a, 10);
    const max = (b || '').includes('+') ? Number.POSITIVE_INFINITY : parseInt(b || '0', 10);
    return { min: isNaN(min) ? 0 : min, max: isNaN(max) ? Number.POSITIVE_INFINITY : max };
  };

  const clampStatus = (val: number, range: { min: number; max: number }): 'below' | 'within' | 'above' => {
    if (val < range.min) return 'below';
    if (val > range.max) return 'above';
    return 'within';
  };

  const totalCP = character?.totalCP ?? 0;
  const maxStatActual = Math.max(character?.stats?.body ?? 0, character?.stats?.mind ?? 0, character?.stats?.soul ?? 0);
  const maxAttrLevelActual = (character?.attributes || []).reduce((m, a) => Math.max(m, a.level || 0), 0);
  const acv = character?.derivedValues?.attackCombatValue ?? 0;
  const dcv = character?.derivedValues?.defenseCombatValue ?? 0;
  const hp = character?.derivedValues?.healthPoints ?? 0;
  const ep = character?.derivedValues?.energyPoints ?? 0;
  const dmg = character?.derivedValues?.damage ?? 0;

  const cpRange = { min: currentBenchmark.minCP, max: Number.isFinite(currentBenchmark.maxCP) ? currentBenchmark.maxCP : Number.POSITIVE_INFINITY };
  const statRange = parseSingleOrRange(currentBenchmark.maxStat);
  const attrLvlRange = parseSingleOrRange(currentBenchmark.attributeLevels);
  const cvRange = parseSlashRange(currentBenchmark.combatValues);
  const hpEpRange = parseSlashRange(currentBenchmark.hpEp);
  const dmgRange = parseSlashRange(currentBenchmark.damageMultiplier);

  return (
    <div className="step-navigation">
      <div className="step-progress">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Comic Sans MS', 'Comic Sans', cursive", color: 'black' }}>BESM 4th Edition Character Builder</h1>
          <div className="text-sm font-medium">
            Step {currentStep} of {totalSteps}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="progress-container">
          <div 
            className="progress-bar"
            style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
          />
        </div>

        {/* Advisory Indicators (persistent) */}
        {character && (
          <div className="advisory-indicators" style={{ marginTop: 8, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
            {(() => {
              const badge = (status: 'below'|'within'|'above') => {
                const bg = status === 'within' ? 'rgba(40,167,69,0.15)' : status === 'below' ? 'rgba(0,123,255,0.15)' : 'rgba(220,53,69,0.15)';
                const border = status === 'within' ? 'rgba(40,167,69,0.35)' : status === 'below' ? 'rgba(0,123,255,0.35)' : 'rgba(220,53,69,0.35)';
                const color = status === 'within' ? '#155724' : status === 'below' ? '#004085' : '#721c24';
                const label = status === 'within' ? 'Within' : status === 'below' ? 'Below' : 'Above';
                return <span style={{ padding: '2px 8px', borderRadius: 999, background: bg, color, border: `1px solid ${border}`, fontWeight: 700, fontSize: 11 }}>{label}</span>;
              };
              const row = (title: string, value: string | number, rangeText: string, status: 'below'|'within'|'above') => (
                <div key={title} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, background: 'white', border: '1px solid #eee', borderRadius: 6, padding: '4px 8px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 700, color: 'var(--besm-dark-text)', fontSize: 12 }}>{title}</span>
                    <span style={{ fontSize: 11, color: '#555' }}>You: {value} • Guide: {rangeText}</span>
                  </div>
                  {badge(status)}
                </div>
              );
              return (
                <>
                  {row('Total CP', totalCP, `${cpRange.min} - ${Number.isFinite(cpRange.max) ? cpRange.max : cpRange.min + '+'}`, clampStatus(totalCP, cpRange))}
                  {row('Max Stat', maxStatActual, `${statRange.min} - ${Number.isFinite(statRange.max) ? statRange.max : statRange.min + '+'}`, clampStatus(maxStatActual, statRange))}
                  {row('Max Attribute Level', maxAttrLevelActual, `${attrLvlRange.min} - ${Number.isFinite(attrLvlRange.max) ? attrLvlRange.max : attrLvlRange.min + '+'}`, clampStatus(maxAttrLevelActual, attrLvlRange))}
                  {row('Attack CV', acv, `${cvRange.min} - ${Number.isFinite(cvRange.max) ? cvRange.max : cvRange.min + '+'}`, clampStatus(acv, cvRange))}
                  {row('Defense CV', dcv, `${cvRange.min} - ${Number.isFinite(cvRange.max) ? cvRange.max : cvRange.min + '+'}`, clampStatus(dcv, cvRange))}
                  {row('HP', hp, `${hpEpRange.min} - ${Number.isFinite(hpEpRange.max) ? hpEpRange.max : hpEpRange.min + '+'}`, clampStatus(hp, hpEpRange))}
                  {row('EP', ep, `${hpEpRange.min} - ${Number.isFinite(hpEpRange.max) ? hpEpRange.max : hpEpRange.min + '+'}`, clampStatus(ep, hpEpRange))}
                  {row('Damage', dmg, `${dmgRange.min} - ${Number.isFinite(dmgRange.max) ? dmgRange.max : dmgRange.min + '+'}`, clampStatus(dmg, dmgRange))}
                </>
              );
            })()}
          </div>
        )}

        {/* Step Indicators */}
        <div className="step-indicators">
          {STEP_NAMES.map((name, index) => {
            const stepNumber = index + 1;
            const isActive = stepNumber === currentStep;
            const isCompleted = stepNumber < currentStep;
            
            return (
              <button
                key={stepNumber}
                onClick={() => onStepChange(stepNumber)}
                className={`step-pill ${isActive ? 'active' : isCompleted ? 'completed' : ''}`}
              >
                <div className="step-number">
                  {stepNumber}
                </div>
                <span className="step-label">{name}</span>
              </button>
            );
          })}
        </div>

        {/* Mobile Step Name */}
        <div className="md:hidden text-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900" style={{ fontFamily: "'Comic Sans MS', 'Comic Sans', cursive" }}>
            {STEP_NAMES[currentStep - 1]}
          </h2>
        </div>

        {/* Navigation Buttons */}
        <div className="nav-buttons">
          <button
            onClick={onPrev}
            disabled={currentStep === 1}
            className="nav-button prev-button"
          >
            <ChevronLeft className="icon" />
            <span>Previous</span>
          </button>

          <div className="step-title">
            {STEP_NAMES[currentStep - 1]}
          </div>

          <button
            onClick={onNext}
            disabled={currentStep === totalSteps || !canProceed}
            className="nav-button next-button"
          >
            <span>{currentStep === totalSteps ? 'Complete' : 'Next'}</span>
            <ChevronRight className="icon" />
          </button>
        </div>

        {/* CP Display — always visible since StepNavigation is sticky */}
        {character && (
          <div style={{ marginTop: '8px', padding: '6px 12px', backgroundColor: 'var(--besm-purple)', color: 'white', borderRadius: '8px', textAlign: 'center', fontSize: '1.1rem', fontWeight: 'bold' }}>
            CP: {character.totalPointsSpent} / {character.totalCP}
          </div>
        )}
      </div>
    </div>
  );
};