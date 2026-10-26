import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { CommentRow, useArticleComments } from '@/components/nikonyu/comment';
import { CheckCircleIcon, Fukumaru, SendIcon, StampFace } from '@/components/nikonyu/icons';
import { BackHeader, Page, text, Thumb } from '@/components/nikonyu/ui';
import { C, CATEGORIES, fonts, STAMPS } from '@/constants/nikonyu';
import { findArticle, type Article } from '@/data/articles';
import { suggestGentler } from '@/lib/tone';
import { useNikonyu } from '@/state/nikonyu-store';

const MAX_LENGTH = 60;

export default function CommentsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const article = findArticle(id);
  if (!article) {
    return (
      <Page>
        <BackHeader />
        <View style={styles.missing}>
          <Fukumaru pose="oops" size={96} />
          <Text style={text.bold}>あれれ、記事が見つかりませんでした</Text>
        </View>
      </Page>
    );
  }
  return <CommentsContent key={article.id} article={article} />;
}

function CommentsContent({ article }: { article: Article }) {
  const { report, stamps } = useNikonyu();
  const comments = useArticleComments(article);
  const [toast, setToast] = useState<string | null>(null);
  const picked = stamps[article.id] ?? {};

  return (
    <Page footer={<Composer article={article} onPosted={() => setToast('ひとことを投稿しました')} />}>
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
            <Text style={styles.stampChipText}>{(article.stamps[s.kind] + (picked[s.kind] ? 1 : 0)).toLocaleString('ja-JP')}</Text>
          </View>
        ))}
      </View>

      <View style={styles.notice}>
        <Fukumaru size={36} />
        <Text style={styles.noticeText}>ここは、やさしいひとことの場所です。投稿の前に、ふくまるが言葉づかいをそっと確認します。</Text>
      </View>

      {toast ? (
        <View style={styles.toast}>
          <CheckCircleIcon size={18} />
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      ) : null}

      <View style={styles.list}>
        {comments.map((c) => (
          <CommentRow
            key={c.id}
            item={c}
            onReport={() => {
              report(c.id);
              setToast('教えてくれてありがとう。運営が確認します');
            }}
          />
        ))}
      </View>
    </Page>
  );
}

function Composer({ article, onPosted }: { article: Article; onPosted: () => void }) {
  const { profile, addComment } = useNikonyu();
  const [draft, setDraft] = useState('');
  const [suggestion, setSuggestion] = useState<string | null>(null);

  if (!profile) {
    return (
      <View style={styles.composer}>
        <View style={styles.loginPrompt}>
          <Text style={text.bold}>ひとことを書くには、LINEでログインしてください</Text>
          <Text style={text.small}>読むこととスタンプは、ログインなしで使えます</Text>
          <Pressable accessibilityRole="button" onPress={() => router.push('/login')} style={styles.lineButton}>
            <Text style={styles.lineButtonText}>LINEでログイン</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const send = () => {
    const t = draft.trim();
    if (!t) return;
    const gentler = suggestGentler(t);
    if (gentler) {
      setSuggestion(gentler);
      return;
    }
    addComment(article.id, t);
    setDraft('');
    setSuggestion(null);
    onPosted();
  };

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
          <Text style={styles.suggestBody}>{suggestion}</Text>
          <View style={styles.suggestButtons}>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setDraft(suggestion.slice(0, MAX_LENGTH));
                setSuggestion(null);
              }}
              style={[styles.pill, styles.pillDark]}>
              <Text style={styles.pillDarkText}>この言い方にする</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => setSuggestion(null)} style={[styles.pill, styles.pillLine]}>
              <Text style={styles.pillLineText}>自分で書き直す</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <View style={styles.composerMeta}>
        <View style={styles.me}>
          {profile.picture ? <Image source={profile.picture} style={styles.meImage} contentFit="cover" /> : null}
          <Text style={text.small}>{profile.name}（LINEでログイン中）</Text>
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
          style={styles.input}
        />
        <Pressable accessibilityRole="button" accessibilityLabel="送る" onPress={send} style={styles.send}>
          <SendIcon />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  missing: { alignItems: 'center', gap: 12, paddingTop: 80 },
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
  toastText: { fontFamily: fonts.body, fontSize: 13, fontWeight: '700', color: '#1F6B3A' },
  list: { paddingHorizontal: 16, paddingTop: 4 },
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
  send: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.sun,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
