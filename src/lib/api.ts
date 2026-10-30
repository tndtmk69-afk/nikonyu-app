import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { getDeviceId, getSession, setSession, useSession } from '@/state/nikonyu-store';

// サーバー（src/app/api）を呼ぶ。ログイン中ならセッション、未ログインなら端末IDを付ける
export async function api<T>(path: string, init?: { method?: 'GET' | 'POST'; body?: unknown }): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', 'X-Device-Id': getDeviceId() };
  const session = getSession();
  if (session?.token) headers.Authorization = `Bearer ${session.token}`;

  const res = await fetch(path, {
    method: init?.method ?? 'GET',
    headers,
    body: init?.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  // セッションの期限が切れていたら、ログインし直してもらう
  if (res.status === 401 && session?.token) setSession(null);
  if (!res.ok) throw new Error(data.error ?? `通信に失敗しました（${res.status}）`);
  return data;
}

// 画面を開いたときにデータを読み込む。ログイン状態が変わったら読み直す
export function useApi<T>(path: string) {
  const session = useSession();
  const [nonce, setNonce] = useState(0);
  const key = `${path}#${nonce}#${session?.token ?? ''}`;
  const [state, setState] = useState<{ key: string; path: string; data?: T; error?: string }>({ key: '', path: '' });

  useEffect(() => {
    let alive = true;
    api<T>(path)
      .then((data) => alive && setState({ key, path, data }))
      .catch((e: Error) => alive && setState({ key, path, error: e.message }));
    return () => {
      alive = false;
    };
  }, [key, path]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  // 押した直後に画面へ反映する（サーバーの結果を待たない）
  const mutate = useCallback((fn: (data: T) => T) => setState((s) => (s.data ? { ...s, data: fn(s.data) } : s)), []);

  // ほかの画面から戻ってきたら読み直す（最初に開いたときは上の useEffect が読むので飛ばす）
  const firstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      reload();
    }, [reload])
  );

  const samePath = state.path === path;
  return {
    data: samePath ? state.data : undefined,
    error: samePath && state.key === key ? state.error : undefined,
    loading: state.key !== key,
    reload,
    mutate,
  };
}
