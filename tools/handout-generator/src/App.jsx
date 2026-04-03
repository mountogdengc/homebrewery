import { useState } from 'react'
import { TYPES, defaultData } from './data/defaults'
import FormPanel    from './components/FormPanel'
import PreviewPanel from './components/PreviewPanel'
import LibraryPanel from './components/LibraryPanel'
import './App.css'

export default function App() {
  const [type, setType] = useState('parchment-list')
  const [data, setData] = useState(defaultData['parchment-list'])
  const [showLibrary, setShowLibrary] = useState(false)
  const [activeId, setActiveId] = useState(null)

  const handleTypeChange = (newType) => {
    setType(newType)
    setData(defaultData[newType])
    setActiveId(null)
  }

  const handleLibraryLoad = (loadType, loadData) => {
    setType(loadType)
    setData(loadData)
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Handout Generator</h1>
        <nav className="type-selector">
          {TYPES.map(t => (
            <button
              key={t.id}
              className={`type-btn ${type === t.id ? 'active' : ''}`}
              onClick={() => handleTypeChange(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <button
          className={`type-btn library-toggle ${showLibrary ? 'active' : ''}`}
          onClick={() => setShowLibrary(v => !v)}
        >
          Library
        </button>
      </header>

      <main className="app-main">
        <aside className="form-panel">
          <FormPanel type={type} data={data} onChange={setData} />
        </aside>
        <section className="preview-panel">
          <div className="preview-label">Preview</div>
          <PreviewPanel type={type} data={data} />
        </section>
        {showLibrary && (
          <aside className="library-sidebar">
            <LibraryPanel
              currentType={type}
              currentData={data}
              onLoad={handleLibraryLoad}
              activeId={activeId}
              setActiveId={setActiveId}
            />
          </aside>
        )}
      </main>
    </div>
  )
}
