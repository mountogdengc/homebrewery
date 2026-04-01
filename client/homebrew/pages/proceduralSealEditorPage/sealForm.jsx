import React, { useState } from 'react';

const SEAL_TEMPLATES = {
	simple_wax: { name: 'Simple Wax', description: 'Clean, minimalist seal' },
	celtic_wax: { name: 'Celtic Knot', description: 'Intricate Celtic patterns' },
	gothic_seal: { name: 'Gothic Seal', description: 'Dark gothic design' },
	heraldic_seal: { name: 'Heraldic', description: 'Classic heraldic design' },
	mystical_seal: { name: 'Mystical', description: 'Arcane symbols' },
	aged_parchment: { name: 'Aged Parchment', description: 'Weathered appearance' },
	royal_seal: { name: 'Royal Seal', description: 'Regal gold seal' },
	merchant_seal: { name: 'Merchant', description: 'Professional guild seal' },
	adventurer_seal: { name: 'Adventurer', description: 'Rugged seal for adventurers' }
};

const SealForm = (props)=>{
	const { seal, onFieldChange, onCustomizationChange, onRegenerate } = props;
	const [showAdvanced, setShowAdvanced] = useState(false);

	if (!seal) return null;

	return (
		<div className='seal-form'>
			<section className='form-section'>
				<h3>Identity</h3>
				<div className='form-group'>
					<label>Name</label>
					<input
						type='text'
						value={seal.name || ''}
						onChange={(e)=>onFieldChange('name', e.target.value)}
						placeholder='Seal name'
					/>
				</div>

				<div className='form-group'>
					<label>Description</label>
					<textarea
						value={seal.description || ''}
						onChange={(e)=>onFieldChange('description', e.target.value)}
						placeholder='Optional description'
						rows={2}
					/>
				</div>

				<div className='form-group'>
					<label>Tags</label>
					<input
						type='text'
						value={seal.tags?.join(', ') || ''}
						onChange={(e)=>onFieldChange('tags', e.target.value.split(',').map(t => t.trim()))}
						placeholder='Separate with commas'
					/>
				</div>
			</section>

			<section className='form-section'>
				<h3>Template</h3>
				<div className='template-grid'>
					{Object.entries(SEAL_TEMPLATES).map(([key, template])=>(
						<div
							key={key}
							className={`template-option ${seal.templateName === key ? 'selected' : ''}`}
							onClick={()=>onFieldChange('templateName', key)}
						>
							<div className='template-name'>{template.name}</div>
							<div className='template-desc'>{template.description}</div>
						</div>
					))}
				</div>
			</section>

			<section className='form-section'>
				<h3>Customization</h3>

				<div className='form-group'>
					<label>Primary Color</label>
					<div className='color-input-group'>
						<input
							type='color'
							value={seal.customizations?.color || '#C41E3A'}
							onChange={(e)=>onCustomizationChange('color', e.target.value)}
						/>
						<span className='color-value'>
							{seal.customizations?.color || '#C41E3A'}
						</span>
					</div>
				</div>

				<div className='form-group'>
					<label>Accent Color</label>
					<div className='color-input-group'>
						<input
							type='color'
							value={seal.customizations?.accentColor || '#8B0000'}
							onChange={(e)=>onCustomizationChange('accentColor', e.target.value)}
						/>
						<span className='color-value'>
							{seal.customizations?.accentColor || '#8B0000'}
						</span>
					</div>
				</div>

				<div className='form-group'>
					<label>
						Complexity
						<span className='slider-value'>
							{Math.round((seal.customizations?.complexity ?? 0.5) * 100)}%
						</span>
					</label>
					<input
						type='range'
						min='0'
						max='1'
						step='0.05'
						value={seal.customizations?.complexity ?? 0.5}
						onChange={(e)=>onCustomizationChange('complexity', parseFloat(e.target.value))}
						className='slider'
					/>
				</div>

				<div className='form-group'>
					<label>
						Effect Intensity
						<span className='slider-value'>
							{Math.round((seal.customizations?.effectIntensity ?? 0.5) * 100)}%
						</span>
					</label>
					<input
						type='range'
						min='0'
						max='1'
						step='0.05'
						value={seal.customizations?.effectIntensity ?? 0.5}
						onChange={(e)=>onCustomizationChange('effectIntensity', parseFloat(e.target.value))}
						className='slider'
					/>
				</div>

				<div className='form-group'>
					<label>
						Wax Drips
						<span className='slider-value'>
							{Math.round((seal.customizations?.waxDrips ?? 0.3) * 100)}%
						</span>
					</label>
					<input
						type='range'
						min='0'
						max='1'
						step='0.05'
						value={seal.customizations?.waxDrips ?? 0.3}
						onChange={(e)=>onCustomizationChange('waxDrips', parseFloat(e.target.value))}
						className='slider'
					/>
				</div>

				<div className='form-group'>
					<label>
						Cracks/Wear
						<span className='slider-value'>
							{Math.round((seal.customizations?.cracks ?? 0.1) * 100)}%
						</span>
					</label>
					<input
						type='range'
						min='0'
						max='1'
						step='0.05'
						value={seal.customizations?.cracks ?? 0.1}
						onChange={(e)=>onCustomizationChange('cracks', parseFloat(e.target.value))}
						className='slider'
					/>
				</div>

				<button
					className='btn-toggle-advanced'
					onClick={()=>setShowAdvanced(!showAdvanced)}
				>
					{showAdvanced ? '▼' : '▶'} Advanced Options
				</button>

				{showAdvanced && (
					<div className='advanced-options'>
						<div className='form-group'>
							<label>Seed (for reproducibility)</label>
							<div className='seed-group'>
								<input
									type='text'
									value={seal.seed || ''}
									onChange={(e)=>onFieldChange('seed', e.target.value)}
									className='seed-input'
									placeholder='Auto-generated if empty'
									readOnly
								/>
								<button
									className='btn-small'
									onClick={onRegenerate}
								>
									New Seed
								</button>
							</div>
						</div>
					</div>
				)}
			</section>
		</div>
	);
};

export default SealForm;
