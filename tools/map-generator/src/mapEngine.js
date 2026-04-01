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

// spread: 0 = edges only, 0.5 = uniform, 1 = center-biased
function placeWithSpread(width, height, edgeMargin, spread, rng) {
  if (spread >= 0.95) {
    // Center-biased: gaussian-ish toward center
    const cx = width / 2 + (rng() - 0.5 + rng() - 0.5) * width * 0.35
    const cy = height / 2 + (rng() - 0.5 + rng() - 0.5) * height * 0.35
    return [Math.max(5, Math.min(width - 5, cx)), Math.max(5, Math.min(height - 5, cy))]
  }

  if (spread <= 0.05) {
    // Edge-only
    const side = Math.floor(rng() * 4)
    const edgeDepth = edgeMargin * (0.3 + rng() * 0.7)
    let x, y
    switch (side) {
      case 0: x = edgeMargin + rng() * (width - 2 * edgeMargin); y = edgeDepth; break
      case 1: x = width - edgeDepth; y = edgeMargin + rng() * (height - 2 * edgeMargin); break
      case 2: x = edgeMargin + rng() * (width - 2 * edgeMargin); y = height - edgeDepth; break
      case 3: x = edgeDepth; y = edgeMargin + rng() * (height - 2 * edgeMargin); break
    }
    return [x, y]
  }

  // Blend: roll dice — place at edge or randomly based on spread
  if (rng() > spread) {
    // Edge placement
    const side = Math.floor(rng() * 4)
    const edgeDepth = edgeMargin * (0.3 + rng() * 0.7)
    let x, y
    switch (side) {
      case 0: x = edgeMargin + rng() * (width - 2 * edgeMargin); y = edgeDepth; break
      case 1: x = width - edgeDepth; y = edgeMargin + rng() * (height - 2 * edgeMargin); break
      case 2: x = edgeMargin + rng() * (width - 2 * edgeMargin); y = height - edgeDepth; break
      case 3: x = edgeDepth; y = edgeMargin + rng() * (height - 2 * edgeMargin); break
    }
    return [x, y]
  } else {
    // Interior placement, biased toward center as spread increases
    const bias = spread * 0.5
    const cx = width * bias + rng() * width * (1 - 2 * bias)
    const cy = height * bias + rng() * height * (1 - 2 * bias)
    return [Math.max(5, Math.min(width - 5, cx)), Math.max(5, Math.min(height - 5, cy))]
  }
}

function placeBoulders(width, height, config, rng) {
  const boulders = []
  const { edgeMargin, boulderMinSize, boulderMaxSize, boulderCount, spread } = config

  for (let i = 0; i < boulderCount; i++) {
    const [x, y] = placeWithSpread(width, height, edgeMargin, spread, rng)
    const radius = boulderMinSize + rng() * (boulderMaxSize - boulderMinSize)
    boulders.push({ x, y, radius })
  }
  return boulders
}

function placeScatteredStones(width, height, config, rng) {
  const stones = []
  for (let i = 0; i < config.scatterCount; i++) {
    const [x, y] = placeWithSpread(width, height, config.edgeMargin, config.spread, rng)
    const radius = 2 + rng() * 5
    stones.push({ x, y, radius })
  }
  return stones
}

function placeOutcroppings(width, height, config, rng) {
  const outcroppings = []
  const { edgeMargin, boulderMinSize, boulderMaxSize, outcroppingCount, spread } = config

  for (let i = 0; i < outcroppingCount; i++) {
    const [cx, cy] = placeWithSpread(width, height, edgeMargin, spread, rng)

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

// Pick a random point on a map edge, returning [x, y, side]
function randomEdgePoint(width, height, rng) {
  const side = Math.floor(rng() * 4)
  switch (side) {
    case 0: return [rng() * width, 0, 0]             // top
    case 1: return [width, rng() * height, 1]         // right
    case 2: return [rng() * width, height, 2]         // bottom
    case 3: return [0, rng() * height, 3]             // left
  }
}

// Sample evenly-spaced points along a polyline (for distance checks)
function samplePolyline(points, step) {
  const samples = []
  for (let i = 0; i < points.length - 1; i++) {
    const [ax, ay] = points[i]
    const [bx, by] = points[i + 1]
    const dx = bx - ax, dy = by - ay
    const len = Math.sqrt(dx * dx + dy * dy)
    const steps = Math.max(1, Math.ceil(len / step))
    for (let s = 0; s <= steps; s++) {
      const t = s / steps
      samples.push([ax + dx * t, ay + dy * t])
    }
  }
  return samples
}

// Check minimum distance from point to any sampled road point
function distToRoadSamples(x, y, allRoadSamples) {
  let minDist = Infinity
  for (const [rx, ry] of allRoadSamples) {
    const d = Math.sqrt((x - rx) * (x - rx) + (y - ry) * (y - ry))
    if (d < minDist) minDist = d
  }
  return minDist
}

function generateRoads(width, height, config, rng, noise2D) {
  const roads = []
  const allPoints = [] // all road polyline points for merging
  const { roadCount, roadWidth, roadCurve } = config

  for (let i = 0; i < roadCount; i++) {
    // Pick entry and exit on different sides
    const [x1, y1, side1] = randomEdgePoint(width, height, rng)
    let x2, y2, side2
    do {
      [x2, y2, side2] = randomEdgePoint(width, height, rng)
    } while (side2 === side1)

    const segments = 3 + Math.floor(rng() * 2)
    const points = [[x1, y1]]

    for (let s = 1; s < segments; s++) {
      const t = s / segments
      let baseX = x1 + (x2 - x1) * t
      let baseY = y1 + (y2 - y1) * t

      // Noise-based curve offset
      const noiseVal = noise2D(baseX * 0.005 + i * 10, baseY * 0.005)
      const perpX = -(y2 - y1)
      const perpY = (x2 - x1)
      const perpLen = Math.sqrt(perpX * perpX + perpY * perpY) || 1
      const offset = noiseVal * roadCurve * Math.min(width, height) * 0.3
      baseX += (perpX / perpLen) * offset
      baseY += (perpY / perpLen) * offset

      // Merge: attract toward existing road points if close enough
      if (allPoints.length > 0) {
        let closestDist = Infinity
        let closestPt = null
        for (const [px, py] of allPoints) {
          const d = Math.sqrt((baseX - px) * (baseX - px) + (baseY - py) * (baseY - py))
          if (d < closestDist) { closestDist = d; closestPt = [px, py] }
        }
        // If within merge distance (2x road width), pull toward it
        const mergeDist = roadWidth * 2.5
        if (closestDist < mergeDist && closestPt) {
          const pull = 1 - (closestDist / mergeDist)
          baseX += (closestPt[0] - baseX) * pull * 0.6
          baseY += (closestPt[1] - baseY) * pull * 0.6
        }
      }

      points.push([baseX, baseY])
    }
    points.push([x2, y2])

    // Store sampled points for future road merging
    allPoints.push(...samplePolyline(points, 15))

    // Build smooth SVG path (Catmull-Rom to cubic bezier)
    let path = `M ${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}`
    if (points.length === 2) {
      path += ` L ${points[1][0].toFixed(1)} ${points[1][1].toFixed(1)}`
    } else {
      for (let j = 0; j < points.length - 1; j++) {
        const p0 = points[Math.max(0, j - 1)]
        const p1 = points[j]
        const p2 = points[Math.min(points.length - 1, j + 1)]
        const p3 = points[Math.min(points.length - 1, j + 2)]

        const cp1x = p1[0] + (p2[0] - p0[0]) / 6
        const cp1y = p1[1] + (p2[1] - p0[1]) / 6
        const cp2x = p2[0] - (p3[0] - p1[0]) / 6
        const cp2y = p2[1] - (p3[1] - p1[1]) / 6

        path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`
      }
    }

    const w = roadWidth * (0.8 + rng() * 0.4)
    roads.push({ path, width: w, points })
  }
  return roads
}

// Build combined road sample points for clearance checks
function buildRoadSamples(roadElements) {
  const samples = []
  for (const road of roadElements) {
    if (road.points) samples.push(...samplePolyline(road.points, 10))
  }
  return samples
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
  roadFill:      '#8a7a5e',
  roadEdge:      '#6e6348',
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
    spread = 0,
    showRoads = false,
    roadCount = 1,
    roadWidth = 20,
    roadCurve = 0.5,
    roadClearance = 30,
  } = config

  const rng = mulberry32(seed)
  const noise2D = createSeededNoise(seed)

  const mapConfig = {
    boulderCount, outcroppingCount, scatterCount,
    boulderMinSize, boulderMaxSize, edgeMargin, spread,
    roadCount, roadWidth, roadCurve
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

  // Roads (generated before rocks so seed order is consistent)
  const roadElements = showRoads ? generateRoads(width, height, mapConfig, rng, noise2D) : []

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

  // Filter rocks/stones by road clearance
  const roadSamples = showRoads ? buildRoadSamples(roadElements) : []
  const filteredRocks = roadSamples.length > 0
    ? rockElements.filter((r) => distToRoadSamples(r.x, r.y, roadSamples) > roadClearance + r.radius)
    : rockElements
  const filteredStones = roadSamples.length > 0
    ? stoneElements.filter((s) => distToRoadSamples(s.x, s.y, roadSamples) > roadClearance)
    : stoneElements

  return {
    width, height, seed, gridSize,
    terrainBlobs, roadElements, rockElements: filteredRocks, stoneElements: filteredStones, palette: PALETTE
  }
}

export function renderMapSVG(mapData) {
  const { width, height, gridSize, terrainBlobs, roadElements, rockElements, stoneElements, palette } = mapData

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

  // Roads — rendered under rocks
  for (const road of roadElements) {
    // Road edge (wider, darker)
    svg += `<path d="${road.path}" fill="none" stroke="${palette.roadEdge}" stroke-width="${(road.width + 4).toFixed(1)}" stroke-linecap="round" stroke-linejoin="round" />\n`
    // Road surface
    svg += `<path d="${road.path}" fill="none" stroke="${palette.roadFill}" stroke-width="${road.width.toFixed(1)}" stroke-linecap="round" stroke-linejoin="round" />\n`
    // Subtle center line (worn track marks)
    svg += `<path d="${road.path}" fill="none" stroke="${palette.groundLight}" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="8 12" opacity="0.2" />\n`
  }

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
