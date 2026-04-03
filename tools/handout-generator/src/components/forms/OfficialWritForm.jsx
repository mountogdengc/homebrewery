export default function OfficialWritForm({ data, onChange }) {
  const set = (key, val) => onChange({ ...data, [key]: val })
  return (
    <div>
      <div className="form-section">
        <div className="form-section-title">Authority</div>
        <div className="form-field">
          <label className="form-label">Issuing Authority</label>
          <input className="form-input" value={data.authority} onChange={e => set('authority', e.target.value)} />
        </div>
        <div className="form-field">
          <label className="form-label">Document Title</label>
          <input className="form-input" value={data.title} onChange={e => set('title', e.target.value)} />
        </div>
        <div className="form-field">
          <label className="form-label">Recipient Line</label>
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
        <div className="form-field">
          <label className="form-label">Date</label>
          <input className="form-input" value={data.date} onChange={e => set('date', e.target.value)} />
        </div>
      </div>
      <div className="form-section">
        <div className="form-section-title">Seal & Signature</div>
        <div className="form-field">
          <label className="form-label">Seal Label</label>
          <input className="form-input" value={data.sealLabel} onChange={e => set('sealLabel', e.target.value)} />
        </div>
        <div className="form-field">
          <label className="form-label">Signatory Title</label>
          <input className="form-input" value={data.signatoryTitle} onChange={e => set('signatoryTitle', e.target.value)} />
        </div>
        <div className="form-field">
          <label className="form-label">Signatory Name</label>
          <input className="form-input" value={data.signatoryName} onChange={e => set('signatoryName', e.target.value)} />
        </div>
      </div>
    </div>
  )
}
