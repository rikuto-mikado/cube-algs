import type { LearningStatus } from '../../types';
import { STATUS_META } from './statusMeta';

export function StatusDot({ status }: { status: LearningStatus }) {
  return <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${STATUS_META[status].dot}`} aria-hidden />;
}
