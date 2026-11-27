/** Every base move symbol supported by the engine. */
export type OuterFace = 'U' | 'D' | 'L' | 'R' | 'F' | 'B';
export type SliceMove = 'M' | 'E' | 'S';
export type WideMove = 'u' | 'd' | 'l' | 'r' | 'f' | 'b';
export type CubeRotation = 'x' | 'y' | 'z';
export type MoveBase = OuterFace | SliceMove | WideMove | CubeRotation;

/** Number of clockwise quarter turns: 1 = clockwise, -1 = prime, 2 / -2 = double turn. */
export type MoveAmount = 1 | -1 | 2 | -2;

export interface Move {
  readonly base: MoveBase;
  readonly amount: MoveAmount;
  /** Notation used for display (preserves the author's spelling, e.g. `Rw` vs `r`, `2'`). */
  readonly text: string;
}

export interface MoveNode {
  readonly kind: 'move';
  readonly move: Move;
  /** Index into the flattened atomic move list. */
  readonly index: number;
}

export interface GroupNode {
  readonly kind: 'group';
  readonly children: readonly AlgNode[];
}

export type AlgNode = MoveNode | GroupNode;

export interface ParsedAlgorithm {
  readonly source: string;
  /** Tree preserving trigger groupings for display. */
  readonly nodes: readonly AlgNode[];
  /** Flattened atomic moves used for execution. */
  readonly moves: readonly Move[];
}
