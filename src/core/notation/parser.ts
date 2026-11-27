import type { AlgNode, Move, MoveAmount, MoveBase, ParsedAlgorithm } from './types';

export type NotationErrorCode = 'unrecognised' | 'unexpected' | 'missing' | 'empty-group';

export class NotationError extends Error {
  readonly position: number;
  readonly code: NotationErrorCode;
  /** The offending (or expected) text, for display. */
  readonly token: string;
  constructor(message: string, position: number, code: NotationErrorCode, token = '') {
    super(`${message} (at position ${position})`);
    this.name = 'NotationError';
    this.position = position;
    this.code = code;
    this.token = token;
  }
}

const WCA_WIDE: Readonly<Record<string, MoveBase>> = {
  Uw: 'u',
  Dw: 'd',
  Lw: 'l',
  Rw: 'r',
  Fw: 'f',
  Bw: 'b',
};

// Base move, then optional modifiers: 2, 2', '2, ', 3, 3'
const MOVE_RE = /^([URFDLB]w|[URFDLBMESxyzurfdlb])(2'|'2|2|3'|3|')?/;

function amountFromSuffix(suffix: string | undefined): MoveAmount {
  switch (suffix) {
    case undefined:
    case '':
      return 1;
    case "'":
    case '3':
      return -1;
    case "3'":
      return 1;
    case '2':
      return 2;
    case "2'":
    case "'2":
      return -2;
    default:
      throw new Error(`Unknown suffix ${suffix}`);
  }
}

/** Normalises typographic apostrophes and other look-alikes. */
function normalize(src: string): string {
  return src.replace(/[’‘`´′]/g, "'");
}

/**
 * Parses a WCA/Singmaster notation string. Parentheses/brackets are kept as
 * display groups while the move list is flattened for execution.
 */
export function parseAlgorithm(source: string): ParsedAlgorithm {
  const src = normalize(source);
  const moves: Move[] = [];
  let i = 0;

  const parseSequence = (closer: string | null): AlgNode[] => {
    const nodes: AlgNode[] = [];
    while (i < src.length) {
      const ch = src[i];
      if (/\s/.test(ch)) {
        i++;
        continue;
      }
      if (ch === '(' || ch === '[') {
        const start = i;
        i++;
        const children = parseSequence(ch === '(' ? ')' : ']');
        if (children.length === 0) throw new NotationError('Empty group', start, 'empty-group');
        nodes.push({ kind: 'group', children });
        continue;
      }
      if (ch === ')' || ch === ']') {
        if (closer !== ch) throw new NotationError(`Unexpected "${ch}"`, i, 'unexpected', ch);
        i++;
        return nodes;
      }
      const m = MOVE_RE.exec(src.slice(i));
      if (!m) {
        const token = /^\S+/.exec(src.slice(i))?.[0].slice(0, 6) ?? src[i];
        throw new NotationError(`Unrecognised token "${token}"`, i, 'unrecognised', token);
      }
      const rawBase = m[1];
      const base: MoveBase = WCA_WIDE[rawBase] ?? (rawBase as MoveBase);
      const move: Move = { base, amount: amountFromSuffix(m[2]), text: m[0] };
      nodes.push({ kind: 'move', move, index: moves.length });
      moves.push(move);
      i += m[0].length;
    }
    if (closer !== null) throw new NotationError(`Missing "${closer}"`, i, 'missing', closer);
    return nodes;
  };

  const nodes = parseSequence(null);
  return { source, nodes, moves };
}

/** Convenience: parse and return just the flat move list. */
export function parseMoves(source: string): Move[] {
  return [...parseAlgorithm(source).moves];
}
