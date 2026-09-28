'use client';

import { useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Database } from '@/lib/types';

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';
export type SaveCms = (next: Database, message?: string) => Promise<boolean>;
export const saveLabel = (state: SaveState, idle = '저장') =>
  ({ idle, saving: '저장중...', saved: '저장완료', error: '저장 실패 · 재시도' })[state];

export function useCmsSave(setDb: Dispatch<SetStateAction<Database | null>>) {
  const [state, setState] = useState<SaveState>('idle');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const queue = useRef<Promise<boolean>>(Promise.resolve(true));
  const pending = useRef<{ payload: string; task: Promise<boolean> } | null>(null);
  const reset = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (reset.current) clearTimeout(reset.current); }, []);

  const save: SaveCms = (next, message = '저장완료') => {
    // The ref closes the gap before React renders a disabled button.
    const payload = JSON.stringify(next);
    if (pending.current?.payload === payload) return pending.current.task;
    if (reset.current) clearTimeout(reset.current);
    setDb(next);
    setState('saving');
    setNotice('');
    setError('');

    const task = queue.current.catch(() => false).then(async () => {
      try {
        const response = await fetch('/api/admin/data', {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: payload,
        });
        if (!response.ok) {
          const body = await response.json().catch(() => null);
          throw new Error(body?.error || `저장하지 못했습니다. (${response.status})`);
        }
        if (pending.current?.task !== task) return true;
        // Only acknowledge the latest save after reading back the persisted data.
        const fresh = await fetch('/api/admin/data', { cache: 'no-store' });
        if (!fresh.ok) throw new Error('저장 결과를 확인하지 못했습니다. 다시 시도해주세요.');
        const persisted: Database = await fresh.json();
        if (pending.current?.task === task) {
          setDb(persisted);
          setState('saved');
          setNotice(message);
          reset.current = setTimeout(() => { setState('idle'); setNotice(''); }, 1800);
        }
        return true;
      } catch (cause) {
        if (pending.current?.task === task) {
          setState('error');
          setNotice('');
          setError(cause instanceof Error ? cause.message : '저장하지 못했습니다. 다시 시도해주세요.');
          try {
            const fresh = await fetch('/api/admin/data', { cache: 'no-store' });
            if (fresh.ok) {
              const persisted: Database = await fresh.json();
              if (pending.current?.task === task) setDb(persisted);
            }
          } catch { /* Keep the visible error if the server cannot be reached. */ }
        }
        return false;
      } finally {
        if (pending.current?.task === task) pending.current = null;
      }
    });
    pending.current = { payload, task };
    queue.current = task;
    return task;
  };

  return { save, state, notice, error };
}
