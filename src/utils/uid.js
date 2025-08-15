// Generate unique IDs for tasks and notes
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Generate a more readable ID with timestamp
export function generateReadableId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 4);
  return `${timestamp}-${random}`;
}

// Generate a short ID for quick operations
export function generateShortId() {
  return Math.random().toString(36).substr(2, 8);
}

// Validate if an ID is properly formatted
export function isValidId(id) {
  return id && typeof id === 'string' && id.length > 0;
}


