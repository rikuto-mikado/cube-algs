import { parseAlgorithm } from './parser';
import type { AlgNode, Move, MoveAmount, MoveBase } from './types';

/**
 * Mirroring across the L/R plane (x → −x), the standard "left-handed" mirror.
 *
 * Conjugating by the reflection keeps every rotation about x unchanged and
 * negates rotations about y and z. Hence:
 *  - R ↔ L', r ↔ l' (same physical twist, now on the opposite side → named prime);
 *  - M and x keep their direction (they straddle / span the mirror plane);
 *  - every y/z-axis move inverts: U → U', D → D', F → F', B → B', E, S, u, d, f, b, y, z.
 * Double turns are unchanged.
 */
const SWAP: Partial<Record<MoveBase, MoveBase>> = { R: 'L', L: 'R', r: 'l', l: 'r' };

/** Moves about the x axis that straddle the mirror plane are their own mirror image. */
const KEEP: ReadonlySet<MoveBase> = new Set<MoveBase>(['M', 'x']);

const SPELLING: Readonly<Record<string, string>> = {
  R: 'L',
  L: 'R',
  r: 'l',
  l: 'r',
  Rw: 'Lw',
  Lw: 'Rw',
};

function splitText(text: string): { base: string; suffix: string } {
  const m = /^([URFDLB]w|[URFDLBMESxyzurfdlb])(.*)$/.exec(text);
  return m ? { base: m[1], suffix: m[2] } : { base: text, suffix: '' };
}

function invertSuffix(suffix: string): string {
  switch (suffix) {
    case '':
      return "'";
    case "'":
      return '';
    case '3':
      return "3'";
    case "3'":
      return '3';
    default:
      return suffix; // double turns are their own mirror image
  }
}

export function mirrorMove(move: Move): Move {
  const swapped = SWAP[move.base];
  const { base: spelled, suffix } = splitText(move.text);
  if (KEEP.has(move.base)) return move;
  if (swapped) {
    const amount = (Math.abs(move.amount) === 2 ? move.amount : -move.amount) as MoveAmount;
    return { base: swapped, amount, text: `${SPELLING[spelled] ?? swapped}${invertSuffix(suffix)}` };
  }
  const amount = (Math.abs(move.amount) === 2 ? move.amount : -move.amount) as MoveAmount;
  return { base: move.base, amount, text: `${spelled}${invertSuffix(suffix)}` };
}

export function mirrorMoves(moves: readonly Move[]): Move[] {
  return moves.map(mirrorMove);
}

function mirrorNodes(nodes: readonly AlgNode[]): string[] {
  return nodes.map((n) => (n.kind === 'move' ? mirrorMove(n.move).text : `(${mirrorNodes(n.children).join(' ')})`));
}

/** Mirrors an algorithm string across the L/R plane, preserving trigger groupings. */
export function mirrorAlgorithm(source: string): string {
  return mirrorNodes(parseAlgorithm(source).nodes).join(' ');
}
