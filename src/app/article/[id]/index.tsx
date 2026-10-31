import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { CommentRow } from '@/components/nikonyu/comment';
import { ChatIcon, ChevronIcon, Fukumaru, StampFace } from '@/components/nikonyu/icons';
import { ArticleImage, BackHeader, CategoryChip, LoadState, Page, text, Thumb } from '@/components/nikonyu/ui';
import { C, CATEGORIES, fonts, STAMPS, type StampKind } from '@/constants/nikonyu';
import { api, useApi } from '@/lib/api';
import type { ArticleDetailResponse, ArticleListResponse } from '@/lib/api-types';
import { markRead, useRead } from '@/state/nikonyu-store';

export default function ArticleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const detail = useApi<ArticleDetailResponse>(`/api/articles/${id}`);
  const list = useApi<ArticleListResponse>('/api/articles');
  const read = useRead();
  const [notice, setNotice] = useState<string | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);

  useEffect(() => {
    if (detail.data) markRead(detail.data.article.id);
  }, [detail.data]);

  if (!detail.data) {
    return (
      <Page>
        <BackHeader />
        <LoadState error={detail.error} onRetry={detail.reload} />
      </Page>
    );
  }

  const { article, comments } = detail.data;
  const today = list.data?.today ?? [];
  const todayIndex = today.findIndex((a) => a.id === article.id);
  const next = today.find((a, i) => i > todayIndex && !read[a.id]) ?? today.find((a) => !read[a.id] && a.id !== article.id);

  const toggleStamp = (kind: StampKind) => {
    const flip = (d: ArticleDetailResponse): ArticleDetailResponse => {
      const on = d.article.myStamps.includes(kind);
      return {
        ...d,
        article: {
          ...d.article,
          myStamps: on ? d.article.myStamps.filter((k) => k !== kind) : [...d.article.myStamps, kind],
          stamps: { ...d.article.stamps, [kind]: d.article.stamps[kind] + (on ? -1 : 1) },
        },
      };
    };
    detail.mutate(flip);
    setNotice(null);
    api('/api/stamps', { method: 'POST', body: { articleId: article.id, kind } }).catch((e: Error) => {
      detail.mutate(flip); // 保存できなかったので元に戻す
      setNotice(e.message);
    });
  };

  return (
    <Page>
      <BackHeader title={todayIndex >= 0 ? `今日のにこにゅー　${todayIndex + 1} / ${today.length}` : CATEGORIES[article.category].label} />

      <View style={styles.hero}>
        <ArticleImage article={article} width="100%" height={230} />
      </View>
      {article.photo?.ai ? (
        <Text style={[text.tiny, styles.caption]}>画像はAIで作ったイメージです。実際の出来事の写真ではありません。</Text>
      ) : article.photo?.source ? (
        // 元記事の写真は、媒体名と元記事へのリンクを表記する
        <Text style={[text.tiny, styles.caption]}>
          写真：
          <Text style={styles.creditLink} onPress={() => Linking.openURL(article.photo!.pageUrl)}>
            {article.photo.creator}（元記事より）
          </Text>
        </Text>
      ) : article.photo ? (
        // ライセンスに沿って、写真のタイトル・撮影者・掲載元・ライセンスを表記する
        <Text style={[text.tiny, styles.caption]}>
          写真はイメージです
          <Text style={styles.creditLink} onPress={() => Linking.openURL(article.photo!.pageUrl)}>
            「{article.photo.alt}」{article.photo.creator ? ` by ${article.photo.creator}` : ''}
          </Text>
          {' / '}
          {article.photo.licenseUrl ? (
            <Text style={styles.creditLink} onPress={() => Linking.openURL(article.photo!.licenseUrl!)}>
              {article.photo.license}
            </Text>
          ) : (
            article.photo.license
          )}
        </Text>
      ) : (
        <Text style={[text.tiny, styles.caption]}>写真はイメージです（{article.sceneCaption.replace(/^イメージ：/, '')}）</Text>
      )}

      <View style={styles.article}>
        <View style={styles.metaRow}>
          <CategoryChip id={article.category} large />
          <Text style={text.small}>
            {article.region} ・ {article.minutes}分で読める
          </Text>
        </View>
        <Text style={styles.title}>{article.title}</Text>

        {/* 3行要約は、読みたい人だけが開く（最初は閉じておく） */}
        <View style={[styles.summary, summaryOpen && styles.summaryOpen]}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: summaryOpen }}
            onPress={() => setSummaryOpen((open) => !open)}
            style={styles.summaryHead}>
            <Text style={styles.summaryTitle}>3行でいうと</Text>
            <View style={{ transform: [{ rotate: summaryOpen ? '-90deg' : '90deg' }] }}>
              <ChevronIcon size={16} color={C.sunInk} />
            </View>
          </Pressable>
          {summaryOpen
            ? article.summary.map((s, i) => (
                <View key={s} style={styles.summaryRow}>
                  <Text style={styles.summaryNum}>{i + 1}.</Text>
                  <Text style={styles.summaryText}>{s}</Text>
                </View>
              ))
            : null}
        </View>

        {article.body.map((p) => (
          <Text key={p} style={text.body}>
            {p}
          </Text>
        ))}

        <View style={styles.source}>
          <Text style={text.small}>元記事：{article.source}</Text>
          {article.sourceUrl ? (
            <Text selectable style={[text.tiny, styles.sourceUrl]}>
              {article.sourceUrl}
            </Text>
          ) : null}
          <Text style={text.small}>翻訳・要約：にこにゅー編集部（AIによる要約を含みます）</Text>
        </View>
      </View>

      <View style={styles.stampBox}>
        <View style={styles.stampHead}>
          <Text style={text.h2}>この記事、どうでした？</Text>
          <Text style={text.tiny}>ログインなしで押せます</Text>
        </View>
        <View style={styles.stampGrid}>
          {STAMPS.map((s) => {
            const on = article.myStamps.includes(s.kind);
            return (
              <Pressable
                key={s.kind}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                onPress={() => toggleStamp(s.kind)}
                style={[styles.stamp, on && { backgroundColor: s.tint, borderColor: s.ring }]}>
                <StampFace kind={s.kind} size={on ? 48 : 42} />
                <Text style={styles.stampLabel}>{s.label}</Text>
                <Text style={[text.tiny, on && styles.stampCountOn]}>{article.stamps[s.kind].toLocaleString('ja-JP')}</Text>
              </Pressable>
            );
          })}
        </View>
        {notice ? <Text style={styles.notice}>{notice}</Text> : null}
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
      ) : today.length > 0 ? (
        <View style={styles.done}>
          <Fukumaru pose="jin" size={64} />
          <View style={styles.nextBody}>
            <Text style={text.bold}>今日のにこにゅーは、これで全部です</Text>
            <Text style={[text.small, { color: C.brownInk }]}>ふくまる「今日もいい日になりますように」</Text>
          </View>
        </View>
      ) : null}
    </Page>
  );
}

const styles = StyleSheet.create({
  hero: { marginHorizontal: 16, height: 230, borderRadius: 28, overflow: 'hidden' },
  caption: { marginHorizontal: 20, marginTop: 6 },
  creditLink: { textDecorationLine: 'underline' },
  article: { paddingHorizontal: 20, paddingTop: 16, gap: 16 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  title: { fontFamily: fonts.rounded, fontWeight: '800', fontSize: 23, lineHeight: 34, color: C.ink },
  summary: { backgroundColor: C.sunTint, borderRadius: 18, paddingVertical: 4, paddingHorizontal: 18, paddingBottom: 4, gap: 8 },
  summaryHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  summaryTitle: { fontFamily: fonts.rounded, fontWeight: '800', fontSize: 14, color: C.sunInk },
  summaryRow: { flexDirection: 'row', gap: 6 },
  summaryNum: { fontFamily: fonts.body, fontSize: 14, lineHeight: 23, color: C.ink, width: 16 },
  summaryText: { flex: 1, fontFamily: fonts.body, fontSize: 14, lineHeight: 23, color: C.ink },
  summaryOpen: { paddingBottom: 14 },
  source: { gap: 4, paddingTop: 14, borderTopWidth: 1, borderTopColor: C.line },
  sourceUrl: { color: C.sub },
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
  notice: { fontFamily: fonts.body, fontSize: 12, lineHeight: 18, color: C.danger, paddingHorizontal: 4 },
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
