import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CategoryIcon, ChatIcon, CheckCircleIcon, Fukumaru, StampFace } from '@/components/nikonyu/icons';
import { Scene } from '@/components/nikonyu/scene';
import { Card, CategoryChip, LoadState, Page, text, Thumb } from '@/components/nikonyu/ui';
import { C, CATEGORIES, CATEGORY_ORDER, fonts, type CategoryId } from '@/constants/nikonyu';
import { useApi } from '@/lib/api';
import type { ArticleListResponse } from '@/lib/api-types';
import { useRead, useSession } from '@/state/nikonyu-store';

function todayLabel() {
  const d = new Date();
  return `${d.getMonth() + 1}月${d.getDate()}日（${'日月火水木金土'.charAt(d.getDay())}）朝7:00のお届け`;
}

function openArticle(id: string) {
  router.push({ pathname: '/article/[id]', params: { id } });
}

export default function TodayScreen() {
  const session = useSession();
  const read = useRead();
  const { data, error, reload } = useApi<ArticleListResponse>('/api/articles');
  const [cat, setCat] = useState<CategoryId | 'all'>('all');

  const header = (
    <View style={styles.header}>
      <View style={styles.brand}>
        <Fukumaru size={36} />
        <Text style={styles.brandText}>にこにゅー</Text>
      </View>
      <Pressable accessibilityRole="button" onPress={() => router.push('/login')} style={styles.account}>
        {session?.profile.picture ? (
          <Image source={session.profile.picture} style={styles.accountImage} contentFit="cover" />
        ) : (
          <Text style={styles.accountText}>{session ? session.profile.name : 'ログイン'}</Text>
        )}
      </Pressable>
    </View>
  );

  if (!data) {
    return (
      <Page>
        {header}
        <LoadState error={error} onRetry={reload} />
      </Page>
    );
  }

  const today = data.today;
  const readCount = today.filter((a) => read[a.id]).length;
  const nextId = today.find((a) => !read[a.id])?.id;
  const remaining = today.length - readCount;
  const archive = cat === 'all' ? data.archive : [...today, ...data.archive].filter((a) => a.category === cat);

  return (
    <Page>
      {header}

      {data.sample ? (
        <Text style={styles.sampleNote}>データベースが未設定のため、サンプル記事を表示しています（スタンプとひとことは保存されません）</Text>
      ) : null}

      <View style={styles.greeting}>
        <View style={styles.greetingMascot}>
          <Fukumaru size={92} />
        </View>
        <Text style={styles.greetingDate}>{todayLabel()}</Text>
        <Text style={[text.h1, styles.greetingTitle]}>おはようございます</Text>
        <Text style={styles.greetingSub}>今日のいいニュースは{today.length}本です</Text>
        <View style={styles.progressRow}>
          <View style={styles.progressBars}>
            {today.map((a) => (
              <View key={a.id} style={[styles.progressBar, { backgroundColor: read[a.id] ? C.sunDeep : '#FFFFFF' }]} />
            ))}
          </View>
          <Text style={text.bold}>
            {readCount} / {today.length} 読んだ
          </Text>
        </View>
      </View>

      <View style={styles.list}>
        {today.map((a, i) =>
          a.id === nextId ? (
            <Pressable key={a.id} accessibilityRole="link" onPress={() => openArticle(a.id)}>
              <Card style={styles.bigCard}>
                <View>
                  <Scene name={a.scene} width="100%" height={190} />
                  <Text style={styles.nextBadge}>
                    つぎはこれ　{i + 1} / {today.length}
                  </Text>
                </View>
                <View style={styles.bigBody}>
                  <View style={styles.metaRow}>
                    <CategoryChip id={a.category} />
                    <Text style={text.tiny}>
                      {a.region} ・ {a.minutes}分で読める
                    </Text>
                  </View>
                  <Text style={styles.bigTitle}>{a.title}</Text>
                  <Text style={[text.small, styles.lead]}>{a.lead}</Text>
                  <View style={styles.statsRow}>
                    <View style={styles.stat}>
                      <StampFace kind="hokko" size={18} />
                      <Text style={text.small}>{a.stamps.hokko.toLocaleString('ja-JP')}</Text>
                    </View>
                    <View style={styles.stat}>
                      <ChatIcon size={16} color="#EFE9DF" />
                      <Text style={text.small}>ひとこと {a.commentCount}</Text>
                    </View>
                  </View>
                </View>
              </Card>
            </Pressable>
          ) : (
            <Pressable key={a.id} accessibilityRole="link" onPress={() => openArticle(a.id)}>
              <View style={[styles.compact, read[a.id] ? styles.compactRead : styles.compactUnread]}>
                <Thumb article={a} size={76} />
                <View style={styles.compactBody}>
                  <View style={styles.metaRow}>
                    <CategoryChip id={a.category} />
                    <Text style={text.tiny}>{a.region}</Text>
                  </View>
                  <Text style={text.bold}>{a.title}</Text>
                  {read[a.id] ? (
                    <View style={styles.stat}>
                      <CheckCircleIcon />
                      <Text style={styles.readText}>読んだ</Text>
                    </View>
                  ) : (
                    <Text style={text.small}>{a.minutes}分で読める</Text>
                  )}
                </View>
              </View>
            </Pressable>
          )
        )}
      </View>

      <View style={styles.finish}>
        {remaining === 0 ? (
          <>
            <Fukumaru pose="jin" size={60} />
            <View style={styles.finishText}>
              <Text style={text.bold}>今日のにこにゅーを全部読みました</Text>
              <Text style={[text.small, { color: C.brownInk }]}>ふくまる「今日もいい日になりますように」</Text>
            </View>
          </>
        ) : (
          <>
            <Fukumaru size={52} />
            <View style={styles.finishText}>
              <Text style={text.bold}>あと{remaining}本で読み終わり</Text>
              <Text style={[text.small, { color: C.brownInk }]}>全部読むと、ふくまるからひとことが届きます</Text>
            </View>
          </>
        )}
      </View>

      <View style={styles.more}>
        <Text style={text.h2}>もっと読みたいときは</Text>
        <View style={styles.chips}>
          {(['all', ...CATEGORY_ORDER] as const).map((id) => {
            const on = id === cat;
            const c = id === 'all' ? { label: 'すべて', bg: '#F0EADF', fg: C.ink } : CATEGORIES[id];
            return (
              <Pressable
                key={id}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                onPress={() => setCat(id)}
                style={[styles.filterChip, { backgroundColor: on ? C.ink : c.bg }]}>
                <CategoryIcon id={id} color={on ? '#FFFFFF' : c.fg} bg={on ? C.ink : c.bg} size={14} />
                <Text style={[styles.filterText, { color: on ? '#FFFFFF' : c.fg }]}>{c.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={text.small}>{cat === 'all' ? 'これまでのにこにゅー' : `「${CATEGORIES[cat].label}」のにこにゅー`}</Text>
        {archive.length === 0 ? <Text style={text.small}>まだ記事がありません</Text> : null}
        {archive.map((a) => (
          <Pressable key={a.id} accessibilityRole="link" onPress={() => openArticle(a.id)} style={styles.archiveRow}>
            <Thumb article={a} size={64} />
            <View style={styles.compactBody}>
              <Text style={[styles.archiveMeta, { color: CATEGORIES[a.category].fg }]}>
                {CATEGORIES[a.category].label} ・ {a.region}
              </Text>
              <Text style={text.bold}>{a.title}</Text>
            </View>
          </Pressable>
        ))}
      </View>

      <Text style={[text.tiny, styles.note]}>
        {data.sample ? '試作版です。記事とひとことは、すべて架空のサンプルです。' : '試作版です。記事は海外メディアの内容をAIが要約したものです。'}
      </Text>
    </Page>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 16, paddingRight: 12, paddingTop: 8 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brandText: { fontFamily: fonts.rounded, fontWeight: '800', fontSize: 22, color: C.ink },
  account: { minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' },
  accountImage: { width: 32, height: 32, borderRadius: 16 },
  accountText: { fontFamily: fonts.body, fontSize: 13, fontWeight: '700', color: C.sunInk },
  sampleNote: { marginHorizontal: 16, marginTop: 4, padding: 10, borderRadius: 12, backgroundColor: C.soft, fontFamily: fonts.body, fontSize: 11, lineHeight: 17, color: C.sub },
  greeting: { marginHorizontal: 16, marginTop: 6, padding: 20, borderRadius: 28, backgroundColor: C.sunTint, overflow: 'hidden' },
  greetingMascot: { position: 'absolute', right: 6, top: 4 },
  greetingDate: { fontFamily: fonts.body, fontSize: 12, fontWeight: '500', color: C.sunInk },
  greetingTitle: { marginTop: 6 },
  greetingSub: { fontFamily: fonts.body, fontSize: 14, color: '#4A4250', marginTop: 2 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16 },
  progressBars: { flex: 1, flexDirection: 'row', gap: 6 },
  progressBar: { flex: 1, height: 8, borderRadius: 4 },
  list: { paddingHorizontal: 16, paddingTop: 16, gap: 12 },
  bigCard: { overflow: 'hidden', borderWidth: 2, borderColor: C.sun },
  nextBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: C.sun,
    color: C.ink,
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: '700',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    overflow: 'hidden',
  },
  bigBody: { padding: 16, paddingHorizontal: 18, gap: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  bigTitle: { fontFamily: fonts.rounded, fontWeight: '800', fontSize: 19, lineHeight: 28, color: C.ink },
  lead: { lineHeight: 22 },
  statsRow: { flexDirection: 'row', gap: 14, marginTop: 2 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  compact: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 10, borderRadius: 22 },
  compactRead: { backgroundColor: C.soft },
  compactUnread: {
    backgroundColor: C.card,
    shadowColor: '#2A2730',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  compactBody: { flex: 1, gap: 6 },
  readText: { fontFamily: fonts.body, fontSize: 12, fontWeight: '700', color: C.good },
  finish: { marginHorizontal: 16, marginTop: 20, paddingVertical: 14, paddingHorizontal: 18, borderRadius: 22, backgroundColor: C.sunTint, flexDirection: 'row', alignItems: 'center', gap: 14 },
  finishText: { flex: 1, gap: 3 },
  more: { paddingHorizontal: 16, paddingTop: 32, gap: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 38, paddingLeft: 11, paddingRight: 14, borderRadius: 999 },
  filterText: { fontFamily: fonts.body, fontSize: 13, fontWeight: '700' },
  archiveRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  archiveMeta: { fontFamily: fonts.body, fontSize: 11, fontWeight: '700' },
  note: { textAlign: 'center', marginTop: 28, paddingHorizontal: 16 },
});
