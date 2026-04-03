export default function TavernNoticeForm({ data, onChange }) {
  const set = (key, val) => onChange({ ...data, [key]: val })
  return (
    <div>
      <div className="form-section">
        <div className="form-section-title">Content</div>
        <div className="form-field">
          <label className="form-label">Headline</label>
          <input className="form-input" value={data.headline} onChange={e => set('headline', e.target.value)} />
        </div>
        <div className="form-field">
          <label className="form-label">Subheadline</label>
          <input className="form-input" value={data.subheadline} onChange={e => set('subheadline', e.target.value)} />
        </div>
        <div className="form-field">
          <label className="form-label">Body <span className="form-hint">**bold** *italic* - bullets</span></label>
          <textarea className="form-textarea" value={data.body} onChange={e => set('body', e.target.value)} />
        </div>
        <div className="form-field">
          <label className="form-label">Reward (optional)</label>
          <input className="form-input" placeholder="e.g. 50 GOLD PIECES"
            value={data.reward} onChange={e => set('reward', e.target.value)} />
        </div>
      </div>
      <div className="form-section">
        <div className="form-section-title">Footer</div>
        <div className="form-field">
          <label className="form-label">Issuer</label>
          <input className="form-input" value={data.issuer} onChange={e => set('issuer', e.target.value)} />
        </div>
        <div className="form-field">
          <label className="form-label">Date</label>
          <input className="form-input" value={data.date} onChange={e => set('date', e.target.value)} />
        </div>
      </div>
    </div>
  )
}
