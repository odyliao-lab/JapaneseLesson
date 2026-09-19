/** Shared mutable state for API auth tests. Reset between cases. */

export const headerStore = new Map();

export function setAuthHeaders(headers = {}) {
  headerStore.clear();
  for (const [name, value] of Object.entries(headers)) {
    if (value != null) headerStore.set(name.toLowerCase(), String(value));
  }
}

export function clearAuthHeaders() {
  headerStore.clear();
}

let selectQueue = [];

export function setSelectResults(...batches) {
  selectQueue = batches.map((rows) => (Array.isArray(rows) ? rows : [rows]));
}

export function takeSelectResult() {
  if (!selectQueue.length) return [];
  return selectQueue.shift();
}

export function resetMockDb() {
  selectQueue = [];
}
