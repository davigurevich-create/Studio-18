const PREFIX = 'studio18:'

function load<T>(key: string, seed: T[]): T[] {
  const raw = localStorage.getItem(PREFIX + key)
  if (!raw) {
    localStorage.setItem(PREFIX + key, JSON.stringify(seed))
    return seed
  }
  try {
    return JSON.parse(raw) as T[]
  } catch {
    return seed
  }
}

function save<T>(key: string, items: T[]) {
  localStorage.setItem(PREFIX + key, JSON.stringify(items))
}

export function makeTable<T extends { id: string }>(key: string, seed: T[]) {
  return {
    all(): T[] {
      return load(key, seed)
    },
    insert(item: T): T {
      const items = load(key, seed)
      items.push(item)
      save(key, items)
      return item
    },
    update(id: string, patch: Partial<T>): T | undefined {
      const items = load(key, seed)
      const idx = items.findIndex((i) => i.id === id)
      if (idx === -1) return undefined
      items[idx] = { ...items[idx], ...patch }
      save(key, items)
      return items[idx]
    },
    remove(id: string) {
      const items = load(key, seed).filter((i) => i.id !== id)
      save(key, items)
    },
  }
}

export function newId(): string {
  return crypto.randomUUID()
}
