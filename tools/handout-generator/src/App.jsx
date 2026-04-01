import { useState } from 'react'
import { TYPES, defaultData } from './data/defaults'
import FormPanel    from './components/FormPanel'
import PreviewPanel from './components/PreviewPanel'
import './App.css'

export default function App() {
  const [type, setType] = useState('parchment-list')
  const [data, setData] = useState(defaultData['parchment-list'])

  const handleTypeChange = (newType) => {
    setType(newType)
    setData(defaultData[newType])
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
      </header>

      <main className="app-main">
        <aside className="form-panel">
          <FormPanel type={type} data={data} onChange={setData} />
        </aside>
        <section className="preview-panel">
          <div className="preview-label">Preview</div>
          <PreviewPanel type={type} data={data} />
        </section>
      </main>
    </div>
  )
}
