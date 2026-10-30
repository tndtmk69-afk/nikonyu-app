import * as Crypto from 'expo-crypto';
import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

import type { LineProfile } from '@/lib/line-auth';

// 端末に残しておく小さな状態（ログイン、既読、端末ID）。
// Webでは localStorage に保存して、読み込み直しても消えないようにする。スマホでは今はメモリだけ。
// 記事・スタンプ・ひとことはサーバー（Supabase）に保存する。

function createPersisted<T>(key: string, initial: T) {
  let value = initial;
  let loaded = false;
  const listeners = new Set<() => void>();
  const canStore = () => Platform.OS === 'web' && typeof window !== 'undefined';

  const load = () => {
    if (loaded || !canStore()) return;
    loaded = true;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) value = JSON.parse(raw) as T;
    } catch {
      // 保存領域が使えないときはメモリだけで動く
    }
  };

  return {
    get: () => {
      load();
      return value;
    },
    set: (next: T) => {
      load();
      value = next;
      if (canStore()) {
        try {
          window.localStorage.setItem(key, JSON.stringify(next));
        } catch {
          // 同上
        }
      }
      listeners.forEach((l) => l());
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    initial,
  };
}

type Persisted<T> = ReturnType<typeof createPersisted<T>>;

// Webのサーバー描画では初期値、ブラウザでは保存した値を使う
function usePersisted<T>(store: Persisted<T>) {
  return useSyncExternalStore(store.subscribe, store.get, () => store.initial);
}

export type Session = { token: string | null; profile: LineProfile };

const sessionStore = createPersisted<Session | null>('nikonyu.session', null);
const readStore = createPersisted<Record<string, true>>('nikonyu.read', {});
const deviceStore = createPersisted<string | null>('nikonyu.device', null);

export const useSession = () => usePersisted(sessionStore);
export const getSession = () => sessionStore.get();
export const setSession = (s: Session | null) => sessionStore.set(s);

export const useRead = () => usePersisted(readStore);
export function markRead(articleId: string) {
  const current = readStore.get();
  if (!current[articleId]) readStore.set({ ...current, [articleId]: true });
}

// ログインしていない人のスタンプや「ありがとう」を区別するための端末ID（初めて使うときに作る）
export function getDeviceId() {
  let id = deviceStore.get();
  if (!id) {
    id = Crypto.randomUUID();
    deviceStore.set(id);
  }
  return id;
}
