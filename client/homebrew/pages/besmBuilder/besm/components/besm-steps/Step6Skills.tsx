import React, { useMemo, useState } from 'react';
import { BesmCharacter, CharacterSkill } from '../../types/besm-character';
import { getSkillRankCost, isSkillAvailable } from '../../data/skillsCostsByGenre';
import { getSkillMetadata } from '../../data/skillsMetadata';
import { useToast } from '../../contexts/ToastContext';

interface Step6SkillsProps {
  character: BesmCharacter;
  onCharacterChange: (updates: Partial<BesmCharacter>) => void;
}

// Canonical skills (superset covering Modern Day sheet + existing app)
const commonSkills = [
  'Acrobatics', 'Acting', 'Animal Training', 'Architecture', 'Area Knowledge',
  'Art', 'Athletics', 'Artisan', 'Biological Sciences', 'Boating', 'Burglary',
  'Business', 'Civilization', 'Climbing', 'Computers', 'Controlled Breathing',
  'Cultural Arts', 'Demolitions', 'Disguise', 'Domestic Arts', 'Driving',
  'Engineering', 'Environmental Sciences', 'Electronics', 'Empathy', 'Etiquette',
  'Forgery', 'Gaming', 'Interrogation', 'Intimidation', 'Languages', 'Law',
  'Leadership', 'Listening', 'Mechanics', 'Medical', 'Military Sciences',
  'Naturopathy', 'Navigation', 'Occult', 'Occupation', 'Performing Arts',
  'Persuasion', 'Physical Sciences', 'Piloting', 'Poisons', 'Police Sciences',
  'Powerlifting', 'Religion', 'Riding', 'Search', 'Seduction', 'Sleight of Hand',
  'Social Sciences', 'Sports', 'Stealth', 'Street Sense', 'Survival', 'Swimming',
  'Unique Skill', 'Urban Tracking', 'Visual Arts', 'Wilderness Tracking', 'Writing',
  'Weapons'
];

export const Step6Skills: React.FC<Step6SkillsProps> = ({
  character,
  onCharacterChange
}) => {
  const { addToast } = useToast();
  const [newSkill, setNewSkill] = useState<Partial<CharacterSkill>>({
    name: '',
    level: 1,
    cpCost: 1,
  });
  const [customSkill, setCustomSkill] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const selectedGenre = character.selectedGenre ?? 'Multi-Genre';
  const selectedSubgenre = character.selectedSubgenre ?? null;

  // Determine Skills attribute level to compute SP pool (10 SP per level)
  const skillsAttributeLevel = useMemo(() => {
    const skillsAttr = character.attributes.find(a => a.template?.key === 'skills');
    return skillsAttr?.level ?? 0;
  }, [character.attributes]);

  const totalSPPool = useMemo(() => skillsAttributeLevel * 10, [skillsAttributeLevel]);

  const calcTotalCostForLevel = (skillName: string, level: number) => {
    const capped = Math.max(1, Math.min(6, Math.floor(level || 1)));
    let sum = 0;
    for (let r = 1; r <= capped; r++) {
      sum += getSkillRankCost(selectedGenre, skillName, r, selectedSubgenre);
    }
    return sum;
  };

  const handleAddSkill = () => {
    if (!newSkill.name) return;

    const name = newSkill.name as string;
    // Availability guard
    if (!isSkillAvailable(selectedGenre, selectedSubgenre, name)) {
      addToast(`${name} is not available for the selected genre/subgenre.`, 'error');
      return;
    }
    const level = Math.max(1, Math.min(6, Math.floor(newSkill.level || 1)));
    const cost = calcTotalCostForLevel(name, level);

    // Validate SP budget
    const prospectiveTotal = character.skills.reduce((t, s) => t + (s.cpCost || 0), 0) + cost;
    if (prospectiveTotal > totalSPPool) {
      addToast('Not enough Skill Points to add this skill at the chosen level.', 'error');
      return;
    }

    const meta = getSkillMetadata(name);
    const skill: CharacterSkill = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name,
      description: meta?.description || '',
      level,
      cpCost: cost, // using cpCost field to store SP cost for now
      attribute: 'Skills',
      notes: '',
      source: 'base',
      specialization: newSkill.specialization || '',
      relevantStat: newSkill.relevantStat || meta?.defaultStat || undefined,
      customInputs: {},
    };

    const updatedSkills = [...character.skills, skill];
    onCharacterChange({ skills: updatedSkills });

    // Reset form
    setNewSkill({ name: '', level: 1, cpCost: 1 });
    setCustomSkill('');
    addToast(`Added ${name} at level ${level} (-${cost} SP)`, 'success');
  };

  const handleRemoveSkill = (index: number) => {
    const removed = character.skills[index];
    const refund = removed?.cpCost || 0;
    const updatedSkills = character.skills.filter((_, i) => i !== index);
    onCharacterChange({ skills: updatedSkills });
    addToast(`Removed ${removed?.name || 'skill'} (+${refund} SP refunded)`, 'info');
  };

  const handleSkillLevelChange = (index: number, newLevel: number) => {
    const updatedSkills = [...character.skills];
    const skill = updatedSkills[index];
    const newLvl = Math.max(1, Math.min(6, Math.floor(newLevel)));
    const newCost = calcTotalCostForLevel(skill.name, newLvl);
    const currentTotal = character.skills.reduce((t, s, i) => t + (i === index ? 0 : (s.cpCost || 0)), 0);

    // Budget check for increases
    if (newLvl > skill.level && currentTotal + newCost > totalSPPool) {
      addToast('Not enough Skill Points to increase this skill.', 'error');
      return;
    }

    updatedSkills[index] = {
      ...skill,
      level: newLvl,
      cpCost: newCost,
    } as CharacterSkill;
    onCharacterChange({ skills: updatedSkills });

    const delta = newCost - (skill.cpCost || 0);
    if (delta > 0) {
      addToast(`Increased ${skill.name} to ${newLvl} (-${delta} SP)`, 'success');
    } else if (delta < 0) {
      addToast(`Decreased ${skill.name} to ${newLvl} (+${Math.abs(delta)} SP refunded)`, 'info');
    }
  };

  const handleSkillSelect = (skillName: string) => {
    if (!isSkillAvailable(selectedGenre, selectedSubgenre, skillName)) {
      addToast(`${skillName} is not available for the selected genre/subgenre.`, 'error');
      return;
    }
    const meta = getSkillMetadata(skillName);
    const initialCost = getSkillRankCost(selectedGenre, skillName, 1, selectedSubgenre);
    setNewSkill({
      name: skillName,
      level: 1,
      cpCost: initialCost,
      relevantStat: meta?.defaultStat,
    });
    setCustomSkill('');
  };

  const handleCustomSkillChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomSkill(e.target.value);
    setNewSkill({
      name: e.target.value,
      level: 1,
      cpCost: 1
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Removed numeric level input handler; level adjustments are done in the Selected Skills table

  // Filter skills based on search term and availability
  const filteredSkills = commonSkills.filter(skill => 
    skill.toLowerCase().includes(searchTerm.toLowerCase()) &&
    isSkillAvailable(selectedGenre, selectedSubgenre, skill)
  );

  // Calculate total SP spent on skills
  const totalSkillSP = character.skills.reduce((total, skill) => total + (skill.cpCost || 0), 0);

  return (
    <div className="skills-step">
      <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: "'Comic Sans MS', 'Comic Sans', cursive" }}>Character Skills</h2>
      
      <div className="skills-info">
        <p>
          Skills represent your character's training and expertise in various areas.
          Costs per rank vary by genre. You have 10 Skill Points (SP) per level of the Skills attribute.
        </p>
        {skillsAttributeLevel === 0 && (
          <div style={{ marginTop: 8, padding: 8, background: '#fff3cd', border: '1px solid #ffeeba', borderRadius: 6, color: '#856404' }}>
            Skills attribute level is 0. Increase the Skills level in Attributes to gain SP to spend.
          </div>
        )}
        <p className="cp-summary">
          Genre: <strong>{selectedGenre}</strong>
          {selectedSubgenre && (
            <>
              {' '}· Subgenre: <strong>{selectedSubgenre}</strong>
            </>
          )}
          {' '}· Skills Attribute Level: <strong>{skillsAttributeLevel}</strong> ·
          SP Pool: <strong>{totalSPPool}</strong> · SP Spent: <strong>{totalSkillSP}</strong> · SP Remaining: <strong>{Math.max(0, totalSPPool - totalSkillSP)}</strong>
        </p>
      </div>
      
      <div className="add-skill-section">
        <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "'Comic Sans MS', 'Comic Sans', cursive" }}>Add a Skill</h3>
        
        <div className="skill-search">
          <input
            type="text"
            placeholder="Search skills..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input sheet-input"
          />
        </div>
        
        <div className="skill-selection">
          <div className="skill-list">
            {filteredSkills.map((skill, index) => (
              <div 
                key={index}
                className={`skill-item ${newSkill.name === skill ? 'selected' : ''}`}
                onClick={() => handleSkillSelect(skill)}
              >
                {skill}
              </div>
            ))}
          </div>
          
          <div className="custom-skill">
            <label className="field-label">Or enter a custom skill</label>
            <input
              type="text"
              value={customSkill}
              onChange={handleCustomSkillChange}
              placeholder="Enter custom skill name"
              className="custom-skill-input sheet-input"
            />
          </div>
        </div>
        
        {/* Removed old numeric level input; levels are adjusted in the Selected Skills table */}

        {/* Relevant Stat and Specialization */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem' }}>Relevant Stat</label>
            <select
              value={newSkill.relevantStat || getSkillMetadata((newSkill.name as string) || '')?.defaultStat || ''}
              onChange={(e) => setNewSkill({ ...newSkill, relevantStat: e.target.value })}
              className="level-input sheet-select"
              style={{ width: 140 }}
            >
              <option value="">(default)</option>
              <option value="Body">Body</option>
              <option value="Mind">Mind</option>
              <option value="Soul">Soul</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.9rem' }}>Specialization (optional)</label>
            <input
              type="text"
              value={newSkill.specialization || ''}
              onChange={(e) => setNewSkill({ ...newSkill, specialization: e.target.value })}
              className="custom-skill-input sheet-input"
              placeholder="e.g., Negotiation, Parkour, Network Security"
            />
          </div>
        </div>
        
        <button 
          className="add-skill-button"
          onClick={handleAddSkill}
          disabled={!newSkill.name || totalSkillSP + (newSkill.cpCost || 0) > totalSPPool || totalSPPool === 0}
        >
          Add Skill
        </button>
      </div>
      
      <div className="selected-skills">
        <h3 className="text-xl font-bold mb-2">Selected Skills</h3>
        
        {character.skills.length === 0 ? (
          <div className="no-skills">
            <p>No skills selected yet. Choose skills from the list above.</p>
          </div>
        ) : (
          <div className="skills-table">
            <div className="skills-header">
              <div className="skill-name-header">Skill</div>
              <div className="skill-level-header">Level</div>
              <div className="skill-cost-header">SP Cost</div>
              <div className="skill-actions-header">Actions</div>
            </div>
            
            {character.skills.map((skill, index) => (
              <div key={index} className="skill-row">
                <div className="skill-name">
                  {skill.name}
                  {skill.specialization && <span className="specialization">({skill.specialization})</span>}
                </div>
                
                <div className="skill-level">
                  <button 
                    className="level-button decrease"
                    onClick={() => handleSkillLevelChange(index, Math.max(1, skill.level - 1))}
                    disabled={skill.level <= 1}
                  >
                    -
                  </button>
                  <span className="level-value">{skill.level}</span>
                  <button 
                    className="level-button increase"
                    onClick={() => handleSkillLevelChange(index, skill.level + 1)}
                    disabled={totalSkillSP >= totalSPPool}
                  >
                    +
                  </button>
                </div>
                
                <div className="skill-cost">{skill.cpCost} SP</div>
                
                <div className="skill-actions">
                  <button 
                    className="remove-skill-button"
                    onClick={() => handleRemoveSkill(index)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="skills-guide">
        <h3 className="text-xl font-bold mb-2">Skills Guide</h3>
        <div className="guide-content">
          <p>In BESM 4th Edition, skills represent your character's training and expertise:</p>
          <ul>
            <li><strong>Level 1:</strong> Basic knowledge or training</li>
            <li><strong>Level 2-3:</strong> Professional level competence</li>
            <li><strong>Level 4-5:</strong> Expert level mastery</li>
            <li><strong>Level 6+:</strong> World-class expertise</li>
          </ul>
          <p>Each skill level costs 1 Character Point. Skills can be specialized for greater effectiveness in a specific area.</p>
        </div>
      </div>
      
      <style>{`
        .skills-step {
          max-width: 900px;
          margin: 0 auto;
        }
        
        .skills-info {
          background-color: #f8f9fa;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
        }
        
        .cp-summary {
          margin-top: 12px;
          padding: 8px;
          background-color: #e9f7fe;
          border-radius: 4px;
          font-size: 0.9rem;
        }
        
        .add-skill-section {
          background-color: #fff;
          border-radius: 12px;
          padding: 16px;
          border: 1px solid #eceff3;
          box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04);
          margin-bottom: 24px;
        }
        
        .search-input {
          width: 100%;
          padding: 12px 14px;
          border: 1px solid #e0e3e7;
          border-radius: 12px;
          font-size: 1rem;
          margin-bottom: 16px;
          outline: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .search-input:focus {
          border-color: var(--besm-blue, #0d6efd);
          box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.15);
        }
        
        .skill-selection {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
          align-items: start;
        }
        
        .skill-list {
          height: 220px;
          overflow-y: auto;
          border: 1px solid #e0e3e7;
          border-radius: 12px;
          padding: 8px;
          background: #fff;
        }
        
        .skill-item {
          padding: 8px 10px;
          cursor: pointer;
          border-radius: 8px;
          transition: background-color 0.15s ease, border-color 0.15s ease;
        }
        
        .skill-item:hover {
          background-color: #f4f8ff;
        }
        
        .skill-item.selected {
          background-color: #e9f7fe;
          border: 1px solid var(--besm-blue, #0d6efd);
        }
        
        .custom-skill {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .custom-skill-input {
          padding: 12px 14px;
          border: 1px solid #e0e3e7;
          border-radius: 12px;
          font-size: 1rem;
          outline: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .custom-skill-input:focus {
          border-color: var(--besm-blue, #0d6efd);
          box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.15);
        }
        
        .skill-level-selector {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }
        
        .level-input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #e0e3e7;
          border-radius: 12px;
          text-align: left;
          outline: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .level-input:focus {
          border-color: var(--besm-blue, #0d6efd);
          box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.15);
        }
        
        .skill-cost {
          font-weight: bold;
        }
        
        .add-skill-button {
          width: 100%;
          padding: 12px;
          background-color: var(--besm-blue, #0d6efd);
          color: white;
          border: none;
          border-radius: 999px;
          font-weight: 800;
          cursor: pointer;
          transition: background-color 0.15s ease, transform 0.05s ease;
          box-shadow: 0 1px 2px rgba(16, 24, 40, 0.06);
        }
        
        .add-skill-button:hover:not(:disabled) { filter: brightness(0.95); }
        .add-skill-button:active:not(:disabled) { transform: translateY(1px); }
        
        .add-skill-button:disabled {
          background-color: #9aa3af;
          cursor: not-allowed;
          color: #eef2f7;
        }

        .field-label {
          font-size: 0.85rem;
          color: #6b7280;
          font-weight: 600;
          text-transform: none;
          letter-spacing: 0.2px;
        }
        
        .selected-skills {
          background-color: #fff;
          border-radius: 8px;
          padding: 16px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          margin-bottom: 24px;
        }
        
        .no-skills {
          padding: 16px;
          text-align: center;
          color: #6c757d;
        }
        
        .skills-table {
          width: 100%;
        }
        
        .skills-header {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 8px;
          padding: 8px 0;
          border-bottom: 2px solid #dee2e6;
          font-weight: bold;
          font-family: 'Comic Sans MS', 'Comic Sans', cursive;
        }
        .skill-level-header { text-align: center; }
        
        .skill-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 8px;
          padding: 12px 0;
          border-bottom: 1px solid #e9ecef;
          align-items: center;
        }
        
        .skill-name {
          font-weight: bold;
          font-family: 'Comic Sans MS', 'Comic Sans', cursive;
        }
        
        .specialization {
          font-weight: normal;
          font-style: italic;
          margin-left: 4px;
          font-size: 0.9rem;
          color: #6c757d;
        }
        
        .skill-level {
          display: flex;
          align-items: center;
          gap: 8px;
          justify-content: center;
        }
        
        .level-button {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2px solid black;
          background-color: var(--besm-pink);
          color: white;
          font-weight: bold;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
        }
        .level-button:hover:not(:disabled) {
          filter: brightness(0.95);
        }
        .level-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .level-value {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: var(--besm-blue, #0d6efd);
          color: white;
          border: 2px solid black;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          margin: 0 6px;
          font-family: 'Comic Sans MS', 'Comic Sans', cursive;
        }
        
        .skill-cost {
          color: #6c757d;
        }
        
        .remove-skill-button {
          padding: 4px 8px;
          background-color: #dc3545;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.85rem;
        }
        
        .remove-skill-button:hover {
          background-color: #c82333;
        }
        
        .skills-guide {
          background-color: #f8f9fa;
          border-radius: 8px;
          padding: 16px;
        }
        
        .guide-content {
          background-color: #fff;
          border-radius: 4px;
          padding: 12px;
          font-size: 0.9rem;
        }
        
        .guide-content ul {
          padding-left: 20px;
          margin: 8px 0;
        }
        
        /* Sheet-style inputs to echo the official character sheet (peach fill, soft borders) */
        .sheet-input, .sheet-select {
          background-color: #f9d9c6; /* peach fill */
          border-color: #d9a48f;     /* warm border */
        }
        .sheet-input:focus, .sheet-select:focus {
          border-color: #ef4c87;               /* sheet pink */
          box-shadow: 0 0 0 3px rgba(239, 76, 135, 0.18);
        }
        
        @media (max-width: 768px) {
          .skill-selection {
            grid-template-columns: 1fr;
          }
          
          .skills-header, .skill-row {
            grid-template-columns: 2fr 1fr 1fr;
          }
          
          .skill-actions-header {
            display: none;
          }
          
          .skill-actions {
            grid-column: 1 / -1;
            margin-top: 8px;
          }
        }
      `}</style>
    </div>
  );
};
