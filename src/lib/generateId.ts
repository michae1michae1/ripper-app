import { customAlphabet } from 'nanoid';

// Use a custom alphabet for URL-friendly short IDs
const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz';

// Event IDs: 8 characters (e.g., "xh82-99a" format)
const generateEventId = customAlphabet(alphabet, 8);

// Player/Match IDs: 6 characters
const generateEntityId = customAlphabet(alphabet, 6);

// Event codes: 4 uppercase chars, easy to read (no 0/O, 1/l/I confusion)
const codeAlphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const generateCode = customAlphabet(codeAlphabet, 4);

export function createEventId(): string {
  const id = generateEventId();
  // Format as xxxx-xxx for readability
  return `${id.slice(0, 4)}-${id.slice(4, 7)}`;
}

export function createEventCode(): string {
  return generateCode();
}

export function createPlayerId(): string {
  return generateEntityId();
}

export function createMatchId(): string {
  return generateEntityId();
}

// Parse composite ID (CODE-uniqueId) to extract parts
export function parseCompositeId(compositeId: string): { code: string; id: string } | null {
  // Format: WXYZ-abc1-234 where WXYZ is the code and abc1-234 is the unique ID
  const match = compositeId.match(/^([A-Z0-9]{4})-(.+)$/);
  if (match) {
    return { code: match[1], id: match[2] };
  }
  return null;
}

// Create composite ID from code and unique ID
export function createCompositeId(code: string, id: string): string {
  return `${code}-${id}`;
}

