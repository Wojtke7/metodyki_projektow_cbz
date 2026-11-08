type Point = { x: number; y: number };
type Curve = [number, number, number, number, number, number];

export type WritingStroke = {
  path: string;
  points: Point[];
  start: number;
  end: number;
  width: number;
};

export const WRITING_DURATION_SECONDS = 4;
const ROW_STEP_SECONDS = 0.68;
const ROW_WRITE_SECONDS = 0.46;
const WORD_PAUSE_SECONDS = 0.035;

// Original cursive gestures: a loop, an ascender, an arch, and a short shoulder.
const gestures: Curve[][] = [
  [
    [0.25, -0.2, 0.1, -0.9, 0.48, -0.9],
    [0.95, -0.9, 0.75, -0.15, 0.3, -0.15],
    [0.2, 0.1, 0.55, 0.25, 1, 0],
  ],
  [
    [0.2, -0.2, 0.4, -1.1, 0.6, -1.1],
    [0.95, -1.15, 0.5, 0.1, 0.45, 0.05],
    [0.55, 0.2, 0.9, -0.2, 1, 0],
  ],
  [
    [0.18, 0.25, 0.18, -0.9, 0.48, -0.8],
    [0.9, -1.1, 0.68, 0.2, 1, 0],
  ],
  [
    [0.1, 0.15, 0.35, -0.95, 0.4, -0.75],
    [0.7, -0.5, 0.65, -0.1, 1, 0],
  ],
];

// Handwritten "2115" shapes blend into the middle word of the third row.
const hiddenDigits: Curve[][] = [
  [
    [0.1, -1.08, 0.72, -1.08, 0.82, -0.76],
    [0.95, -0.52, 0.25, -0.16, 0.08, 0],
    [0.35, 0, 0.74, 0, 1, 0],
  ],
  [
    [0.1, -0.55, 0.3, -0.8, 0.5, -1],
    [0.5, -0.75, 0.5, -0.25, 0.5, 0],
    [0.68, 0, 0.85, 0, 1, 0],
  ],
  [
    [0.12, -0.5, 0.35, -0.82, 0.55, -1],
    [0.54, -0.75, 0.52, -0.25, 0.52, 0],
    [0.7, 0.02, 0.86, 0, 1, 0],
  ],
  [
    [0.65, -1, 0.35, -1, 0.16, -1],
    [0.14, -0.8, 0.12, -0.65, 0.12, -0.48],
    [0.42, -0.65, 0.92, -0.48, 0.8, -0.13],
    [0.7, 0.15, 0.25, 0.11, 0.12, -0.02],
    [0.36, 0, 0.78, 0, 1, 0],
  ],
];

function variation(seed: number) {
  const value = Math.sin(seed * 12.9898 + 4.1414) * 43758.5453;
  return value - Math.floor(value);
}

export const writingStrokes: WritingStroke[] = [];
const timeline: (Point & { time: number })[] = [];
const wordSizes = [
  [4, 6, 3, 5],
  [5, 3, 6, 4],
  [6, 4, 5],
  [3, 5, 4, 6],
  [5, 5, 3, 4],
];

for (const [row, words] of wordSizes.entries()) {
  const rowStrokes: WritingStroke[] = [];
  const rowStart = row * ROW_STEP_SECONDS;
  const letterCount = words.reduce((sum, count) => sum + count, 0);
  const letterWidth =
    (172 + variation(row + 1) * 16 - (words.length - 1) * 9) / letterCount;
  let x = 56;

  for (const [word, count] of words.entries()) {
    let current: Point = {
      x,
      y: 64 + row * 22 + (variation(row * 17 + word) - 0.5) * 2,
    };
    let points = [current];
    let path = `M${current.x.toFixed(3)} ${current.y.toFixed(3)}`;
    const finishStroke = () => {
      rowStrokes.push({
        path,
        points,
        start: 0,
        end: 0,
        width: 1.5 + variation(row * 31 + word) * 0.45,
      });
    };

    for (let letter = 0; letter < count; letter++) {
      const seed = row * 113 + word * 19 + letter * 3 + 1;
      const gestureIndex = Math.floor(variation(seed) * gestures.length);
      const hiddenDigit =
        row === 2 && word === 1 ? hiddenDigits[letter] : undefined;
      const width =
        letterWidth *
        (0.85 + variation(seed + 1) * 0.3) *
        (hiddenDigit ? 1.12 : 1);
      const height = hiddenDigit
        ? 11.5 + variation(seed + 2)
        : (gestureIndex === 1 ? 10 : 5) + variation(seed + 2) * 4;
      const drift = (variation(seed + 3) - 0.5) * (hiddenDigit ? 0.2 : 0.8);
      const origin =
        hiddenDigit && letter === 3
          ? { ...current, x: current.x + 2.5 }
          : current;
      const mapPoint = (px: number, py: number): Point => ({
        x: origin.x + px * width - py * height * (hiddenDigit ? 0.08 : 0.18),
        y: origin.y + py * height + px * drift,
      });

      // Start 2 at its upper curve and lift before 5 to avoid cursive entry loops.
      if (hiddenDigit && (letter === 0 || letter === 3)) {
        if (letter === 3) finishStroke();
        current = mapPoint(letter === 0 ? 0 : 0.85, letter === 0 ? -0.72 : -1);
        points = [current];
        path = `M${current.x.toFixed(3)} ${current.y.toFixed(3)}`;
      }

      for (const curve of hiddenDigit ?? gestures[gestureIndex]) {
        const first = mapPoint(curve[0], curve[1]);
        const second = mapPoint(curve[2], curve[3]);
        const end = mapPoint(curve[4], curve[5]);
        path += ` C${first.x.toFixed(3)} ${first.y.toFixed(3)} ${second.x.toFixed(3)} ${second.y.toFixed(3)} ${end.x.toFixed(3)} ${end.y.toFixed(3)}`;

        // Sample the same Bézier curve for the pen's position and distance timing.
        for (let sample = 1; sample <= 16; sample++) {
          const t = sample / 16;
          const inverse = 1 - t;
          points.push({
            x:
              inverse ** 3 * current.x +
              3 * inverse ** 2 * t * first.x +
              3 * inverse * t ** 2 * second.x +
              t ** 3 * end.x,
            y:
              inverse ** 3 * current.y +
              3 * inverse ** 2 * t * first.y +
              3 * inverse * t ** 2 * second.y +
              t ** 3 * end.y,
          });
        }
        current = end;
      }
    }

    finishStroke();
    x = current.x + 7 + variation(row * 23 + word) * 4;
  }

  const distances = rowStrokes.map(({ points }) => {
    const lengths = [0];
    for (let index = 1; index < points.length; index++) {
      lengths.push(
        lengths[index - 1] +
          Math.hypot(
            points[index].x - points[index - 1].x,
            points[index].y - points[index - 1].y,
          ),
      );
    }
    return lengths;
  });
  const rowLength = distances.reduce(
    (sum, lengths) => sum + lengths[lengths.length - 1],
    0,
  );
  const writingTime =
    ROW_WRITE_SECONDS - (rowStrokes.length - 1) * WORD_PAUSE_SECONDS;
  let time = rowStart;

  rowStrokes.forEach((stroke, word) => {
    const lengths = distances[word];
    const length = lengths[lengths.length - 1];
    const duration = (writingTime * length) / rowLength;
    stroke.start = time / WRITING_DURATION_SECONDS;
    stroke.end = (time + duration) / WRITING_DURATION_SECONDS;
    stroke.points.forEach((point, index) => {
      timeline.push({
        ...point,
        time:
          (time + (lengths[index] / length) * duration) /
          WRITING_DURATION_SECONDS,
      });
    });
    time += duration + WORD_PAUSE_SECONDS;
    writingStrokes.push(stroke);
  });

  const last = timeline[timeline.length - 1];
  if (row < wordSizes.length - 1) {
    const returnStep = (ROW_STEP_SECONDS - ROW_WRITE_SECONDS) / 3;
    timeline.push(
      {
        x: 252,
        y: last.y - 2,
        time:
          (rowStart + ROW_WRITE_SECONDS + returnStep) /
          WRITING_DURATION_SECONDS,
      },
      {
        x: 252,
        y: 64 + (row + 1) * 22,
        time:
          (rowStart + ROW_WRITE_SECONDS + returnStep * 2) /
          WRITING_DURATION_SECONDS,
      },
    );
  } else {
    timeline.push(
      { x: 252, y: last.y, time: 0.85 },
      { x: 252, y: 178, time: 0.9 },
      { x: 56, y: 178, time: 0.95 },
      { ...writingStrokes[0].points[0], time: 1 },
    );
  }
}

export const penKeyframes = {
  x: timeline.map((point) => point.x),
  y: timeline.map((point) => point.y),
  times: timeline.map((point) => point.time),
};
