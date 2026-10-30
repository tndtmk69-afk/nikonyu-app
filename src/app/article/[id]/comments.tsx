import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { CommentRow } from '@/components/nikonyu/comment';
import { CheckCircleIcon, Fukumaru, SendIcon, StampFace } from '@/components/nikonyu/icons';
import { BackHeader, LoadState, Page, text, Thumb } from '@/components/nikonyu/ui';
import { C, CATEGORIES, fonts, STAMPS } from '@/constants/nikonyu';
import { api, useApi } from '@/lib/api';
import type { ApiArticle, ApiComment, ArticleDetailResponse, PostCommentResponse } from '@/lib/api-types';
import { setSession, useSession } from '@/state/nikonyu-store';

const MAX_LENGTH = 60;

export default function CommentsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const detail = useApi<ArticleDetailResponse>(`/api/articles/${id}`);
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);

  if (!detail.data) {
    return (
      <Page>
        <BackHeader />
        <LoadState error={detail.error} onRetry={detail.reload} />
      </Page>
    );
  }

  const { article, comments } = detail.data;

  const toggleThanks = (c: ApiComment) => {
    const flip = (d: ArticleDetailResponse): ArticleDetailResponse => ({
      ...d,
      comments: d.comments.map((x) =>
        x.id === c.id ? { ...x, thankedByMe: !x.thankedByMe, thanks: x.thanks + (x.thankedByMe ? -1 : 1) } : x
      ),
    });
    detail.mutate(flip);
    api('/api/thanks', { method: 'POST', body: { commentId: c.id } }).catch((e: Error) => {
      detail.mutate(flip);
      setToast({ text: e.message, error: true });
    });
  };

  const report = (c: ApiComment) => {
    detail.mutate((d) => ({ ...d, comments: d.comments.filter((x) => x.id !== c.id) }));
    setToast({ text: '教えてくれてありがとう。運営が確認します' });
    api('/api/reports', { method: 'POST', body: { commentId: c.id } }).catch((e: Error) => {
      detail.reload();
      setToast({ text: e.message, error: true });
    });
  };

  const onPosted = (comment: ApiComment) => {
    detail.mutate((d) => ({ ...d, comments: [comment, ...d.comments] }));
    setToast({ text: 'ひとことを投稿しました' });
  };

  return (
    <Page footer={<Composer article={article} sample={detail.data.sample} onPosted={onPosted} />}>
      <BackHeader title={`みんなのひとこと　${comments.length}件`} />

      <Pressable accessibilityRole="link" onPress={() => router.back()} style={styles.ref}>
        <Thumb article={article} size={56} />
        <View style={styles.refBody}>
          <Text style={[styles.refMeta, { color: CATEGORIES[article.category].fg }]}>
            {CATEGORIES[article.category].label} ・ {article.region}
          </Text>
          <Text style={styles.refTitle}>{article.title}</Text>
        </View>
      </Pressable>

      <View style={styles.stampRow}>
        {STAMPS.map((s) => (
          <View key={s.kind} style={styles.stampChip}>
            <StampFace kind={s.kind} size={22} />
            <Text style={styles.stampChipText}>{article.stamps[s.kind].toLocaleString('ja-JP')}</Text>
          </View>
        ))}
      </View>

      <View style={styles.notice}>
        <Fukumaru size={36} />
        <Text style={styles.noticeText}>ここは、やさしいひとことの場所です。投稿の前に、ふくまるが言葉づかいをそっと確認します。</Text>
      </View>

      {toast ? (
        <View style={[styles.toast, toast.error && styles.toastError]}>
          {toast.error ? null : <CheckCircleIcon size={18} />}
          <Text style={[styles.toastText, toast.error && styles.toastErrorText]}>{toast.text}</Text>
        </View>
      ) : null}

      <View style={styles.list}>
        {comments.length === 0 ? <Text style={[text.small, styles.empty]}>まだひとことはありません。最初のひとことをどうぞ。</Text> : null}
        {comments.map((c) => (
          <CommentRow key={c.id} item={c} onThanks={() => toggleThanks(c)} onReport={() => report(c)} />
        ))}
      </View>
    </Page>
  );
}

function Composer({ article, sample, onPosted }: { article: ApiArticle; sample: boolean; onPosted: (c: ApiComment) => void }) {
  const session = useSession();
  const [draft, setDraft] = useState('');
  const [suggestion, setSuggestion] = useState<{ text: string; byAi: boolean } | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // データベースを入れる前にログインした人は、サーバーのセッションを持っていないので、ログインし直してもらう
  if (!session || (!session.token && !sample)) {
    return (
      <View style={styles.composer}>
        <View style={styles.loginPrompt}>
          <Text style={text.bold}>{session ? 'もう一度LINEでログインしてください' : 'ひとことを書くには、LINEでログインしてください'}</Text>
          <Text style={text.small}>読むこととスタンプは、ログインなしで使えます</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              if (session) setSession(null);
              router.push('/login');
            }}
            style={styles.lineButton}>
            <Text style={styles.lineButtonText}>LINEでログイン</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const send = async () => {
    const t = draft.trim();
    if (!t || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await api<PostCommentResponse>('/api/comments', { method: 'POST', body: { articleId: article.id, text: t } });
      if (res.status === 'suggest') {
        setSuggestion({ text: res.suggestion, byAi: res.byAi });
      } else {
        setDraft('');
        setSuggestion(null);
        onPosted(res.comment);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  const disabled = sample || !session.token;

  return (
    <View style={styles.composer}>
      {suggestion ? (
        <View style={styles.suggest}>
          <View style={styles.suggestHead}>
            <Fukumaru pose="oops" size={44} />
            <View style={styles.suggestHeadText}>
              <Text style={styles.suggestTitle}>ふくまるからの提案</Text>
              <Text style={[text.small, { color: C.brownInk }]}>少しトゲが伝わるかもしれない言葉がありました。こう書くと、気持ちがまっすぐ届きそうです。</Text>
            </View>
          </View>
          <Text style={styles.suggestBody}>{suggestion.text}</Text>
          <View style={styles.suggestButtons}>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setDraft(suggestion.text.slice(0, MAX_LENGTH));
                setSuggestion(null);
              }}
              style={[styles.pill, styles.pillDark]}>
              <Text style={styles.pillDarkText}>この言い方にする</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => setSuggestion(null)} style={[styles.pill, styles.pillLine]}>
              <Text style={styles.pillLineText}>自分で書き直す</Text>
            </Pressable>
          </View>
          {suggestion.byAi ? null : <Text style={text.tiny}>※ AIが使えないため、簡易チェックで提案しています</Text>}
        </View>
      ) : null}

      {disabled ? (
        <Text style={styles.errorText}>データベースが未設定のため、今はひとことを保存できません</Text>
      ) : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.composerMeta}>
        <View style={styles.me}>
          {session.profile.picture ? <Image source={session.profile.picture} style={styles.meImage} contentFit="cover" /> : null}
          <Text style={text.small}>{session.profile.name}（LINEでログイン中）</Text>
        </View>
        <Text style={text.small}>
          {draft.length} / {MAX_LENGTH}
        </Text>
      </View>
      <View style={styles.inputRow}>
        <TextInput
          accessibilityLabel="ひとこと"
          value={draft}
          onChangeText={(t) => {
            setDraft(t);
            setSuggestion(null);
          }}
          placeholder={`ひとことどうぞ（${MAX_LENGTH}文字まで）`}
          placeholderTextColor="#8B8590"
          maxLength={MAX_LENGTH}
          multiline
          editable={!disabled}
          style={styles.input}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="送る"
          disabled={disabled || sending}
          onPress={send}
          style={[styles.send, (disabled || sending) && styles.sendDisabled]}>
          {sending ? <ActivityIndicator color="#2A2730" /> : <SendIcon />}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ref: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    padding: 10,
    borderRadius: 18,
    backgroundColor: C.card,
    shadowColor: '#2A2730',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  refBody: { flex: 1, gap: 2 },
  refMeta: { fontFamily: fonts.body, fontSize: 11, fontWeight: '700' },
  refTitle: { fontFamily: fonts.body, fontSize: 13, fontWeight: '700', lineHeight: 20, color: C.ink },
  stampRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 16, paddingTop: 14 },
  stampChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingLeft: 5,
    paddingRight: 11,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: '#FFFFFF',
  },
  stampChipText: { fontFamily: fonts.body, fontSize: 12, fontWeight: '700', color: C.ink },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginTop: 14, padding: 10, paddingHorizontal: 14, borderRadius: 14, backgroundColor: C.sunTint },
  noticeText: { flex: 1, fontFamily: fonts.body, fontSize: 12, lineHeight: 19, color: C.brownInk },
  toast: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginTop: 12, padding: 10, paddingHorizontal: 14, borderRadius: 14, backgroundColor: C.goodTint },
  toastError: { backgroundColor: '#FBEBEB' },
  toastText: { flex: 1, fontFamily: fonts.body, fontSize: 13, fontWeight: '700', color: '#1F6B3A' },
  toastErrorText: { color: C.danger },
  list: { paddingHorizontal: 16, paddingTop: 4 },
  empty: { paddingVertical: 16 },
  composer: { borderTopWidth: 1, borderTopColor: C.line, backgroundColor: '#FFFFFF', padding: 16, paddingBottom: 20, gap: 12 },
  loginPrompt: { alignItems: 'center', gap: 6 },
  lineButton: { alignSelf: 'stretch', minHeight: 50, borderRadius: 999, backgroundColor: C.lineGreen, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  lineButtonText: { fontFamily: fonts.body, fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  suggest: { backgroundColor: C.sunTint, borderRadius: 22, padding: 14, paddingHorizontal: 16, gap: 10 },
  suggestHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  suggestHeadText: { flex: 1, gap: 2 },
  suggestTitle: { fontFamily: fonts.rounded, fontWeight: '800', fontSize: 14, color: C.ink },
  suggestBody: { fontFamily: fonts.body, fontSize: 14, lineHeight: 24, color: C.ink, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 12, paddingHorizontal: 14, overflow: 'hidden' },
  suggestButtons: { flexDirection: 'row', gap: 8 },
  pill: { flex: 1, minHeight: 44, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  pillDark: { backgroundColor: C.ink },
  pillDarkText: { fontFamily: fonts.body, fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  pillLine: { borderWidth: 1.5, borderColor: C.ink },
  pillLineText: { fontFamily: fonts.body, fontSize: 13, fontWeight: '700', color: C.ink },
  errorText: { fontFamily: fonts.body, fontSize: 12, lineHeight: 18, color: C.danger },
  composerMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  me: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  meImage: { width: 24, height: 24, borderRadius: 12 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  input: {
    flex: 1,
    minHeight: 56,
    maxHeight: 120,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E6DECF',
    backgroundColor: C.bg,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 22,
    color: C.ink,
  },
  send: { width: 52, height: 52, borderRadius: 26, backgroundColor: C.sun, alignItems: 'center', justifyContent: 'center' },
  sendDisabled: { opacity: 0.4 },
});
