import { parseAlgorithm } from './parser';
import type { AlgNode, Move, MoveAmount } from './types';

function suffixFor(amount: MoveAmount, original?: string): string {
  switch (amount) {
    case 1:
      return '';
    case -1:
      return "'";
    case 2:
      return '2';
    case -2:
      // Preserve the author's style when inverting a 2 into 2' would be noise.
      return original?.endsWith("2'") ? "2'" : '2';
  }
}

/** Extracts the base spelling (e.g. `Rw`, `r`, `M`) from a move's display text. */
function baseText(move: Move): string {
  const m = /^([URFDLB]w|[URFDLBMESxyzurfdlb])/.exec(move.text);
  return m ? m[1] : move.base;
}

export function formatMove(base: string, amount: MoveAmount): string {
  return `${base}${suffixFor(amount)}`;
}

export function invertMove(move: Move): Move {
  const amount = (move.amount === 2 || move.amount === -2 ? move.amount : -move.amount) as MoveAmount;
  return { base: move.base, amount, text: formatMove(baseText(move), amount) };
}

/** Reverses the order and inverts every move. */
export function invertMoves(moves: readonly Move[]): Move[] {
  return moves.slice().reverse().map(invertMove);
}

function invertNodes(nodes: readonly AlgNode[]): string[] {
  return nodes
    .slice()
    .reverse()
    .map((n) =>
      n.kind === 'move' ? invertMove(n.move).text : `(${invertNodes(n.children).join(' ')})`,
    );
}

/** Inverts an algorithm string, preserving trigger groupings. */
export function invertAlgorithm(source: string): string {
  return invertNodes(parseAlgorithm(source).nodes).join(' ');
}

export function movesToString(moves: readonly Move[]): string {
  return moves.map((m) => m.text).join(' ');
}
