import { customAlphabet } from 'nanoid';

// Use a custom alphabet for URL-friendly short IDs
const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz';

// Event IDs: 8 characters (e.g., "xh82-99a" format)
const generateEventId = customAlphabet(alphabet, 8);

// Player/Match IDs: 6 characters
const generateEntityId = customAlphabet(alphabet, 6);

export function createEventId(): string {
  const id = generateEventId();
  // Format as xxxx-xxx for readability
  return `${id.slice(0, 4)}-${id.slice(4, 7)}`;
}

export function createPlayerId(): string {
  return generateEntityId();
}

export function createMatchId(): string {
  return generateEntityId();
}

