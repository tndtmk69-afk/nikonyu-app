import { Image } from 'expo-image';
import { router } from 'expo-router';
import type { PropsWithChildren, ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackIcon, CategoryIcon, Fukumaru } from '@/components/nikonyu/icons';
import { Scene } from '@/components/nikonyu/scene';
import { C, CATEGORIES, fonts, type CategoryId } from '@/constants/nikonyu';
import type { SceneName } from '@/data/articles';
import type { ArticlePhoto } from '@/server/photos';

// Webでもスマホの幅（最大480px）に収めて表示する画面の枠
export function Page({ children, footer }: PropsWithChildren<{ footer?: ReactNode }>) {
  return (
    <View style={styles.outer}>
      <SafeAreaView style={styles.column} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
        {footer}
      </SafeAreaView>
    </View>
  );
}

export function BackHeader({ title, right }: { title?: string; right?: ReactNode }) {
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="戻る"
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        style={styles.iconButton}>
        <BackIcon />
      </Pressable>
      {title ? <Text style={styles.headerTitle}>{title}</Text> : <View />}
      <View style={styles.headerRight}>{right}</View>
    </View>
  );
}

export function CategoryChip({ id, large }: { id: CategoryId; large?: boolean }) {
  const c = CATEGORIES[id];
  return (
    <View style={[styles.chip, { backgroundColor: c.bg }, large && styles.chipLarge]}>
      <CategoryIcon id={id} color={c.fg} bg={c.bg} size={large ? 13 : 11} />
      <Text style={[styles.chipText, { color: c.fg }, large && styles.chipTextLarge]}>{c.label}</Text>
    </View>
  );
}

type ImageArticle = { scene: SceneName; photo?: ArticlePhoto | null };

// 記事のイメージ写真。写真が見つかっていない記事は挿絵で代用する
export function ArticleImage({ article, width, height }: { article: ImageArticle; width: number | '100%'; height: number }) {
  const { photo } = article;
  if (!photo) return <Scene name={article.scene} width={width} height={height} />;
  return <Image source={{ uri: photo.src }} accessibilityLabel={photo.alt} style={{ width, height }} contentFit="cover" transition={200} />;
}

export function Thumb({ article, size }: { article: ImageArticle; size: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 5, overflow: 'hidden' }}>
      <ArticleImage article={article} width={size} height={size} />
    </View>
  );
}

// 読み込み中・エラーのときの表示
export function LoadState({ error, onRetry }: { error?: string; onRetry?: () => void }) {
  return (
    <View style={styles.loadState}>
      <Fukumaru pose={error ? 'oops' : 'basic'} size={96} />
      <Text style={[text.bold, styles.loadText]}>{error ? 'あれれ、うまく読み込めませんでした' : 'ふくまるがニュースを運んでいます…'}</Text>
      {error ? <Text style={[text.small, styles.loadText]}>{error}</Text> : null}
      {error && onRetry ? (
        <Pressable accessibilityRole="button" onPress={onRetry} style={styles.retry}>
          <Text style={styles.retryText}>もう一度読み込む</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Card({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export const text = StyleSheet.create({
  h1: { fontFamily: fonts.rounded, fontWeight: '800', fontSize: 24, lineHeight: 34, color: C.ink },
  h2: { fontFamily: fonts.rounded, fontWeight: '800', fontSize: 17, color: C.ink },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 28, color: C.ink },
  bold: { fontFamily: fonts.body, fontSize: 14, fontWeight: '700', lineHeight: 21, color: C.ink },
  small: { fontFamily: fonts.body, fontSize: 12, color: C.sub },
  tiny: { fontFamily: fonts.body, fontSize: 11, color: C.sub },
});

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: C.page, alignItems: 'center' },
  column: { flex: 1, width: '100%', maxWidth: 480, backgroundColor: C.bg },
  scroll: { paddingBottom: 32 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 6 },
  headerTitle: { fontFamily: fonts.body, fontSize: 13, fontWeight: '700', color: C.sub },
  headerRight: { minWidth: 44, alignItems: 'flex-end' },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingVertical: 3, paddingLeft: 7, paddingRight: 9, borderRadius: 999 },
  chipLarge: { paddingVertical: 4, paddingLeft: 9, paddingRight: 11 },
  chipText: { fontFamily: fonts.body, fontSize: 11, fontWeight: '700' },
  chipTextLarge: { fontSize: 12 },
  loadState: { alignItems: 'center', gap: 10, paddingTop: 72, paddingHorizontal: 32 },
  loadText: { textAlign: 'center' },
  retry: { marginTop: 8, minHeight: 44, paddingHorizontal: 22, borderRadius: 999, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center' },
  retryText: { fontFamily: fonts.body, fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  card: {
    backgroundColor: C.card,
    borderRadius: 22,
    shadowColor: '#2A2730',
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
});
