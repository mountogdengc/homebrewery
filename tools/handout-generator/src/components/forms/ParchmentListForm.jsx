export default function ParchmentListForm({ data, onChange }) {
  const set = (key, val) => onChange({ ...data, [key]: val })
  const setHeader = (col, val) => onChange({ ...data, colHeaders: { ...data.colHeaders, [col]: val } })
  const setRow = (id, field, val) => onChange({
    ...data,
    rows: data.rows.map(r => r.id === id ? { ...r, [field]: val } : r),
  })
  const addRow = () => onChange({
    ...data,
    rows: [...data.rows, { id: Date.now(), checked: false, col1: '', col2: '', col3: '' }],
  })
  const removeRow = (id) => onChange({ ...data, rows: data.rows.filter(r => r.id !== id) })

  return (
    <div>
      <div className="form-section">
        <div className="form-section-title">Header</div>
        <div className="form-field">
          <label className="form-label">Title</label>
          <input className="form-input" value={data.title} onChange={e => set('title', e.target.value)} />
        </div>
        <div className="form-field">
          <label className="form-checkbox-label">
            <input type="checkbox" checked={data.showCheckbox} onChange={e => set('showCheckbox', e.target.checked)} />
            Show checkboxes
          </label>
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-title">Column Labels</div>
        {['col1', 'col2', 'col3'].map((col, i) => (
          <div className="form-field" key={col}>
            <label className="form-label">Column {i + 1}</label>
            <input className="form-input" value={data.colHeaders[col]}
              onChange={e => setHeader(col, e.target.value)} />
          </div>
        ))}
      </div>

      <div className="form-section">
        <div className="form-section-title">Rows</div>
        <div className="rows-list">
          {data.rows.map((row, i) => (
            <div className="row-item" key={row.id}>
              <div className="row-item-header">
                <span className="row-num">Row {i + 1}</span>
                {data.showCheckbox && (
                  <label className="row-checked-label">
                    <input type="checkbox" checked={row.checked}
                      onChange={e => setRow(row.id, 'checked', e.target.checked)} />
                    checked
                  </label>
                )}
                <button className="row-remove" onClick={() => removeRow(row.id)}>✕</button>
              </div>
              <div className="row-fields">
                <input className="form-input" placeholder={data.colHeaders.col1}
                  value={row.col1} onChange={e => setRow(row.id, 'col1', e.target.value)} />
                <input className="form-input" placeholder={data.colHeaders.col2}
                  value={row.col2} onChange={e => setRow(row.id, 'col2', e.target.value)} />
                <input className="form-input" placeholder={data.colHeaders.col3}
                  value={row.col3} onChange={e => setRow(row.id, 'col3', e.target.value)} />
              </div>
            </div>
          ))}
        </div>
        <button className="add-row-btn" onClick={addRow}>+ Add Row</button>
      </div>

      <div className="form-section">
        <div className="form-section-title">Notes</div>
        <div className="form-field">
          <label className="form-label">Footer Note</label>
          <textarea className="form-textarea" style={{ minHeight: '50px' }}
            value={data.footerNote} onChange={e => set('footerNote', e.target.value)} />
        </div>
        <div className="form-field">
          <label className="form-label">Marginal Note (different hand)</label>
          <textarea className="form-textarea" style={{ minHeight: '50px' }}
            value={data.marginalNote} onChange={e => set('marginalNote', e.target.value)} />
        </div>
      </div>
    </div>
  )
}
