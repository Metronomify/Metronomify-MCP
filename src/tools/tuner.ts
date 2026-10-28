/**
 * Tuner and Pitch calculations compatible with Metronomify Tuner
 */

export interface InstrumentTuning {
  name: string;
  category: "guitar" | "bass" | "strings" | "ukulele";
  notes: { note: string; octave: number; semitoneOffsetFromA4: number }[];
}

export const INSTRUMENT_TUNINGS: Record<string, InstrumentTuning> = {
  "guitar_standard": {
    name: "Gitár - Standard (E A D G B E)",
    category: "guitar",
    notes: [
      { note: "E", octave: 2, semitoneOffsetFromA4: -29 },
      { note: "A", octave: 2, semitoneOffsetFromA4: -24 },
      { note: "D", octave: 3, semitoneOffsetFromA4: -19 },
      { note: "G", octave: 3, semitoneOffsetFromA4: -14 },
      { note: "B", octave: 3, semitoneOffsetFromA4: -10 },
      { note: "E", octave: 4, semitoneOffsetFromA4: -5 }
    ]
  },
  "guitar_drop_d": {
    name: "Gitár - Drop D (D A D G B E)",
    category: "guitar",
    notes: [
      { note: "D", octave: 2, semitoneOffsetFromA4: -31 },
      { note: "A", octave: 2, semitoneOffsetFromA4: -24 },
      { note: "D", octave: 3, semitoneOffsetFromA4: -19 },
      { note: "G", octave: 3, semitoneOffsetFromA4: -14 },
      { note: "B", octave: 3, semitoneOffsetFromA4: -10 },
      { note: "E", octave: 4, semitoneOffsetFromA4: -5 }
    ]
  },
  "bass_standard_4": {
    name: "Basszusgitár 4 húros (E A D G)",
    category: "bass",
    notes: [
      { note: "E", octave: 1, semitoneOffsetFromA4: -41 },
      { note: "A", octave: 1, semitoneOffsetFromA4: -36 },
      { note: "D", octave: 2, semitoneOffsetFromA4: -31 },
      { note: "G", octave: 2, semitoneOffsetFromA4: -26 }
    ]
  },
  "ukulele_standard": {
    name: "Ukulele Standard (G C E A)",
    category: "ukulele",
    notes: [
      { note: "G", octave: 4, semitoneOffsetFromA4: -2 },
      { note: "C", octave: 4, semitoneOffsetFromA4: -9 },
      { note: "E", octave: 4, semitoneOffsetFromA4: -5 },
      { note: "A", octave: 4, semitoneOffsetFromA4: 0 }
    ]
  },
  "violin_standard": {
    name: "Hegedű Standard (G D A E)",
    category: "strings",
    notes: [
      { note: "G", octave: 3, semitoneOffsetFromA4: -14 },
      { note: "D", octave: 4, semitoneOffsetFromA4: -7 },
      { note: "A", octave: 4, semitoneOffsetFromA4: 0 },
      { note: "E", octave: 5, semitoneOffsetFromA4: 7 }
    ]
  },
  "cello_standard": {
    name: "Cselló Standard (C G D A)",
    category: "strings",
    notes: [
      { note: "C", octave: 2, semitoneOffsetFromA4: -33 },
      { note: "G", octave: 2, semitoneOffsetFromA4: -26 },
      { note: "D", octave: 3, semitoneOffsetFromA4: -19 },
      { note: "A", octave: 3, semitoneOffsetFromA4: -12 }
    ]
  }
};

/**
 * Calculates frequency in Hertz for a note given an A4 reference frequency
 * Formula: f = A4 * 2^(semitones / 12)
 */
export function getFrequency(semitoneOffsetFromA4: number, a4Frequency: number = 440): number {
  return a4Frequency * Math.pow(2, semitoneOffsetFromA4 / 12);
}

export function calculateTuningFrequencies(instrumentKey: string, a4Frequency: number = 440) {
  const tuning = INSTRUMENT_TUNINGS[instrumentKey];
  if (!tuning) {
    return {
      error: `Unknown tuning: ${instrumentKey}`,
      availableTunings: Object.keys(INSTRUMENT_TUNINGS)
    };
  }

  const strings = tuning.notes.map((n, idx) => {
    const freq = getFrequency(n.semitoneOffsetFromA4, a4Frequency);
    return {
      stringNumber: idx + 1,
      note: `${n.note}${n.octave}`,
      targetFrequencyHz: Math.round(freq * 100) / 100,
      semitonesFromA4: n.semitoneOffsetFromA4
    };
  });

  return {
    instrument: tuning.name,
    category: tuning.category,
    referenceA4Hz: a4Frequency,
    strings
  };
}
