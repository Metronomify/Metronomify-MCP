/**
 * Musical tempo definitions, conversions, and calculations
 */

export interface TempoTerm {
  term: string;
  minBpm: number;
  maxBpm: number;
  description: string;
}

export const TEMPO_TERMS: TempoTerm[] = [
  { term: "Larghissimo", minBpm: 20, maxBpm: 39, description: "Nagyon, rendkívül lassú (Very, very slow)" },
  { term: "Grave", minBpm: 40, maxBpm: 44, description: "Nagyon lassú és ünnepélyes (Slow and solemn)" },
  { term: "Largo", minBpm: 45, maxBpm: 59, description: "Lassan, szélesen (Broadly, slowly)" },
  { term: "Larghetto", minBpm: 60, maxBpm: 66, description: "Kissé szélesebben, mint a Largo (Rather broadly)" },
  { term: "Adagio", minBpm: 67, maxBpm: 76, description: "Lassan, kényelmesen (Slow and stately)" },
  { term: "Andante", minBpm: 77, maxBpm: 107, description: "Lépésben, járva (At a walking pace)" },
  { term: "Andantino", minBpm: 80, maxBpm: 108, description: "Kissé gyorsabb mint az Andante (Slightly faster than Andante)" },
  { term: "Moderato", minBpm: 108, maxBpm: 119, description: "Mérsékelten (Moderately)" },
  { term: "Allegretto", minBpm: 112, maxBpm: 120, description: "Mérsékelten gyorsan (Moderately fast)" },
  { term: "Allegro", minBpm: 120, maxBpm: 155, description: "Gyorsan, vidáman (Fast, quickly, and bright)" },
  { term: "Vivace", minBpm: 156, maxBpm: 175, description: "Élénken, gyorsan (Lively and fast)" },
  { term: "Presto", minBpm: 168, maxBpm: 199, description: "Nagyon gyorsan (Very, very fast)" },
  { term: "Prestissimo", minBpm: 200, maxBpm: 280, description: "Rendkívül sebesen (Even faster than presto)" }
];

export const GENRE_BPM_RANGES: Record<string, { minBpm: number; maxBpm: number; typical: number }> = {
  "ballad": { minBpm: 60, maxBpm: 80, typical: 72 },
  "reggae": { minBpm: 60, maxBpm: 90, typical: 76 },
  "hip-hop": { minBpm: 80, maxBpm: 105, typical: 90 },
  "r&b": { minBpm: 65, maxBpm: 95, typical: 82 },
  "pop": { minBpm: 100, maxBpm: 130, typical: 118 },
  "rock": { minBpm: 110, maxBpm: 140, typical: 124 },
  "metal": { minBpm: 120, maxBpm: 220, typical: 160 },
  "house": { minBpm: 120, maxBpm: 130, typical: 125 },
  "techno": { minBpm: 125, maxBpm: 150, typical: 135 },
  "drum and bass": { minBpm: 160, maxBpm: 180, typical: 174 },
  "punk": { minBpm: 140, maxBpm: 200, typical: 165 },
  "jazz swing": { minBpm: 110, maxBpm: 240, typical: 140 },
  "bossa nova": { minBpm: 110, maxBpm: 145, typical: 125 }
};

export function lookupTempo(query: string) {
  const q = query.toLowerCase().trim();
  const matchedTerm = TEMPO_TERMS.find(t => t.term.toLowerCase() === q || t.term.toLowerCase().includes(q));
  const matchedGenreKey = Object.keys(GENRE_BPM_RANGES).find(g => g.includes(q) || q.includes(g));

  const result: any = {};
  if (matchedTerm) {
    result.tempoTerm = matchedTerm;
  }
  if (matchedGenreKey) {
    result.genreSuggestion = {
      genre: matchedGenreKey,
      ...GENRE_BPM_RANGES[matchedGenreKey]
    };
  }

  if (!matchedTerm && !matchedGenreKey) {
    result.allTempoTerms = TEMPO_TERMS;
    result.allGenres = GENRE_BPM_RANGES;
  }

  return result;
}

export function calculateSubdivisionsAndDelay(bpm: number) {
  if (bpm <= 0 || bpm > 500) {
    throw new Error("BPM must be between 1 and 500");
  }

  // 1 beat = quarter note (4/4 time)
  const quarterNoteMs = (60 / bpm) * 1000;
  const wholeNoteMs = quarterNoteMs * 4;
  const halfNoteMs = quarterNoteMs * 2;
  const eighthNoteMs = quarterNoteMs / 2;
  const sixteenthNoteMs = quarterNoteMs / 4;
  const thirtySecondNoteMs = quarterNoteMs / 8;

  // Dotted notes (1.5x)
  const dottedQuarterMs = quarterNoteMs * 1.5;
  const dottedEighthMs = eighthNoteMs * 1.5;

  // Triplet notes (2/3x)
  const quarterTripletMs = (quarterNoteMs * 2) / 3;
  const eighthTripletMs = (eighthNoteMs * 2) / 3;

  return {
    bpm,
    quarterNoteMs: Math.round(quarterNoteMs * 100) / 100,
    wholeNoteMs: Math.round(wholeNoteMs * 100) / 100,
    halfNoteMs: Math.round(halfNoteMs * 100) / 100,
    eighthNoteMs: Math.round(eighthNoteMs * 100) / 100,
    sixteenthNoteMs: Math.round(sixteenthNoteMs * 100) / 100,
    thirtySecondNoteMs: Math.round(thirtySecondNoteMs * 100) / 100,
    dotted: {
      quarter: Math.round(dottedQuarterMs * 100) / 100,
      eighth: Math.round(dottedEighthMs * 100) / 100
    },
    triplets: {
      quarter: Math.round(quarterTripletMs * 100) / 100,
      eighth: Math.round(eighthTripletMs * 100) / 100
    },
    hertz: Math.round((bpm / 60) * 1000) / 1000
  };
}
