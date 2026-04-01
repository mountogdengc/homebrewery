import React from 'react';

const ICON_TEMPLATES = {
	dragon_slaying: { name: 'Dragon Slaying', description: 'Face the ultimate wyrm threat' },
	treasure_hunt: { name: 'Treasure Hunt', description: 'Seek wealth and riches' },
	monster_hunting: { name: 'Monster Hunting', description: 'Eliminate the beast' },
	dungeon_delving: { name: 'Dungeon Delving', description: 'Explore deadly dungeons' },
	planar_travel: { name: 'Planar Travel', description: 'Breach other realms' },
	heist_stealth: { name: 'Heist & Stealth', description: 'Infiltrate and escape' },
	mystery_investigation: { name: 'Mystery Investigation', description: 'Solve the puzzle' },
	dark_quest: { name: 'Dark Quest', description: 'Embrace the darkness' },
	magic_arcana: { name: 'Magic & Arcana', description: 'Harness arcane forces' },
	undead_necromancy: { name: 'Undead & Necromancy', description: 'Confront the risen dead' }
};

const IconForm = (props)=>{
	const { icon, onFieldChange, onCustomizationChange, onRegenerate } = props;

	if (!icon) return null;

	return (
		<div className='icon-form'>
			<section className='form-section'>
				<h3>Identity</h3>
				<div className='form-group'>
					<label>Name</label>
					<input
						type='text'
						value={icon.name || ''}
						onChange={(e)=>onFieldChange('name', e.target.value)}
						placeholder='Icon name'
					/>
				</div>

				<div className='form-group'>
					<label>Description</label>
					<textarea
						value={icon.description || ''}
						onChange={(e)=>onFieldChange('description', e.target.value)}
						placeholder='What this icon represents'
						rows={2}
					/>
				</div>

				<div className='form-group'>
					<label>Tags</label>
					<input
						type='text'
						value={icon.tags?.join(', ') || ''}
						onChange={(e)=>onFieldChange('tags', e.target.value.split(',').map(t => t.trim()))}
						placeholder='Separate with commas'
					/>
				</div>
			</section>

			<section className='form-section'>
				<h3>Theme</h3>
				<div className='template-grid'>
					{Object.entries(ICON_TEMPLATES).map(([key, template])=>(
						<div
							key={key}
							className={`template-option ${icon.templateName === key ? 'selected' : ''}`}
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
							value={icon.customizations?.color || '#4B0082'}
							onChange={(e)=>onCustomizationChange('color', e.target.value)}
						/>
						<span className='color-value'>
							{icon.customizations?.color || '#4B0082'}
						</span>
					</div>
				</div>

				<div className='form-group'>
					<label>Accent Color</label>
					<div className='color-input-group'>
						<input
							type='color'
							value={icon.customizations?.accentColor || '#DAA520'}
							onChange={(e)=>onCustomizationChange('accentColor', e.target.value)}
						/>
						<span className='color-value'>
							{icon.customizations?.accentColor || '#DAA520'}
						</span>
					</div>
				</div>

				<div className='form-group'>
					<label>
						Glow Effect
						<span className='slider-value'>
							{Math.round((icon.customizations?.effectIntensity ?? 0.5) * 100)}%
						</span>
					</label>
					<input
						type='range'
						min='0'
						max='1'
						step='0.05'
						value={icon.customizations?.effectIntensity ?? 0.5}
						onChange={(e)=>onCustomizationChange('effectIntensity', parseFloat(e.target.value))}
						className='slider'
					/>
				</div>

				<div className='form-group'>
					<label>Seed (for reproducibility)</label>
					<div className='seed-group'>
						<input
							type='text'
							value={icon.seed || ''}
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
			</section>
		</div>
	);
};

export default IconForm;
