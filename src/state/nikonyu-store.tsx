import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react';

import type { StampKind } from '@/constants/nikonyu';
import type { LineProfile } from '@/lib/line-auth';

// 試作では端末の中だけで状態を持つ（読み込み直すと元に戻る）。本番ではサーバーに保存する。

export type PostedComment = {
  id: string;
  articleId: string;
  author: string;
  text: string;
  createdAt: number;
};

type Store = {
  profile: LineProfile | null;
  setProfile: (p: LineProfile | null) => void;
  read: Record<string, true>;
  markRead: (articleId: string) => void;
  stamps: Record<string, Partial<Record<StampKind, true>>>;
  toggleStamp: (articleId: string, kind: StampKind) => void;
  thanked: Record<string, true>;
  toggleThanks: (commentId: string) => void;
  reported: Record<string, true>;
  report: (commentId: string) => void;
  posted: PostedComment[];
  addComment: (articleId: string, text: string) => void;
};

const StoreContext = createContext<Store | null>(null);

export function NikonyuProvider({ children }: PropsWithChildren) {
  const [profile, setProfile] = useState<LineProfile | null>(null);
  const [read, setRead] = useState<Record<string, true>>({});
  const [stamps, setStamps] = useState<Store['stamps']>({});
  const [thanked, setThanked] = useState<Record<string, true>>({});
  const [reported, setReported] = useState<Record<string, true>>({});
  const [posted, setPosted] = useState<PostedComment[]>([]);

  const value = useMemo<Store>(
    () => ({
      profile,
      setProfile,
      read,
      markRead: (id) => setRead((r) => (r[id] ? r : { ...r, [id]: true })),
      stamps,
      toggleStamp: (id, kind) =>
        setStamps((s) => {
          const current = { ...s[id] };
          if (current[kind]) delete current[kind];
          else current[kind] = true;
          return { ...s, [id]: current };
        }),
      thanked,
      toggleThanks: (cid) =>
        setThanked((t) => {
          const next = { ...t };
          if (next[cid]) delete next[cid];
          else next[cid] = true;
          return next;
        }),
      reported,
      report: (cid) => setReported((r) => ({ ...r, [cid]: true })),
      posted,
      addComment: (articleId, text) =>
        setPosted((p) => [
          { id: `posted-${Date.now()}`, articleId, author: profile?.name ?? 'あなた', text, createdAt: Date.now() },
          ...p,
        ]),
    }),
    [profile, read, stamps, thanked, reported, posted]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useNikonyu() {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useNikonyu は NikonyuProvider の中で使ってください');
  return store;
}
