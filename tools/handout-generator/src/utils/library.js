const STORAGE_KEY = 'handout-library'

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
  } catch { return [] }
}

function writeAll(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

/** Returns all saved handouts sorted newest-first. */
export function getLibrary() {
  return readAll().sort((a, b) => b.savedAt - a.savedAt)
}

/** Save a handout. If id is provided, update it; otherwise create new. */
export function saveHandout({ id, name, type, data }) {
  const items = readAll()
  const now = Date.now()

  if (id) {
    const idx = items.findIndex(h => h.id === id)
    if (idx !== -1) {
      items[idx] = { ...items[idx], name, type, data, savedAt: now }
      writeAll(items)
      return items[idx]
    }
  }

  const entry = { id: now, name, type, data, savedAt: now }
  items.push(entry)
  writeAll(items)
  return entry
}

/** Delete a handout by id. */
export function deleteHandout(id) {
  writeAll(readAll().filter(h => h.id !== id))
}

/** Duplicate a handout. */
export function duplicateHandout(id) {
  const items = readAll()
  const source = items.find(h => h.id === id)
  if (!source) return null
  const copy = { ...source, id: Date.now(), name: `${source.name} (copy)`, savedAt: Date.now() }
  items.push(copy)
  writeAll(items)
  return copy
}
