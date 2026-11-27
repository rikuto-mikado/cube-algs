import type { LearningStatus } from '../../types';

export const STATUS_META: Readonly<Record<LearningStatus, { label: string; dot: string; text: string }>> = {
  unseen: { label: 'Unseen', dot: 'bg-zinc-600', text: 'text-zinc-400' },
  learning: { label: 'Learning', dot: 'bg-amber-400', text: 'text-amber-300' },
  mastered: { label: 'Mastered', dot: 'bg-emerald-400', text: 'text-emerald-300' },
};

