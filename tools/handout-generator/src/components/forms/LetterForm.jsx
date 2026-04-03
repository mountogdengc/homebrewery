export default function LetterForm({ data, onChange }) {
  const set = (key, val) => onChange({ ...data, [key]: val })
  return (
    <div>
      <div className="form-section">
        <div className="form-section-title">Header</div>
        <div className="form-field">
          <label className="form-label">Location</label>
          <input className="form-input" value={data.location} onChange={e => set('location', e.target.value)} />
        </div>
        <div className="form-field">
          <label className="form-label">Date</label>
          <input className="form-input" value={data.date} onChange={e => set('date', e.target.value)} />
        </div>
        <div className="form-field">
          <label className="form-label">Salutation</label>
          <input className="form-input" value={data.recipient} onChange={e => set('recipient', e.target.value)} />
        </div>
      </div>
      <div className="form-section">
        <div className="form-section-title">Body</div>
        <div className="form-field">
          <label className="form-label">Text <span className="form-hint">**bold** *italic* - bullets ∙ blank line = new ¶</span></label>
          <textarea className="form-textarea" style={{ minHeight: '160px' }}
            value={data.body} onChange={e => set('body', e.target.value)} />
        </div>
      </div>
      <div className="form-section">
        <div className="form-section-title">Closing</div>
        <div className="form-field">
          <label className="form-label">Closing phrase</label>
          <input className="form-input" value={data.closing} onChange={e => set('closing', e.target.value)} />
        </div>
        <div className="form-field">
          <label className="form-label">Signature</label>
          <input className="form-input" value={data.signature} onChange={e => set('signature', e.target.value)} />
        </div>
        <div className="form-field">
          <label className="form-label">P.S. (optional)</label>
          <textarea className="form-textarea" style={{ minHeight: '50px' }}
            value={data.postscript} onChange={e => set('postscript', e.target.value)} />
        </div>
      </div>
    </div>
  )
}
