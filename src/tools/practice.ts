/**
 * Practice routines, Speed Trainer progression, and Polyrhythm guides
 */

export interface PracticeStep {
  step: number;
  bpm: number;
  durationMinutes: number;
  instruction: string;
}

export function generateSpeedTrainerRoutine(
  startBpm: number,
  targetBpm: number,
  totalMinutes: number,
  stepBpm: number = 5
) {
  if (startBpm < 30 || targetBpm > 300 || startBpm >= targetBpm) {
    throw new Error("Invalid BPM range: startBpm must be < targetBpm, between 30 and 300");
  }

  const bpmDifference = targetBpm - startBpm;
  const numSteps = Math.max(3, Math.min(10, Math.floor(bpmDifference / stepBpm) + 1));
  const stepDuration = Math.round((totalMinutes / numSteps) * 10) / 10;

  const routine: PracticeStep[] = [];
  const bpmIncrement = bpmDifference / (numSteps - 1);

  for (let i = 0; i < numSteps; i++) {
    const currentBpm = Math.round(startBpm + i * bpmIncrement);
    let instruction = "";

    if (i === 0) {
      instruction = "Bemelegítés (Warmup): összpontosíts a tiszta artikulációra és laza kéztartásra.";
    } else if (i === numSteps - 1) {
      instruction = "Céltempó (Peak Tempo): játssz a céltempóban maximális kontrollal és dinamikával.";
    } else if (i === Math.floor(numSteps / 2)) {
      instruction = "Középtempó (Transition): figyeld az egyenletességet, ne feszülj meg.";
    } else {
      instruction = `Növeld a tempót: tartsd a ritmus stabilitását ${currentBpm} BPM mellett.`;
    }

    routine.push({
      step: i + 1,
      bpm: currentBpm,
      durationMinutes: stepDuration,
      instruction
    });
  }

  return {
    routineTitle: `Metronomify Speed Trainer: ${startBpm} ➔ ${targetBpm} BPM (${totalMinutes} perc)`,
    startBpm,
    targetBpm,
    totalMinutes,
    stepsCount: numSteps,
    steps: routine
  };
}

export const POLYRHYTHMS: Record<string, { name: string; ratio: string; description: string; phrase: string }> = {
  "3:2": {
    name: "3 a 2 ellen (Hemiola / Triplet against duplet)",
    ratio: "3:2",
    description: "Egyik kéz 3 egyenletes hangot játszik, míg a másik 2-t ugyanazon idő alatt.",
    phrase: "Segítő mondóka: 'Nem nehéz a ritmus' vagy angolul 'Not dif-fi-cult'"
  },
  "4:3": {
    name: "4 a 3 ellen",
    ratio: "4:3",
    description: "Négy hang három ellen. Gyakori a progresszív zenében, klasszikusban (Chopin) és jazzben.",
    phrase: "Segítő mondóka: 'Pass the gol-den but-ter'"
  },
  "5:4": {
    name: "5 a 4 ellen",
    ratio: "5:4",
    description: "Ötütéses poliritmus négyes kíséret felett. Haladó ritmusgyakorlat.",
    phrase: "Érezd a kvintolákat az alap 4-es pulzáláshoz képest."
  }
};

export function getPolyrhythmGuide(ratio?: string) {
  if (ratio && POLYRHYTHMS[ratio]) {
    return POLYRHYTHMS[ratio];
  }
  return {
    availablePolyrhythms: POLYRHYTHMS
  };
}
