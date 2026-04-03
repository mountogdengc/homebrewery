import { useState } from 'react'
import { TYPES } from '../data/defaults'
import { getLibrary, saveHandout, deleteHandout, duplicateHandout } from '../utils/library'

const typeLabel = (id) => TYPES.find(t => t.id === id)?.label || id

/** Pull a sensible default name from the handout's own fields. */
function deriveName(type, data) {
  switch (type) {
    case 'parchment-list': return data.title || ''
    case 'tavern-notice':  return data.headline || ''
    case 'letter':         return data.recipient ? `Letter — ${data.recipient.replace(/^Dear\s+/i, '')}` : ''
    case 'journal-entry':  return data.date ? `Journal — ${data.date}` : ''
    case 'official-writ':  return data.title || ''
    default: return ''
  }
}

export default function LibraryPanel({ currentType, currentData, onLoad, activeId, setActiveId }) {
  const [items, setItems] = useState(getLibrary)
  const [saveName, setSaveName] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

  const refresh = () => setItems(getLibrary())

  const defaultName = deriveName(currentType, currentData)

  const handleSave = () => {
    const name = saveName.trim() || defaultName || `Untitled ${typeLabel(currentType)}`
    const entry = saveHandout({ id: activeId, name, type: currentType, data: currentData })
    setActiveId(entry.id)
    setSaveName('')
    refresh()
  }

  const handleSaveAs = () => {
    const name = saveName.trim() || defaultName || `Untitled ${typeLabel(currentType)}`
    const entry = saveHandout({ name, type: currentType, data: currentData })
    setActiveId(entry.id)
    setSaveName('')
    refresh()
  }

  const handleLoad = (item) => {
    onLoad(item.type, item.data)
    setActiveId(item.id)
  }

  const handleDuplicate = (id) => {
    duplicateHandout(id)
    refresh()
  }

  const handleDelete = (id) => {
    deleteHandout(id)
    if (activeId === id) setActiveId(null)
    setConfirmDelete(null)
    refresh()
  }

  const fmtDate = (ts) => {
    const d = new Date(ts)
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="library-panel">
      {/* Save bar */}
      <div className="library-save-bar">
        <input
          className="form-input library-name-input"
          placeholder={defaultName || 'Handout name…'}
          value={saveName}
          onChange={e => setSaveName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
        />
        <div className="library-save-buttons">
          <button className="library-btn library-btn-save" onClick={handleSave}>
            {activeId ? 'Save' : 'Save New'}
          </button>
          {activeId && (
            <button className="library-btn library-btn-saveas" onClick={handleSaveAs}>
              Save As Copy
            </button>
          )}
        </div>
      </div>

      {/* Saved items */}
      <div className="library-list">
        {items.length === 0 && (
          <div className="library-empty">No saved handouts yet.</div>
        )}
        {items.map(item => (
          <div
            key={item.id}
            className={`library-item ${activeId === item.id ? 'library-item-active' : ''}`}
          >
            <div className="library-item-main" onClick={() => handleLoad(item)}>
              <div className="library-item-name">{item.name}</div>
              <div className="library-item-meta">
                <span className="library-item-type">{typeLabel(item.type)}</span>
                <span className="library-item-date">{fmtDate(item.savedAt)}</span>
              </div>
            </div>
            <div className="library-item-actions">
              <button className="library-action-btn" title="Duplicate" onClick={() => handleDuplicate(item.id)}>⧉</button>
              {confirmDelete === item.id ? (
                <>
                  <button className="library-action-btn library-action-confirm" onClick={() => handleDelete(item.id)}>Yes</button>
                  <button className="library-action-btn" onClick={() => setConfirmDelete(null)}>No</button>
                </>
              ) : (
                <button className="library-action-btn" title="Delete" onClick={() => setConfirmDelete(item.id)}>✕</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
