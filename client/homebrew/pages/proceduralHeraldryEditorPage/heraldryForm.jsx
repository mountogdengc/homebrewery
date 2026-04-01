import React from 'react';

const HERALDRY_TEMPLATES = {
	noble_house: {
		name: 'Noble House',
		description: 'Traditional quartered shield with heraldic lions'
	},
	royal_crest: {
		name: 'Royal Crest',
		description: 'Regal shield with crosses and crowned lions'
	},
	merchant_guild: {
		name: 'Merchant Guild',
		description: 'Commercial heraldry with trading symbols'
	},
	warrior_badge: {
		name: 'Warrior Badge',
		description: 'Martial shield with weapons and defenses'
	},
	mystical_order: {
		name: 'Mystical Order',
		description: 'Arcane heraldry with magical symbols'
	},
	dragon_slayer: {
		name: 'Dragon Slayer',
		description: "Legendary hero's sigil with dragon imagery"
	},
	forest_realm: {
		name: 'Forest Realm',
		description: 'Natural heraldry with woodland creatures'
	},
	sea_captain: {
		name: 'Sea Captain',
		description: 'Maritime heraldry with nautical elements'
	},
	holy_order: {
		name: 'Holy Order',
		description: 'Religious heraldry with sacred symbols'
	},
	shadow_guild: {
		name: 'Shadow Guild',
		description: 'Rogue organization with concealed symbolism'
	}
};

const HeraldryForm = ({ heraldry, onChange })=>{
	const handleChange = (field, value)=>{
		onChange({
			...heraldry,
			[field]: value
		});
	};

	const handleCustomizationChange = (field, value)=>{
		onChange({
			...heraldry,
			customizations: {
				...heraldry.customizations,
				[field]: value
			}
		});
	};

	return (
		<div className='heraldry-form'>
			<div className='form-section'>
				<h3>Details</h3>

				<div className='form-group'>
					<label>Name</label>
					<input
						type='text'
						value={heraldry.name || ''}
						onChange={(e)=>handleChange('name', e.target.value)}
						placeholder='e.g., House Stark Sigil'
					/>
				</div>

				<div className='form-group'>
					<label>Description</label>
					<textarea
						value={heraldry.description || ''}
						onChange={(e)=>handleChange('description', e.target.value)}
						placeholder='Describe the heraldry...'
						rows={3}
					/>
				</div>
			</div>

			<div className='form-section'>
				<h3>Shield Design</h3>

				<div className='form-group'>
					<label>Template</label>
					<div className='template-grid'>
						{Object.entries(HERALDRY_TEMPLATES).map(([key, template])=>(
							<div
								key={key}
								className={`template-option ${heraldry.templateName === key ? 'selected' : ''}`}
								onClick={()=>handleChange('templateName', key)}
							>
								<div className='template-name'>{template.name}</div>
								<div className='template-desc'>{template.description}</div>
							</div>
						))}
					</div>
				</div>
			</div>

			<div className='form-section'>
				<h3>Customization</h3>

				<div className='form-group'>
					<label>Primary Color</label>
					<div className='color-input-group'>
						<input
							type='color'
							value={heraldry.customizations?.primaryColor || '#FF0000'}
							onChange={(e)=>handleCustomizationChange('primaryColor', e.target.value)}
						/>
						<span className='color-value'>{heraldry.customizations?.primaryColor || '#FF0000'}</span>
					</div>
				</div>

				<div className='form-group'>
					<label>Accent Color</label>
					<div className='color-input-group'>
						<input
							type='color'
							value={heraldry.customizations?.accentColor || '#FFD700'}
							onChange={(e)=>handleCustomizationChange('accentColor', e.target.value)}
						/>
						<span className='color-value'>{heraldry.customizations?.accentColor || '#FFD700'}</span>
					</div>
				</div>

				<div className='form-group'>
					<label>
						Detail Level
						<span className='slider-value'>
							{Math.round((heraldry.customizations?.detail || 0.8) * 100)}%
						</span>
					</label>
					<input
						type='range'
						min='0'
						max='1'
						step='0.1'
						value={heraldry.customizations?.detail || 0.8}
						onChange={(e)=>handleCustomizationChange('detail', parseFloat(e.target.value))}
					/>
				</div>
			</div>
		</div>
	);
};

export default HeraldryForm;
