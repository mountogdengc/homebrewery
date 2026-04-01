import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import './proceduralImageLibraryPage.less';

const ProceduralImageLibraryPage = (props)=>{
	const navigate = useNavigate();
	const [images, setImages] = useState([]);
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(0);
	const [search, setSearch] = useState('');
	const [type, setType] = useState('seal');
	const [total, setTotal] = useState(0);

	const pageSize = 24;

	const types = [
		{ value: 'seal', label: 'Wax Seals' },
		{ value: 'insignia', label: 'Insignias' },
		{ value: 'heraldry', label: 'Heraldry' },
		{ value: 'icon', label: 'Icons' }
	];

	const fetchImages = async (pageNum = 0, searchTerm = '', selectedType = 'seal')=>{
		setLoading(true);
		try {
			const params = new URLSearchParams({
				page: pageNum,
				count: pageSize,
				type: selectedType,
				...(searchTerm && { search: searchTerm })
			});

			const response = await fetch(`/api/procedural-images?${params}`);
			const data = await response.json();
			setImages(data.images);
			setTotal(data.total);
			setPage(pageNum);
		} catch (err) {
			console.error('Error fetching images:', err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(()=>{
		fetchImages(0, search, type);
	}, [type]);

	const handleSearch = (e)=>{
		const term = e.target.value;
		setSearch(term);
		setPage(0);
		fetchImages(0, term, type);
	};

	const handleTypeChange = (e)=>{
		setType(e.target.value);
		setPage(0);
	};

	const handleDelete = async (editId)=>{
		if (!window.confirm('Delete this image?')) return;

		try {
			const response = await fetch(`/api/procedural-image/${editId}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				fetchImages(page, search, type);
			} else {
				alert('Error deleting image');
			}
		} catch (err) {
			console.error('Error deleting image:', err);
			alert('Error deleting image');
		}
	};

	const handleDuplicate = async (editId)=>{
		try {
			const response = await fetch(`/api/procedural-image/${editId}/duplicate`, {
				method: 'POST'
			});

			if (response.ok) {
				const newImage = await response.json();
				navigate(`/seal/edit/${newImage.editId}`);
			} else {
				alert('Error duplicating image');
			}
		} catch (err) {
			console.error('Error duplicating image:', err);
			alert('Error duplicating image');
		}
	};

	const currentTypeLabel = types.find(t => t.value === type)?.label || 'Images';

	const totalPages = Math.ceil(total / pageSize);

	return (
		<div className='procedural-image-library-page'>
			<div className='library-header'>
				<h1>{currentTypeLabel} Library</h1>
				<button
					className='btn btn-primary'
					onClick={()=>navigate(`/seal/new`)}
				>
					+ New {currentTypeLabel.slice(0, -1)}
				</button>
			</div>

			<div className='library-controls'>
				<select
					value={type}
					onChange={handleTypeChange}
					className='type-filter'
				>
					{types.map(t => (
						<option key={t.value} value={t.value}>{t.label}</option>
					))}
				</select>

				<input
					type='text'
					placeholder='Search by name...'
					value={search}
					onChange={handleSearch}
					className='search-input'
				/>
			</div>

			{loading ? (
				<div className='loading'>Loading...</div>
			) : images.length === 0 ? (
				<div className='empty-state'>
					<p>No {currentTypeLabel.toLowerCase()} found.</p>
					<button
						className='btn btn-primary'
						onClick={()=>navigate(`/seal/new`)}
					>
						Create Your First {currentTypeLabel.slice(0, -1)}
					</button>
				</div>
			) : (
				<>
					<div className='images-grid'>
						{images.map(image => (
							<div key={image.editId} className='image-card'>
								<div className='image-preview'>
									<img
										src={`/api/procedural-image/${image.shareId}/render?size=256`}
										alt={image.name}
										onClick={()=>navigate(`/seal/edit/${image.editId}`)}
									/>
								</div>
								<div className='image-info'>
									<h3 className='image-name' onClick={()=>navigate(`/seal/edit/${image.editId}`)}>
										{image.name || `Untitled ${image.generatorType}`}
									</h3>
									<p className='image-template'>{image.templateName}</p>
									<div className='image-actions'>
										<button
											className='btn-small'
											onClick={()=>navigate(`/seal/edit/${image.editId}`)}
										>
											Edit
										</button>
										<button
											className='btn-small'
											onClick={()=>window.open(`/seal/share/${image.shareId}`, '_blank')}
										>
											Share
										</button>
										<button
											className='btn-small'
											onClick={()=>handleDuplicate(image.editId)}
										>
											Duplicate
										</button>
										<button
											className='btn-small btn-danger'
											onClick={()=>handleDelete(image.editId)}
										>
											Delete
										</button>
									</div>
								</div>
							</div>
						))}
					</div>

					{totalPages > 1 && (
						<div className='pagination'>
							<button
								disabled={page === 0}
								onClick={()=>fetchImages(page - 1, search, type)}
								className='btn-small'
							>
								← Previous
							</button>
							<span className='page-info'>
								Page {page + 1} of {totalPages} ({total} total)
							</span>
							<button
								disabled={page >= totalPages - 1}
								onClick={()=>fetchImages(page + 1, search, type)}
								className='btn-small'
							>
								Next →
							</button>
						</div>
					)}
				</>
			)}
		</div>
	);
};

export default ProceduralImageLibraryPage;
