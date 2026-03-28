import { useCallback } from 'react';
import { BesmCharacter, CharacterAttribute, CharacterDefect } from '../types/besm-character';
import { AttributeTemplate, ATTRIBUTES_LIBRARY } from '../data/attributesLibrary';
import { DefectTemplate, DEFECTS_LIBRARY } from '../data/defectsLibrary';
import { RaceTemplate, RaceTemplateAttribute, RaceTemplateDefect } from '../data/raceTemplatesLibrary';
import { ClassTemplate, ClassTemplateAttribute, ClassTemplateDefect } from '../data/classTemplatesLibrary';
import { SizeTemplate, SizeTemplateAttribute, SizeTemplateDefect } from '../data/sizeTemplatesLibrary';

type TemplateType = 'race' | 'class' | 'size';

type TemplateAttribute = RaceTemplateAttribute | ClassTemplateAttribute | SizeTemplateAttribute;
type TemplateDefect = RaceTemplateDefect | ClassTemplateDefect | SizeTemplateDefect;

export const useTemplateManager = (
  character: BesmCharacter,
  updateCharacter: (updates: Partial<BesmCharacter>) => void
) => {
  // Helpers to safely extract a key identifier from union types
  const getAttrKey = (a: TemplateAttribute): string => {
    if ('key' in a && a.key) return a.key as string;
    if ('custom_name' in a && a.custom_name) return a.custom_name as string;
    return '';
  };
  const getDefectKey = (d: TemplateDefect): string => {
    if ('key' in d && d.key) return d.key as string;
    if ('custom_name' in d && d.custom_name) return d.custom_name as string;
    return '';
  };
  // Apply a template to the character
  const applyTemplate = useCallback((template: RaceTemplate | ClassTemplate | SizeTemplate) => {
    if (!template) return false;

    let cpSpent = 0;
    const newAttributes: CharacterAttribute[] = [];
    const newDefects: CharacterDefect[] = [];

    // Add attributes from template
    template.attributes.forEach((attr: TemplateAttribute) => {
      const level = 'level' in attr ? (attr.level || 1) : 1;
      const baseLevel = ('baseLevel' in attr && typeof attr.baseLevel === 'number') ? attr.baseLevel : level;
      const customName = 'custom_name' in attr ? (attr.custom_name || '') : '';
      const keyVal = 'key' in attr ? (attr.key || '') : '';
      const description = 'user_description' in attr ? (attr.user_description || '') : '';

      // Look up cost from library; fall back to stored points
      const rawKey = keyVal.trim().toLowerCase();
      const nameLower = customName.trim().toLowerCase();
      let libAttr = rawKey ? ATTRIBUTES_LIBRARY.find(a => (a.key || '').toLowerCase() === rawKey) : undefined;
      if (!libAttr && nameLower) libAttr = ATTRIBUTES_LIBRARY.find(a => (a.name || '').toLowerCase() === nameLower);
      const perLevel = libAttr?.cost_per_level ?? libAttr?.baseCost ?? null;
      const storedPoints = 'points' in attr ? (attr.points || 0) : 0;
      const points = (perLevel != null && baseLevel > 0) ? perLevel * baseLevel : storedPoints;

      cpSpent += points;

      // Build a lightweight AttributeTemplate for compatibility
      const templateObj = {
        id: keyVal || customName.toLowerCase().replace(/\s+/g, '-'),
        name: customName || keyVal || 'Unnamed Attribute',
        key: keyVal || customName,
        category: 'special',
        description: description,
        source: 'Template',
        baseCost: 0,
        hasLevels: true,
        levels: {},
      } as unknown as AttributeTemplate;

      const newAttr: CharacterAttribute = {
        id: `attr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        template: templateObj,
        level,
        cpCost: points,
        notes: '',
        source: 'template',
        isCustom: false,
        customInputs: {},
        enhancements: [],
        defects: [],
        limiters: [],
        selectedOptions: [],
      };
      newAttributes.push(newAttr);
    });

    // Add defects from template
    template.defects.forEach((defect: TemplateDefect) => {
      const rank = 'rank' in defect ? (defect.rank || 1) : 1;
      const customName = 'custom_name' in defect ? (defect.custom_name || '') : '';
      const keyVal = 'key' in defect ? (defect.key || '') : '';
      const description = 'user_description' in defect ? (defect.user_description || '') : '';

      // Look up refund from library; fall back to stored cp_refund
      const rawKey = keyVal.trim().toLowerCase();
      const nameLower = customName.trim().toLowerCase();
      let libDefect = rawKey ? DEFECTS_LIBRARY.find(d => (d.key || '').toLowerCase() === rawKey) : undefined;
      if (!libDefect && nameLower) libDefect = DEFECTS_LIBRARY.find(d => (d.name || '').toLowerCase() === nameLower);
      const storedRefund = 'cp_refund' in defect ? (defect.cp_refund || 0) : 0;
      // When library lookup succeeds: cp_refund is per-rank, multiply by rank.
      // When library lookup fails: stored cp_refund is already the total, use as-is.
      const perRank = libDefect?.cp_refund ?? null;
      const cpRefund = perRank != null ? perRank * rank : storedRefund;

      cpSpent -= cpRefund;

      const defectTpl = {
        id: keyVal || customName.toLowerCase().replace(/\s+/g, '-'),
        name: customName || keyVal || 'Unnamed Defect',
        key: keyVal || customName,
        description,
        cp_refund: cpRefund,
        rank_type: 'Lesser',
        max_rank: 3,
        ranks: [],
        category: 'general',
        source: 'Template',
      } as DefectTemplate;

      const newDef: CharacterDefect = {
        id: `defect-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        template: defectTpl,
        rank,
        cpRefund,
        notes: '',
        source: 'template',
        customInputs: {},
      };
      newDefects.push(newDef);
    });

    // Update character with template data
    const update: Partial<BesmCharacter> = {
      attributes: [...character.attributes, ...newAttributes],
      defects: [...character.defects, ...newDefects],
      availableCP: character.availableCP - cpSpent,
      totalPointsSpent: character.totalPointsSpent + cpSpent
    };

    // Set template-specific properties
    if (template.template === 'race') {
      update.race = template as RaceTemplate;
    } else if (template.template === 'class') {
      update.class = template as ClassTemplate;
    } else if (template.template === 'size') {
      const sizeTemplate = template as SizeTemplate;
      update.size = sizeTemplate;
      update.sizeModifiers = sizeTemplate.modifiers;
    }

    updateCharacter(update);
    return true;
  }, [character.attributes, character.defects, character.availableCP, character.totalPointsSpent, updateCharacter]);

  // Remove a template from the character
  const removeTemplate = useCallback((templateType: TemplateType) => {
    // Get the current template
    const currentTemplate = 
      templateType === 'race' ? character.race :
      templateType === 'class' ? character.class :
      character.size;

    if (!currentTemplate) return false;

    // Calculate CP to refund
    let cpRefund = 0;
    
    // Sum up attribute costs and defect refunds using library lookups
    currentTemplate.attributes.forEach(attr => {
      const rawKey = (('key' in attr ? attr.key : '') || '').toString().trim().toLowerCase();
      const nameLower = (('custom_name' in attr ? attr.custom_name : '') || '').toString().trim().toLowerCase();
      let libAttr = rawKey ? ATTRIBUTES_LIBRARY.find(a => (a.key || '').toLowerCase() === rawKey) : undefined;
      if (!libAttr && nameLower) libAttr = ATTRIBUTES_LIBRARY.find(a => (a.name || '').toLowerCase() === nameLower);
      const level = ('level' in attr ? attr.level : 1) || 1;
      const baseLevel = ('baseLevel' in attr && typeof attr.baseLevel === 'number') ? attr.baseLevel : level;
      const perLevel = libAttr?.cost_per_level ?? libAttr?.baseCost ?? null;
      const storedPoints = 'points' in attr ? (attr.points || 0) : 0;
      const cost = (perLevel != null && baseLevel > 0) ? perLevel * baseLevel : storedPoints;
      cpRefund -= cost;
    });

    currentTemplate.defects.forEach(defect => {
      const rawKey = (('key' in defect ? defect.key : '') || '').toString().trim().toLowerCase();
      const nameLower = (('custom_name' in defect ? defect.custom_name : '') || '').toString().trim().toLowerCase();
      let libDefect = rawKey ? DEFECTS_LIBRARY.find(d => (d.key || '').toLowerCase() === rawKey) : undefined;
      if (!libDefect && nameLower) libDefect = DEFECTS_LIBRARY.find(d => (d.name || '').toLowerCase() === nameLower);
      const rank = ('rank' in defect ? defect.rank : 1) || 1;
      const storedRefund = 'cp_refund' in defect ? (defect.cp_refund || 0) : 0;
      // When library lookup succeeds: cp_refund is per-rank, multiply by rank.
      // When library lookup fails: stored cp_refund is already the total, use as-is.
      const perRank = libDefect?.cp_refund ?? null;
      cpRefund += perRank != null ? perRank * rank : storedRefund;
    });

    // Remove attributes and defects from this template
    const templateAttributeKeys = new Set(currentTemplate.attributes.map(a => getAttrKey(a)));
    
    const templateDefectKeys = new Set(currentTemplate.defects.map(d => getDefectKey(d)));
    
    const remainingAttributes = character.attributes.filter(
      attr => !templateAttributeKeys.has(attr.template.key || attr.template.name)
    );
    
    const remainingDefects = character.defects.filter(
      defect => !templateDefectKeys.has(defect.template.key || defect.template.name)
    );

    // Update character
    const update: Partial<BesmCharacter> = {
      attributes: remainingAttributes,
      defects: remainingDefects,
      availableCP: character.availableCP + cpRefund,
      totalPointsSpent: character.totalPointsSpent - cpRefund
    };

    // Clear the appropriate template reference
    if (templateType === 'race') {
      update.race = undefined;
    } else if (templateType === 'class') {
      update.class = undefined;
    } else if (templateType === 'size') {
      update.size = undefined;
      update.sizeModifiers = undefined;
    }

    updateCharacter(update);
    return true;
  }, [character, updateCharacter]);

  // Check if a template is applied
  const isTemplateApplied = useCallback((template: RaceTemplate | ClassTemplate | SizeTemplate): boolean => {
    if (!template) return false;
    
    const templateName = 'name' in template ? template.name : '';
    
    if (template.template === 'race') {
      return character.race && 'name' in character.race 
        ? character.race.name === templateName
        : false;
    } else if (template.template === 'class') {
      return character.class && 'name' in character.class
        ? character.class.name === templateName
        : false;
    } else if (template.template === 'size') {
      return character.size && 'name' in character.size
        ? character.size.name === templateName
        : false;
    }
    
    return false;
  }, [character.race, character.class, character.size]);

  return {
    applyTemplate,
    removeTemplate,
    isTemplateApplied
  };
};
