import { NotationError, parseAlgorithm, type NotationErrorCode } from './parser';
import type { ParsedAlgorithm } from './types';

export type ValidationResult =
  | { readonly ok: true; readonly parsed: ParsedAlgorithm }
  | {
      readonly ok: false;
      readonly reason: 'empty' | 'syntax';
      /** Machine-readable cause, for localised messages. */
      readonly code: NotationErrorCode | 'empty' | 'too-long';
      /** Offending token (or the limit for `too-long`). */
      readonly token: string;
      /** English fallback message. */
      readonly message: string;
      /** Character offset of the problem in the (normalised) source, or -1. */
      readonly position: number;
    };

/** Maximum number of atomic moves accepted from user input (keeps the player responsive). */
export const MAX_CUSTOM_MOVES = 200;

/**
 * Validates free-form user notation for the sandbox. Never throws: returns
 * either the parsed algorithm or a structured, displayable error.
 */
export function validateAlgorithm(source: string): ValidationResult {
  const empty = { ok: false, reason: 'empty', code: 'empty', token: '', message: 'Enter some moves', position: -1 } as const;
  if (source.trim() === '') return empty;
  try {
    const parsed = parseAlgorithm(source);
    if (parsed.moves.length === 0) return empty;
    if (parsed.moves.length > MAX_CUSTOM_MOVES) {
      return {
        ok: false,
        reason: 'syntax',
        code: 'too-long',
        token: String(MAX_CUSTOM_MOVES),
        message: `Too many moves (max ${MAX_CUSTOM_MOVES})`,
        position: -1,
      };
    }
    return { ok: true, parsed };
  } catch (e) {
    if (e instanceof NotationError) {
      return { ok: false, reason: 'syntax', code: e.code, token: e.token, message: e.message, position: e.position };
    }
    throw e;
  }
}
