import { useState, useCallback } from 'react'
import { generateMap, renderMapSVG } from './mapEngine.js'
import './App.css'

export default function App() {
  const [seed, setSeed] = useState(Math.floor(Math.random() * 100000))
  const [width, setWidth] = useState(800)
  const [height, setHeight] = useState(600)
  const [boulderCount, setBoulderCount] = useState(12)
  const [outcroppingCount, setOutcroppingCount] = useState(4)
  const [scatterCount, setScatterCount] = useState(20)
  const [boulderMinSize, setBoulderMinSize] = useState(15)
  const [boulderMaxSize, setBoulderMaxSize] = useState(35)
  const [edgeMargin, setEdgeMargin] = useState(80)
  const [showGrid, setShowGrid] = useState(false)
  const [gridSize, setGridSize] = useState(40)
  const [svgOutput, setSvgOutput] = useState('')
  const [previewHtml, setPreviewHtml] = useState('')

  const handleGenerate = useCallback(() => {
    const mapData = generateMap({
      width, height, seed,
      gridSize: showGrid ? gridSize : 0,
      boulderCount, outcroppingCount, scatterCount,
      boulderMinSize, boulderMaxSize, edgeMargin
    })
    const svg = renderMapSVG(mapData)
    setSvgOutput(svg)
    setPreviewHtml(svg)
  }, [width, height, seed, showGrid, gridSize, boulderCount, outcroppingCount, scatterCount, boulderMinSize, boulderMaxSize, edgeMargin])

  const handleExportSVG = () => {
    if (!svgOutput) return
    const blob = new Blob([svgOutput], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `map-${seed}.svg`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCopySVG = () => {
    if (!svgOutput) return
    navigator.clipboard.writeText(svgOutput)
  }

  const randomSeed = () => setSeed(Math.floor(Math.random() * 100000))

  return (
    <div className="app">
      <header className="app-header">
        <h1>Map Generator</h1>
        <div className="header-actions">
          <button className="action-btn generate" onClick={handleGenerate}>
            <i className="fas fa-dice" /> Generate
          </button>
          <button className="action-btn" onClick={handleExportSVG} disabled={!svgOutput}>
            <i className="fas fa-download" /> Export SVG
          </button>
          <button className="action-btn" onClick={handleCopySVG} disabled={!svgOutput}>
            <i className="fas fa-copy" /> Copy SVG
          </button>
        </div>
      </header>

      <main className="app-main">
        <aside className="form-panel">
          <div className="form-section">
            <div className="form-section-title">Seed</div>
            <div className="seed-row">
              <input className="form-input" type="number" value={seed}
                onChange={(e) => setSeed(Number(e.target.value))} />
              <button className="seed-btn" onClick={randomSeed} title="Random seed">
                <i className="fas fa-dice" />
              </button>
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-title">Dimensions</div>
            <div className="form-field">
              <label className="form-label">Width: {width}px</label>
              <input type="range" min="400" max="1200" step="50" value={width}
                onChange={(e) => setWidth(Number(e.target.value))} />
            </div>
            <div className="form-field">
              <label className="form-label">Height: {height}px</label>
              <input type="range" min="300" max="900" step="50" value={height}
                onChange={(e) => setHeight(Number(e.target.value))} />
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-title">Rocks</div>
            <div className="form-field">
              <label className="form-label">Boulders: {boulderCount}</label>
              <input type="range" min="0" max="30" value={boulderCount}
                onChange={(e) => setBoulderCount(Number(e.target.value))} />
            </div>
            <div className="form-field">
              <label className="form-label">Outcroppings: {outcroppingCount}</label>
              <input type="range" min="0" max="10" value={outcroppingCount}
                onChange={(e) => setOutcroppingCount(Number(e.target.value))} />
            </div>
            <div className="form-field">
              <label className="form-label">Scattered Stones: {scatterCount}</label>
              <input type="range" min="0" max="50" value={scatterCount}
                onChange={(e) => setScatterCount(Number(e.target.value))} />
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-title">Size</div>
            <div className="form-field">
              <label className="form-label">Min Boulder Size: {boulderMinSize}</label>
              <input type="range" min="8" max="30" value={boulderMinSize}
                onChange={(e) => setBoulderMinSize(Number(e.target.value))} />
            </div>
            <div className="form-field">
              <label className="form-label">Max Boulder Size: {boulderMaxSize}</label>
              <input type="range" min="20" max="60" value={boulderMaxSize}
                onChange={(e) => setBoulderMaxSize(Number(e.target.value))} />
            </div>
            <div className="form-field">
              <label className="form-label">Edge Margin: {edgeMargin}</label>
              <input type="range" min="30" max="150" value={edgeMargin}
                onChange={(e) => setEdgeMargin(Number(e.target.value))} />
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-title">Grid</div>
            <label className="form-checkbox-label">
              <input type="checkbox" checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)} />
              Show Grid (5ft squares)
            </label>
            {showGrid && <div className="form-field" style={{ marginTop: 8 }}>
              <label className="form-label">Grid Size: {gridSize}px</label>
              <input type="range" min="20" max="80" value={gridSize}
                onChange={(e) => setGridSize(Number(e.target.value))} />
            </div>}
          </div>
        </aside>

        <section className="preview-panel">
          {previewHtml
            ? <div className="map-canvas" dangerouslySetInnerHTML={{ __html: previewHtml }} />
            : <div className="empty-state">Click "Generate" to create a map</div>
          }
        </section>
      </main>
    </div>
  )
}
