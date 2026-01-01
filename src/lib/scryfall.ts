// Scryfall API integration for fetching MTG sets

export interface MtgSet {
  code: string;
  name: string;
  released_at: string;
  set_type: string;
  digital: boolean;
  icon_svg_uri?: string;
}

interface ScryfallSetsResponse {
  object: string;
  has_more: boolean;
  data: MtgSet[];
}

// Cache for sets to avoid repeated API calls
let cachedSets: MtgSet[] | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

// Set types that are draftable/playable in limited formats
const DRAFTABLE_SET_TYPES = [
  'core',
  'expansion',
  'masters',
  'draft_innovation',
  'funny', // Un-sets
];

/**
 * Fetch all MTG sets from Scryfall API
 * Returns only draftable/playable sets, sorted by release date (newest first)
 */
export async function fetchMtgSets(): Promise<MtgSet[]> {
  // Return cached sets if still valid
  if (cachedSets && cacheTimestamp && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return cachedSets;
  }

  try {
    const response = await fetch('https://api.scryfall.com/sets');
    if (!response.ok) {
      throw new Error(`Scryfall API error: ${response.status}`);
    }

    const data: ScryfallSetsResponse = await response.json();
    
    // Filter to only draftable sets that have been released and are not digital-only
    const now = new Date();
    const filteredSets = data.data.filter(set => {
      // Must be a draftable set type
      if (!DRAFTABLE_SET_TYPES.includes(set.set_type)) return false;
      
      // Must not be digital-only
      if (set.digital) return false;
      
      // Must be released (released_at is in the past)
      const releaseDate = new Date(set.released_at);
      if (releaseDate > now) return false;
      
      return true;
    });

    // Sort by release date, newest first
    filteredSets.sort((a, b) => {
      return new Date(b.released_at).getTime() - new Date(a.released_at).getTime();
    });

    // Cache the results
    cachedSets = filteredSets;
    cacheTimestamp = Date.now();

    return filteredSets;
  } catch (error) {
    console.error('Failed to fetch MTG sets from Scryfall:', error);
    // Return cached data if available, even if expired
    if (cachedSets) {
      return cachedSets;
    }
    throw error;
  }
}

/**
 * Get a specific set by code
 */
export function getSetByCode(code: string, sets: MtgSet[]): MtgSet | undefined {
  return sets.find(set => set.code.toLowerCase() === code.toLowerCase());
}

/**
 * Clear the cache (useful for testing or forcing refresh)
 */
export function clearSetsCache(): void {
  cachedSets = null;
  cacheTimestamp = null;
}

