import { useEffect, useState } from 'react';
import type { LessonFigure } from './model';

export type InlineFigure = LessonFigure & { source: number };
const blocks = import.meta.glob<{ default: Record<string, InlineFigure[]> }>('./content/figures/block-*.json');

export function useLessonFigures(block: number, lesson: string) {
  const [figures, setFigures] = useState<InlineFigure[]>([]);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    setFailed(false);
    setFigures([]);
    blocks[`./content/figures/block-${block}.json`]().then(({ default: lessons }) => {
      if (active) setFigures(lessons[lesson] ?? []);
    }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [block, lesson, retry]);

  return { figures, failed, retry: () => setRetry(value => value + 1) };
}
