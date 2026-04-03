export default function JournalEntryForm({ data, onChange }) {
  const set = (key, val) => onChange({ ...data, [key]: val })
  return (
    <div>
      <div className="form-section">
        <div className="form-section-title">Entry</div>
        <div className="form-field">
          <label className="form-label">Date</label>
          <input className="form-input" value={data.date} onChange={e => set('date', e.target.value)} />
        </div>
        <div className="form-field">
          <label className="form-label">Location (optional)</label>
          <input className="form-input" value={data.location} onChange={e => set('location', e.target.value)} />
        </div>
        <div className="form-field">
          <label className="form-label">Text <span className="form-hint">**bold** *italic* - bullets ∙ blank line = new ¶</span></label>
          <textarea className="form-textarea" style={{ minHeight: '200px' }}
            value={data.body} onChange={e => set('body', e.target.value)} />
        </div>
        <div className="form-field">
          <label className="form-label">Signature / initials (optional)</label>
          <input className="form-input" value={data.author} onChange={e => set('author', e.target.value)} />
        </div>
      </div>
    </div>
  )
}
