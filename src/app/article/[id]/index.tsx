import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CommentRow, useArticleComments } from '@/components/nikonyu/comment';
import { ChatIcon, ChevronIcon, Fukumaru, StampFace } from '@/components/nikonyu/icons';
import { Scene } from '@/components/nikonyu/scene';
import { BackHeader, CategoryChip, Page, text, Thumb } from '@/components/nikonyu/ui';
import { C, CATEGORIES, fonts, STAMPS } from '@/constants/nikonyu';
import { findArticle, TODAY, type Article } from '@/data/articles';
import { useNikonyu } from '@/state/nikonyu-store';

export default function ArticleScreen() {
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
  return <ArticleContent key={article.id} article={article} />;
}

function ArticleContent({ article }: { article: Article }) {
  const { markRead, stamps, toggleStamp, read } = useNikonyu();
  const comments = useArticleComments(article);

  useEffect(() => {
    markRead(article.id);
  }, [article.id, markRead]);

  const todayIndex = TODAY.findIndex((a) => a.id === article.id);
  const next = TODAY.find((a, i) => i > todayIndex && !read[a.id]) ?? TODAY.find((a) => !read[a.id] && a.id !== article.id);
  const picked = stamps[article.id] ?? {};

  return (
    <Page>
      <BackHeader title={todayIndex >= 0 ? `今日のにこにゅー　${todayIndex + 1} / ${TODAY.length}` : CATEGORIES[article.category].label} />

      <View style={styles.hero}>
        <Scene name={article.scene} width="100%" height={230} />
      </View>
      <Text style={[text.tiny, styles.caption]}>写真はイメージです（{article.sceneCaption.replace(/^イメージ：/, '')}）</Text>

      <View style={styles.article}>
        <View style={styles.metaRow}>
          <CategoryChip id={article.category} large />
          <Text style={text.small}>
            {article.region} ・ {article.minutes}分で読める
          </Text>
        </View>
        <Text style={styles.title}>{article.title}</Text>

        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>3行でいうと</Text>
          {article.summary.map((s, i) => (
            <View key={s} style={styles.summaryRow}>
              <Text style={styles.summaryNum}>{i + 1}.</Text>
              <Text style={styles.summaryText}>{s}</Text>
            </View>
          ))}
        </View>

        {article.body.map((p) => (
          <Text key={p} style={text.body}>
            {p}
          </Text>
        ))}

        <View style={styles.source}>
          <Text style={text.small}>元記事：{article.source}</Text>
          <Text style={text.small}>翻訳・要約：にこにゅー編集部</Text>
        </View>
      </View>

      <View style={styles.stampBox}>
        <View style={styles.stampHead}>
          <Text style={text.h2}>この記事、どうでした？</Text>
          <Text style={text.tiny}>ログインなしで押せます</Text>
        </View>
        <View style={styles.stampGrid}>
          {STAMPS.map((s) => {
            const on = !!picked[s.kind];
            return (
              <Pressable
                key={s.kind}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                onPress={() => toggleStamp(article.id, s.kind)}
                style={[styles.stamp, on && { backgroundColor: s.tint, borderColor: s.ring }]}>
                <StampFace kind={s.kind} size={on ? 48 : 42} />
                <Text style={styles.stampLabel}>{s.label}</Text>
                <Text style={[text.tiny, on && styles.stampCountOn]}>
                  {(article.stamps[s.kind] + (on ? 1 : 0)).toLocaleString('ja-JP')}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.comments}>
        <View style={styles.commentsHead}>
          <Text style={text.h2}>みんなのひとこと</Text>
          <Text style={text.small}>{comments.length}件</Text>
        </View>
        {comments.slice(0, 2).map((c) => (
          <CommentRow key={c.id} item={c} compact />
        ))}
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push({ pathname: '/article/[id]/comments', params: { id: article.id } })}
          style={styles.commentsButton}>
          <ChatIcon size={18} />
          <Text style={styles.commentsButtonText}>{comments.length}件のひとことを見る・書く</Text>
        </Pressable>
      </View>

      {next ? (
        <View style={styles.next}>
          <Text style={text.small}>つぎのにこにゅー</Text>
          <Pressable
            accessibilityRole="link"
            onPress={() => router.replace({ pathname: '/article/[id]', params: { id: next.id } })}
            style={styles.nextCard}>
            <Thumb article={next} size={64} />
            <View style={styles.nextBody}>
              <Text style={[styles.nextMeta, { color: CATEGORIES[next.category].fg }]}>
                {CATEGORIES[next.category].label} ・ {next.region}
              </Text>
              <Text style={text.bold}>{next.title}</Text>
            </View>
            <ChevronIcon />
          </Pressable>
        </View>
      ) : (
        <View style={styles.done}>
          <Fukumaru pose="jin" size={64} />
          <View style={styles.nextBody}>
            <Text style={text.bold}>今日のにこにゅーは、これで全部です</Text>
            <Text style={[text.small, { color: C.brownInk }]}>ふくまる「今日もいい日になりますように」</Text>
          </View>
        </View>
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  missing: { alignItems: 'center', gap: 12, paddingTop: 80 },
  hero: { marginHorizontal: 16, height: 230, borderRadius: 28, overflow: 'hidden' },
  caption: { marginHorizontal: 20, marginTop: 6 },
  article: { paddingHorizontal: 20, paddingTop: 16, gap: 16 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  title: { fontFamily: fonts.rounded, fontWeight: '800', fontSize: 23, lineHeight: 34, color: C.ink },
  summary: { backgroundColor: C.sunTint, borderRadius: 22, padding: 16, paddingHorizontal: 18, gap: 8 },
  summaryTitle: { fontFamily: fonts.rounded, fontWeight: '800', fontSize: 14, color: C.sunInk, marginBottom: 2 },
  summaryRow: { flexDirection: 'row', gap: 6 },
  summaryNum: { fontFamily: fonts.body, fontSize: 14, lineHeight: 23, color: C.ink, width: 16 },
  summaryText: { flex: 1, fontFamily: fonts.body, fontSize: 14, lineHeight: 23, color: C.ink },
  source: { gap: 4, paddingTop: 14, borderTopWidth: 1, borderTopColor: C.line },
  stampBox: { marginHorizontal: 16, marginTop: 28, padding: 14, paddingTop: 20, borderRadius: 28, backgroundColor: C.soft, gap: 14 },
  stampHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: 4, flexWrap: 'wrap', gap: 4 },
  stampGrid: { flexDirection: 'row', gap: 8 },
  stamp: {
    flex: 1,
    minHeight: 108,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  stampLabel: { fontFamily: fonts.body, fontSize: 12, fontWeight: '700', color: C.ink },
  stampCountOn: { fontWeight: '700', color: C.ink },
  comments: { paddingHorizontal: 20, paddingTop: 28 },
  commentsHead: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 2 },
  commentsButton: {
    marginTop: 8,
    minHeight: 50,
    borderRadius: 999,
    backgroundColor: C.ink,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  commentsButtonText: { fontFamily: fonts.body, fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  next: { paddingHorizontal: 20, paddingTop: 28, gap: 10 },
  nextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 10,
    borderRadius: 22,
    backgroundColor: C.card,
    shadowColor: '#2A2730',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  nextBody: { flex: 1, gap: 4 },
  nextMeta: { fontFamily: fonts.body, fontSize: 11, fontWeight: '700' },
  done: { marginHorizontal: 16, marginTop: 28, padding: 14, borderRadius: 22, backgroundColor: C.sunTint, flexDirection: 'row', alignItems: 'center', gap: 12 },
});
