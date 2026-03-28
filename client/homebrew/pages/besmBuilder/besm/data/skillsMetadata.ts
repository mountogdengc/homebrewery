// Skills metadata: descriptions, default relevant stats, and common specializations (scaffold)

export type RelevantStat = 'Body' | 'Mind' | 'Soul' | 'Varies';

export interface SkillMetadata {
  name: string;
  description: string;
  defaultStat: RelevantStat;
  specializations?: string[]; // common examples; freeform allowed in UI
}

export const skillsMetadata: Record<string, SkillMetadata> = {
  Acrobatics: {
    name: 'Acrobatics',
    description:
      'Gymnastic movement, balance, aerial awareness, tumbling, parkour. Covers vaults, rolls, flips, and precise footwork.',
    defaultStat: 'Body',
    specializations: ['Parkour', 'Tumbling', 'Balance Beam', 'Aerial Silks'],
  },
  'Animal Training': {
    name: 'Animal Training',
    description: 'Conditioning and handling of animals, issuing commands, trust and care routines.',
    defaultStat: 'Soul',
    specializations: ['Canines', 'Equines', 'Birds of Prey', 'Exotics'],
  },
  'Area Knowledge': {
    name: 'Area Knowledge',
    description: 'Familiarity with the geography, culture, and key figures of a specific locale.',
    defaultStat: 'Mind',
    specializations: ['Local City', 'Region', 'Planet', 'Neighborhood'],
  },
  Artisan: {
    name: 'Artisan',
    description: 'Crafting physical goods with skill and precision using tools and materials.',
    defaultStat: 'Mind',
    specializations: ['Carpentry', 'Smithing', 'Leatherwork', 'Tailoring'],
  },
  'Biological Sciences': {
    name: 'Biological Sciences',
    description: 'Life sciences including anatomy, physiology, ecology, and related disciplines.',
    defaultStat: 'Mind',
    specializations: ['Botany', 'Genetics', 'Zoology', 'Microbiology'],
  },
  Burglary: {
    name: 'Burglary',
    description: 'Breaking and entering, bypassing locks and alarms, stealthy intrusion.',
    defaultStat: 'Body',
    specializations: ['Lockpicking', 'Safecracking', 'Security Systems'],
  },
  Business: {
    name: 'Business',
    description: 'Commerce, negotiation, accounting, and organizational operations.',
    defaultStat: 'Mind',
    specializations: ['Accounting', 'Management', 'Logistics', 'Finance'],
  },
};

export function getSkillMetadata(name: string): SkillMetadata | undefined {
  return skillsMetadata[name];
}
