import type { MaskMode } from '../core/cube/masking';

export type Stage = 'F2L' | 'OLL' | 'PLL';
export const STAGES: readonly Stage[] = ['F2L', 'OLL', 'PLL'];

export type Language = 'en' | 'ja';
export const LANGUAGES: readonly Language[] = ['en', 'ja'];

/** Text available in every supported UI language. */
export type LocalizedText = Readonly<Record<Language, string>>;

export interface AlgorithmCase {
  /** Stable unique slug, e.g. `pll-t`, `oll-21`, `f2l-01`. */
  readonly id: string;
  readonly stage: Stage;
  readonly name: string;
  readonly category: string;
  /** Viable move sequences; the first is the recommended default. */
  readonly algorithms: readonly string[];
  /** Optional extra pre-orientation applied to the solved cube before `inverse(alg)`. */
  readonly setupMoves?: string;
  readonly recognition?: LocalizedText;
  readonly maskMode: MaskMode;
}

export type LearningStatus = 'unseen' | 'learning' | 'mastered';

export type ColorSchemeId = 'western' | 'highContrast';

/** Smooth: moves flow back-to-back. Cadence: a short beat between consecutive moves. */
export type PlaybackCadence = 'smooth' | 'cadence';

export type DiagramSource = 'setup' | 'live';

export type AppMode = 'learn' | 'drill' | 'sandbox';

export interface PlaybackPreferences {
  readonly speed: number;
  readonly loop: boolean;
  readonly cadence: PlaybackCadence;
  readonly showAllColors: boolean;
  /** Focused F2L mask: only the cross and the target pair in colour. */
  readonly f2lFocus: boolean;
  /** Practise every algorithm mirrored across the L/R plane. */
  readonly mirror: boolean;
  /** Diagram overlay expanded (true) or collapsed. */
  readonly showDiagram: boolean;
  readonly diagramSource: DiagramSource;
  readonly colorScheme: ColorSchemeId;
  readonly language: Language;
}

export type { MaskMode };
