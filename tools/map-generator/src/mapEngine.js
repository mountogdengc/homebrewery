import { createNoise2D } from 'simplex-noise'

// Seeded random number generator (mulberry32)
function mulberry32(seed) {
  return function() {
    let t = seed += 0x6D2B79F5
    t = Math.imul(t ^ t >>> 15, t | 1)
    t ^= t + Math.imul(t ^ t >>> 7, t | 61)
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

function createSeededNoise(seed) {
  const rng = mulberry32(seed)
  return createNoise2D(rng)
}

// Generate a perturbed polygon shape for rocks/boulders
function generateRockShape(cx, cy, baseRadius, vertices, rng, noise2D, noiseScale) {
  const points = []
  for (let i = 0; i < vertices; i++) {
    const angle = (i / vertices) * Math.PI * 2
    const nVal = noise2D(
      cx * 0.01 + Math.cos(angle) * noiseScale,
      cy * 0.01 + Math.sin(angle) * noiseScale
    )
    const r = baseRadius * (0.6 + 0.4 * (nVal * 0.5 + 0.5))
    const jitter = baseRadius * 0.15 * (rng() - 0.5)
    points.push([
      cx + Math.cos(angle) * (r + jitter),
      cy + Math.sin(angle) * (r + jitter)
    ])
  }
  return points
}

function pointsToPath(points) {
  if (points.length === 0) return ''
  let d = `M ${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}`
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i][0].toFixed(1)} ${points[i][1].toFixed(1)}`
  }
  return d + ' Z'
}

function generateCracks(cx, cy, radius, rng, count) {
  const cracks = []
  for (let i = 0; i < count; i++) {
    const startAngle = rng() * Math.PI * 2
    const length = radius * (0.3 + rng() * 0.5)
    const sx = cx + Math.cos(startAngle) * radius * 0.1
    const sy = cy + Math.sin(startAngle) * radius * 0.1
    const ex = sx + Math.cos(startAngle) * length
    const ey = sy + Math.sin(startAngle) * length
    const mx = (sx + ex) / 2 + (rng() - 0.5) * radius * 0.2
    const my = (sy + ey) / 2 + (rng() - 0.5) * radius * 0.2
    cracks.push({ sx, sy, mx, my, ex, ey })
  }
  return cracks
}

function placeBoulders(width, height, config, rng) {
  const boulders = []
  const { edgeMargin, boulderMinSize, boulderMaxSize, boulderCount } = config

  for (let i = 0; i < boulderCount; i++) {
    let x, y
    const side = Math.floor(rng() * 4)
    const edgeDepth = edgeMargin * (0.3 + rng() * 0.7)

    switch (side) {
      case 0: x = edgeMargin + rng() * (width - 2 * edgeMargin); y = edgeDepth; break
      case 1: x = width - edgeDepth; y = edgeMargin + rng() * (height - 2 * edgeMargin); break
      case 2: x = edgeMargin + rng() * (width - 2 * edgeMargin); y = height - edgeDepth; break
      case 3: x = edgeDepth; y = edgeMargin + rng() * (height - 2 * edgeMargin); break
    }

    const radius = boulderMinSize + rng() * (boulderMaxSize - boulderMinSize)
    boulders.push({ x, y, radius })
  }
  return boulders
}

function placeScatteredStones(width, height, config, rng) {
  const stones = []
  for (let i = 0; i < config.scatterCount; i++) {
    const x = config.edgeMargin * 0.5 + rng() * (width - config.edgeMargin)
    const y = config.edgeMargin * 0.5 + rng() * (height - config.edgeMargin)
    const radius = 2 + rng() * 5
    stones.push({ x, y, radius })
  }
  return stones
}

function placeOutcroppings(width, height, config, rng) {
  const outcroppings = []
  const { edgeMargin, boulderMinSize, boulderMaxSize, outcroppingCount } = config

  for (let i = 0; i < outcroppingCount; i++) {
    const side = Math.floor(rng() * 4)
    let cx, cy
    const edgeDepth = edgeMargin * (0.4 + rng() * 0.8)

    switch (side) {
      case 0: cx = edgeMargin + rng() * (width - 2 * edgeMargin); cy = edgeDepth; break
      case 1: cx = width - edgeDepth; cy = edgeMargin + rng() * (height - 2 * edgeMargin); break
      case 2: cx = edgeMargin + rng() * (width - 2 * edgeMargin); cy = height - edgeDepth; break
      case 3: cx = edgeDepth; cy = edgeMargin + rng() * (height - 2 * edgeMargin); break
    }

    const clusterSize = 3 + Math.floor(rng() * 4)
    const rocks = []
    for (let j = 0; j < clusterSize; j++) {
      const offsetX = (rng() - 0.5) * boulderMaxSize * 2.5
      const offsetY = (rng() - 0.5) * boulderMaxSize * 2.5
      const radius = boulderMinSize * 0.8 + rng() * boulderMaxSize * 0.8
      rocks.push({ x: cx + offsetX, y: cy + offsetY, radius })
    }
    outcroppings.push(rocks)
  }
  return outcroppings
}

const PALETTE = {
  groundBase:    '#c4a96a',
  groundDark:    '#a8905a',
  groundLight:   '#d4bc7e',
  rockBase:      '#7a7a7a',
  rockDark:      '#555555',
  rockLight:     '#999999',
  rockHighlight: '#b0b0b0',
  crackColor:    '#444444',
  shadowColor:   'rgba(0,0,0,0.25)',
  dirtDark:      '#9a7e4a',
  grassPatch:    '#8a9a5a',
}

export function generateMap(config) {
  const {
    width = 800,
    height = 600,
    seed = 42,
    gridSize = 0,
    boulderCount = 12,
    outcroppingCount = 4,
    scatterCount = 20,
    boulderMinSize = 15,
    boulderMaxSize = 35,
    edgeMargin = 80,
  } = config

  const rng = mulberry32(seed)
  const noise2D = createSeededNoise(seed)

  const mapConfig = {
    boulderCount, outcroppingCount, scatterCount,
    boulderMinSize, boulderMaxSize, edgeMargin
  }

  // Terrain color blobs — smooth organic shapes instead of a pixel grid
  const terrainBlobs = []
  const blobCount = 30 + Math.floor(rng() * 20)
  for (let i = 0; i < blobCount; i++) {
    const cx = rng() * width
    const cy = rng() * height
    const n = noise2D(cx * 0.006, cy * 0.006)
    const rx = 40 + rng() * 120
    const ry = 30 + rng() * 100
    const rotation = rng() * 360
    let fill
    if (n < -0.2) fill = 'dirtDark'
    else if (n > 0.3) fill = 'grassPatch'
    else if (n > 0.05) fill = 'groundLight'
    else continue
    const opacity = 0.1 + Math.abs(n) * 0.2
    terrainBlobs.push({ cx, cy, rx, ry, rotation, fill, opacity })
  }

  const boulders = placeBoulders(width, height, mapConfig, rng)
  const outcroppings = placeOutcroppings(width, height, mapConfig, rng)
  const scatteredStones = placeScatteredStones(width, height, mapConfig, rng)

  const rockElements = []

  for (const b of boulders) {
    const vertices = 8 + Math.floor(rng() * 6)
    const shape = generateRockShape(b.x, b.y, b.radius, vertices, rng, noise2D, 2.0)
    const cracks = generateCracks(b.x, b.y, b.radius, rng, 1 + Math.floor(rng() * 3))
    rockElements.push({ shape, cracks, x: b.x, y: b.y, radius: b.radius, type: 'boulder' })
  }

  for (const cluster of outcroppings) {
    for (const rock of cluster) {
      const vertices = 10 + Math.floor(rng() * 6)
      const shape = generateRockShape(rock.x, rock.y, rock.radius, vertices, rng, noise2D, 3.0)
      const cracks = generateCracks(rock.x, rock.y, rock.radius, rng, 2 + Math.floor(rng() * 3))
      rockElements.push({ shape, cracks, x: rock.x, y: rock.y, radius: rock.radius, type: 'outcropping' })
    }
  }

  const stoneElements = scatteredStones.map((s) => {
    const vertices = 5 + Math.floor(rng() * 4)
    const shape = generateRockShape(s.x, s.y, s.radius, vertices, rng, noise2D, 1.5)
    return { shape, x: s.x, y: s.y, radius: s.radius, type: 'stone' }
  })

  return {
    width, height, seed, gridSize,
    terrainBlobs, rockElements, stoneElements, palette: PALETTE
  }
}

export function renderMapSVG(mapData) {
  const { width, height, gridSize, terrainBlobs, rockElements, stoneElements, palette } = mapData

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">\n`

  svg += `<defs>
  <filter id="groundNoise" x="0%" y="0%" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="6" seed="${mapData.seed}" result="noise" />
    <feColorMatrix type="saturate" values="0.05" result="desaturated" />
    <feBlend in="SourceGraphic" in2="desaturated" mode="soft-light" />
  </filter>
  <filter id="blobBlur">
    <feGaussianBlur stdDeviation="18" />
  </filter>
  <filter id="rockShadow" x="-20%" y="-20%" width="140%" height="140%">
    <feDropShadow dx="2" dy="3" stdDeviation="2" flood-color="${palette.shadowColor}" />
  </filter>
</defs>\n`

  // Background with noise texture
  svg += `<rect width="${width}" height="${height}" fill="${palette.groundBase}" filter="url(#groundNoise)" />\n`

  // Smooth terrain color blobs
  svg += `<g filter="url(#blobBlur)">\n`
  for (const blob of terrainBlobs) {
    const fill = palette[blob.fill]
    svg += `<ellipse cx="${blob.cx.toFixed(1)}" cy="${blob.cy.toFixed(1)}" rx="${blob.rx.toFixed(1)}" ry="${blob.ry.toFixed(1)}" fill="${fill}" opacity="${blob.opacity.toFixed(2)}" transform="rotate(${blob.rotation.toFixed(0)} ${blob.cx.toFixed(1)} ${blob.cy.toFixed(1)})" />\n`
  }
  svg += `</g>\n`

  // Rock shadows
  for (const rock of rockElements) {
    const shadowPath = pointsToPath(rock.shape.map(([x, y]) => [x + 3, y + 4]))
    svg += `<path d="${shadowPath}" fill="${palette.shadowColor}" />\n`
  }

  // Rocks
  for (const rock of rockElements) {
    const path = pointsToPath(rock.shape)
    const fillColor = rock.type === 'outcropping' ? palette.rockDark : palette.rockBase
    svg += `<path d="${path}" fill="${fillColor}" stroke="${palette.rockDark}" stroke-width="1" />\n`

    // Highlight
    const highlightPoints = rock.shape.map(([x, y]) => [
      rock.x + (x - rock.x) * 0.6,
      rock.y + (y - rock.y) * 0.6 - rock.radius * 0.08
    ])
    svg += `<path d="${pointsToPath(highlightPoints)}" fill="${palette.rockHighlight}" opacity="0.3" />\n`

    // Cracks
    if (rock.cracks) {
      for (const c of rock.cracks) {
        svg += `<path d="M ${c.sx.toFixed(1)} ${c.sy.toFixed(1)} Q ${c.mx.toFixed(1)} ${c.my.toFixed(1)} ${c.ex.toFixed(1)} ${c.ey.toFixed(1)}" fill="none" stroke="${palette.crackColor}" stroke-width="0.8" opacity="0.6" />\n`
      }
    }
  }

  // Scattered stones
  for (const stone of stoneElements) {
    svg += `<path d="${pointsToPath(stone.shape)}" fill="${palette.rockLight}" stroke="${palette.rockBase}" stroke-width="0.5" opacity="0.7" />\n`
  }

  // Grid
  if (gridSize > 0) {
    svg += `<g stroke="#000" stroke-width="0.3" opacity="0.15">\n`
    for (let x = gridSize; x < width; x += gridSize) {
      svg += `<line x1="${x}" y1="0" x2="${x}" y2="${height}" />\n`
    }
    for (let y = gridSize; y < height; y += gridSize) {
      svg += `<line x1="0" y1="${y}" x2="${width}" y2="${y}" />\n`
    }
    svg += `</g>\n`
  }

  svg += `</svg>`
  return svg
}
