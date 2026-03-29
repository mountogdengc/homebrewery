import { useBesmCharacterBuilder } from '../hooks/useBesmCharacterBuilder';
import { useState, useEffect, useRef } from 'react';
import type { BesmCharacter, CharacterDefect, AlternateFormConfig, MinionsConfig, CharacterAttribute, AttributeEnhancement, AttributeLimiter } from '../types/besm-character';
import type { AttributeTemplate } from '../data/attributesLibrary';
import type { ClassTemplate } from '../data/classTemplatesLibrary';
import type { RaceTemplate } from '../data/raceTemplatesLibrary';
import type { SizeTemplate } from '../data/sizeTemplatesLibrary';
import { getAllSizeTemplates } from '../data/sizeTemplatesLibrary';
import { StepNavigation } from './StepNavigation';
import { Footer } from './Footer';
import { Modal } from './common/Modal';
import { Step1CharacterConcept } from './besm-steps/Step1CharacterConcept';
import { Step2Stats } from './besm-steps/Step2Stats';
import { Step3Templates } from './besm-steps/Step3Templates';
import { Step4Attributes } from './besm-steps/Step4Attributes';
import { Step5Defects } from './besm-steps/Step5Defects';
import { Step7FinalTouches } from './besm-steps/Step7FinalTouches';

interface CharacterBuilderProps {
  initialCharacter?: Partial<BesmCharacter>;
  onCharacterChange?: (character: BesmCharacter) => void;
}

export function CharacterBuilder({ initialCharacter, onCharacterChange }: CharacterBuilderProps = {}) {
  // Initialize the character builder
  // Define default character values that match ExtendedBesmCharacter
  const defaultCharacter: Partial<BesmCharacter> = {
    name: '',
    description: '',
    availableCP: 0,
    totalCP: 0,
    stats: { body: 0, mind: 0, soul: 0 },
    templates: {
      class: null,
      race: null,
      size: null,
    },
    characterClass: null,
    race: undefined,
    size: undefined,
    attributes: [],
    skills: [],
    defects: [],
    personality: '',
    appearance: '',
    background: '',
    notes: '',
    ...(initialCharacter || {}),
  };

  const {
    character,
    currentStep,
    nextStep,
    prevStep,
    goToStep,
    updateCharacter,
    updateStat,
    resetCharacter,
    addAttribute,
    updateAttribute,
    removeAttribute,
    addDefect,
    updateDefect,
    removeDefect,
    applyClassTemplate,
    applyRaceTemplate,
    applySizeTemplate,
    clearSizeTemplate,
    removeClassTemplate,
    removeAppliedTemplate,
    setCharacterPoints,
  } = useBesmCharacterBuilder(defaultCharacter);

  // Notify parent of character changes for save/load
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      // On initial load, push the character with recalculated derived values
      // so they get persisted on next save
      if (character && onCharacterChange) {
        onCharacterChange(character);
      }
      return;
    }
    onCharacterChange?.(character);
  }, [character]);

  // Advisory Power Level CP (from Step 1 selector), used for persistent indicators
  const [powerLevelCP, setPowerLevelCP] = useState<number>(0);

  // Pending size change from race/class template suggestion
  const [pendingSizeChange, setPendingSizeChange] = useState<{
    proposedSize: SizeTemplate;
    currentSizeName: string;
  } | null>(null);

  // Type guard to check if an object is a valid BesmCharacter update
  const isBesmCharacterUpdate = (updates: unknown): updates is Partial<BesmCharacter> => {
    // If stats are included, they must match the expected shape
    if (typeof updates === 'object' && updates !== null && 'stats' in updates) {
      const { stats } = updates as Partial<BesmCharacter>;
      if (!stats) return true;
      return (
        (stats.body === undefined || typeof stats.body === 'number') &&
        (stats.mind === undefined || typeof stats.mind === 'number') &&
        (stats.soul === undefined || typeof stats.soul === 'number')
      );
    }
    return true;
  };

  // Create a type-safe update function
  const safeUpdateCharacter = (updates: Partial<BesmCharacter>) => {
    if (!isBesmCharacterUpdate(updates)) {
      console.warn('Invalid character update:', updates);
      return;
    }
    
    // Create a new update object without the stats property
    const { stats, ...restUpdates } = updates;
    const extendedUpdates: Partial<BesmCharacter> = { ...restUpdates } as Partial<BesmCharacter>;
    
    // If stats are being updated, handle them separately
    if (stats) {
      const currentStats = character.stats;
      const updatedStats = {
        body: stats.body ?? currentStats.body,
        mind: stats.mind ?? currentStats.mind,
        soul: stats.soul ?? currentStats.soul,
      } as BesmCharacter['stats'];
      
      // Add the stats to the updates
      extendedUpdates.stats = updatedStats;
    }
    
    // Apply the updates
    updateCharacter(extendedUpdates);
  };

  const handleStatChange = (stat: 'body' | 'mind' | 'soul', value: number) => {
    // Use hook's updateStat so CP recalculates immediately
    updateStat(stat, value);
  };

  const handleClassTemplateChange = (template: ClassTemplate | null | undefined) => {
    if (template) {
      applyClassTemplate(template);
      // Prompt user if the class suggests a different size than what's currently set
      const sizeRank = template.baseSize.rank;
      const currentSizeRank = (character.size as { rank?: number } | undefined)?.rank ?? 0;
      if (currentSizeRank !== sizeRank) {
        const matchingSize = getAllSizeTemplates().find(s => s.rank === sizeRank);
        if (matchingSize) {
          setPendingSizeChange({
            proposedSize: matchingSize,
            currentSizeName: (character.size as { name?: string } | undefined)?.name ?? 'Medium',
          });
        }
      }
    } else {
      removeClassTemplate();
    }
  };

  const handleRaceTemplateChange = (template: RaceTemplate | null | undefined) => {
    if (template) {
      applyRaceTemplate(template);
      // Prompt user if the race suggests a different size than what's currently set
      const sizeRank = template.baseSize.size_rank;
      const currentSizeRank = (character.size as { rank?: number } | undefined)?.rank ?? 0;
      if (currentSizeRank !== sizeRank) {
        const matchingSize = getAllSizeTemplates().find(s => s.rank === sizeRank);
        if (matchingSize) {
          setPendingSizeChange({
            proposedSize: matchingSize,
            currentSizeName: (character.size as { name?: string } | undefined)?.name ?? 'Medium',
          });
        }
      }
    } else {
      // Clearing race template handled via clearTemplates if needed later
      updateCharacter({ templates: { ...character.templates, race: null }, race: undefined });
    }
  };

  const handleSizeTemplateChange = (template: SizeTemplate | null | undefined) => {
    if (template) {
      applySizeTemplate(template);
    } else {
      clearSizeTemplate();
    }
  };

  const handleAttributeAdd = (
    attribute: AttributeTemplate,
    level: number,
    customInputs?: Record<string, unknown>,
    enhancements?: AttributeEnhancement[],
    limiters?: AttributeLimiter[],
    selectedOptions?: string[],
    notes?: string
  ) => {
    addAttribute(attribute, level, customInputs, enhancements, limiters, selectedOptions, notes);
  };
  
  // Export character as JSON file
  const exportCharacter = () => {
    const dataStr = JSON.stringify(character, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${character.name || 'character'}_besm4e.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleAttributeUpdate = (
    id: string,
    updates: {
      level?: number;
      customInputs?: Record<string, unknown>;
      enhancements?: AttributeEnhancement[];
      limiters?: AttributeLimiter[];
      selectedOptions?: string[];
      notes?: string;
      alternateForm?: AlternateFormConfig;
      metamorphosis?: AlternateFormConfig;
      minions?: MinionsConfig;
    }
  ) => {
    updateAttribute(id, updates as Partial<CharacterAttribute>);
  };

  const handleAttributeRemove = (id: string) => {
    removeAttribute(id);
  };

  const handleDefectAdd = (defect: CharacterDefect) => {
    addDefect(defect.template, defect.rank, defect.customInputs, defect.id, defect.notes, defect.source);
  };

  const handleDefectUpdate = (defect: CharacterDefect) => {
    updateDefect(defect.id, { rank: defect.rank });
  };

  const handleDefectRemove = (id: string) => {
    removeDefect(id);
  };

  // Reset character with confirmation handled in Step7FinalTouches

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1CharacterConcept
            character={character}
            onCharacterChange={safeUpdateCharacter}
            onCharacterPointsChange={setCharacterPoints}
            onPowerLevelCPChange={setPowerLevelCP}
          />
        );
      case 2:
        return (
          <Step2Stats 
            character={character}
            onStatChange={handleStatChange} 
          />
        );
      case 3:
        return (
          <Step3Templates
            onClassTemplateChange={handleClassTemplateChange}
            onRaceTemplateChange={handleRaceTemplateChange}
            onSizeTemplateChange={handleSizeTemplateChange}
            appliedTemplates={character.appliedTemplates || []}
            onRemoveAppliedTemplate={removeAppliedTemplate}
          />
        );
      case 4:
        return (
          <Step4Attributes
            character={character}
            onAttributeAdd={handleAttributeAdd}
            onAttributeUpdate={handleAttributeUpdate}
            onAttributeRemove={handleAttributeRemove}
            onCharacterChange={safeUpdateCharacter}
          />
        );
      case 5:
        return (
          <Step5Defects
            character={character}
            onDefectAdd={handleDefectAdd}
            onDefectUpdate={handleDefectUpdate}
            onDefectRemove={handleDefectRemove}
          />
        );
      case 6:
        return (
          <Step7FinalTouches
            character={character}
            onCharacterChange={safeUpdateCharacter}
            onExport={exportCharacter}
            onReset={resetCharacter}
          />
        );
      default:
        return <div>Invalid step</div>;
    }
  };

  return (
      <div className="container">
      <header className="header">
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Comic Sans MS', 'Comic Sans', cursive" }}>BESM 4th Edition Character Builder</h1>
        <p className="subtitle">CHARACTER BUILDER</p>
      </header>

      <div className="comic-panel">
        <h2 className="panel-title" style={{ fontFamily: "'Comic Sans MS', 'Comic Sans', cursive" }}>CHARACTER CREATION</h2>
        <div className="speech-bubble">
          Welcome to the BESM 4th Edition Character Builder! Create your anime-inspired character by allocating Character Points to Stats, Attributes, and more.
        </div>
        <StepNavigation
          currentStep={currentStep}
          totalSteps={6}
          onNext={nextStep}
          onPrev={prevStep}
          onGoToStep={goToStep}
          onStepChange={goToStep}
          canProceed={true}
          character={character}
          powerLevelCP={powerLevelCP}
        />
      </div>

      <div className="step-content">
        {renderCurrentStep()}
      </div>

      <Footer />

      {pendingSizeChange && (
        <Modal
          isOpen={true}
          onClose={() => setPendingSizeChange(null)}
          closeOnBackdropClick={true}
          closeOnEscape={true}
        >
          <h2 id="modal-title" style={{ marginTop: 0, marginBottom: '12px' }}>Change Size?</h2>
          <p style={{ marginBottom: '20px' }}>
            This template suggests <strong>{pendingSizeChange.proposedSize.name}</strong> size.
            Your current size is <strong>{pendingSizeChange.currentSizeName}</strong>.
            Would you like to switch?
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setPendingSizeChange(null)}
              style={{ padding: '8px 16px', cursor: 'pointer' }}
            >
              Keep {pendingSizeChange.currentSizeName}
            </button>
            <button
              onClick={() => {
                applySizeTemplate(pendingSizeChange.proposedSize);
                setPendingSizeChange(null);
              }}
              style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: 'var(--besm-purple)', color: 'white', border: 'none', borderRadius: '4px' }}
            >
              Switch to {pendingSizeChange.proposedSize.name}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
