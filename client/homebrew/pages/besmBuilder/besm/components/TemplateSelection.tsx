import React, { useState, useEffect } from 'react';
import { computeTemplateCp } from '../utils/templateCpUtils';
import type { RaceTemplate } from '../data/raceTemplatesLibrary';
import { getAllRaceTemplates } from '../data/raceTemplatesLibrary';
import type { ClassTemplate } from '../data/classTemplatesLibrary';
import { getAllClassTemplates } from '../data/classTemplatesLibrary';
import type { SizeTemplate } from '../data/sizeTemplatesLibrary';
import { getAllSizeTemplates } from '../data/sizeTemplatesLibrary';

interface TemplateSelectionProps {
  onTemplateSelect: (template: RaceTemplate | ClassTemplate | SizeTemplate) => void;
  selectedTemplate?: RaceTemplate | ClassTemplate | SizeTemplate | null;
}

type TemplateType = 'race' | 'class' | 'size';

const TemplateSelection: React.FC<TemplateSelectionProps> = ({ onTemplateSelect, selectedTemplate }) => {
  const [templateType, setTemplateType] = useState<TemplateType>('race');
  const [templates, setTemplates] = useState<(RaceTemplate | ClassTemplate | SizeTemplate)[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Helper to normalize display name between Race/Class/Size template types
  const getTemplateName = (t: RaceTemplate | ClassTemplate | SizeTemplate): string =>
    ("race_name" in t ? t.race_name : (t as ClassTemplate | SizeTemplate).name) || '';

  // Load templates based on selected type
  useEffect(() => {
    switch (templateType) {
      case 'race':
        setTemplates(getAllRaceTemplates());
        break;
      case 'class':
        setTemplates(getAllClassTemplates());
        break;
      case 'size':
        setTemplates(getAllSizeTemplates());
        break;
      default:
        setTemplates([]);
    }
  }, [templateType]);

  // Filter templates based on search term
  const filteredTemplates = templates.filter(template => 
    getTemplateName(template).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTemplateSelect = (template: RaceTemplate | ClassTemplate | SizeTemplate) => {
    onTemplateSelect(template);
  };

  const renderTemplateCard = (template: RaceTemplate | ClassTemplate | SizeTemplate) => {
    const selectedName = selectedTemplate ? (('race_name' in selectedTemplate) ? selectedTemplate.race_name : (selectedTemplate as ClassTemplate | SizeTemplate).name) : undefined;
    const isSelected = !!selectedTemplate && selectedName === getTemplateName(template) && 
                      'template' in selectedTemplate && selectedTemplate.template === templateType;

    return (
      <div 
        key={`${templateType}-${getTemplateName(template)}`}
        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
          isSelected ? 'bg-blue-100 border-blue-500' : 'hover:bg-gray-50 border-gray-200'
        }`}
        onClick={() => handleTemplateSelect(template)}
      >
        <h3 className="font-medium text-lg">{getTemplateName(template)}</h3>
        
        {'typicalHeight' in template && template.typicalHeight && (
          <p className="text-sm text-gray-600">
            <span className="font-medium">Size:</span> {template.typicalHeight}
          </p>
        )}
        
        {(() => {
          const cp = computeTemplateCp(template);
          return cp != null ? (
            <p className="text-sm text-gray-600">
              <span className="font-medium">Points:</span> {cp}
            </p>
          ) : null;
        })()}
        
        {'attributes' in template && (template as { attributes: unknown[] }).attributes.length > 0 && (
          <div className="mt-2">
            <h4 className="text-sm font-medium text-gray-700">Attributes:</h4>
            <ul className="text-xs text-gray-600">
              {(template as { attributes: Array<{ custom_name?: string; name?: string; level?: number }> }).attributes
                .slice(0, 3)
                .map((attr: { custom_name?: string; name?: string; level?: number }, idx: number) => (
                <li key={idx} className="truncate">
                  {attr.custom_name || attr.name} (Lv. {attr.level})
                </li>
              ))}
              {(template as { attributes: Array<unknown> }).attributes.length > 3 && (
                <li className="text-blue-600">+{(template as { attributes: Array<unknown> }).attributes.length - 3} more</li>
              )}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label htmlFor="template-type" className="block text-sm font-medium text-gray-700 mb-1">
            Template Type
          </label>
          <select
            id="template-type"
            value={templateType}
            onChange={(e) => setTemplateType(e.target.value as TemplateType)}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="race">Race</option>
            <option value="class">Class</option>
            <option value="size">Size</option>
          </select>
        </div>
        
        <div className="flex-1">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Search {templateType.charAt(0).toUpperCase() + templateType.slice(1)} Templates
          </label>
          <input
            type="text"
            id="search"
            placeholder={`Search ${templateType} templates...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {filteredTemplates.length > 0 ? (
          filteredTemplates.map(renderTemplateCard)
        ) : (
          <div className="col-span-full text-center py-8 text-gray-500">
            No {templateType} templates found{searchTerm ? ` matching "${searchTerm}"` : ''}.
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateSelection;
