import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar, HeartIcon } from '@/components/nikonyu/icons';
import { C, fonts } from '@/constants/nikonyu';
import type { Article, AvatarKind } from '@/data/articles';
import { useNikonyu } from '@/state/nikonyu-store';

export type CommentItem = {
  id: string;
  author: string;
  avatar: AvatarKind;
  time: string;
  text: string;
  thanks: number;
  mine: boolean;
};

function timeLabel(minutesAgo: number) {
  if (minutesAgo < 60) return `${minutesAgo}分前`;
  if (minutesAgo < 24 * 60) return `${Math.floor(minutesAgo / 60)}時間前`;
  return 'きのう';
}

// 自分の投稿を先頭に、通報したものを除いて並べる
export function useArticleComments(article: Article): CommentItem[] {
  const { posted, reported, thanked } = useNikonyu();
  const mine: CommentItem[] = posted
    .filter((p) => p.articleId === article.id)
    .map((p) => ({ id: p.id, author: p.author, avatar: 'you', time: 'たった今', text: p.text, thanks: 0, mine: true }));
  const seeds: CommentItem[] = article.comments.map((c) => ({
    id: c.id,
    author: c.author,
    avatar: c.avatar,
    time: timeLabel(c.minutesAgo),
    text: c.text,
    thanks: c.thanks,
    mine: false,
  }));
  return [...mine, ...seeds]
    .filter((c) => !reported[c.id])
    .map((c) => ({ ...c, thanks: c.thanks + (thanked[c.id] ? 1 : 0) }));
}

export function CommentRow({ item, onReport, compact }: { item: CommentItem; onReport?: () => void; compact?: boolean }) {
  const { thanked, toggleThanks } = useNikonyu();
  const on = !!thanked[item.id];
  return (
    <View style={[styles.row, !compact && styles.rowBorder]}>
      <Avatar kind={item.avatar} size={compact ? 36 : 42} />
      <View style={styles.body}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{item.author}</Text>
          <Text style={styles.time}>{item.time}</Text>
        </View>
        <Text style={styles.text}>{item.text}</Text>
        {compact ? null : (
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              disabled={item.mine}
              onPress={() => toggleThanks(item.id)}
              style={[styles.thanks, on && styles.thanksOn, item.mine && styles.thanksMine]}>
              <HeartIcon size={18} color={on ? '#FF6F8E' : '#FFC9D4'} />
              <Text style={styles.thanksText}>ありがとう {item.thanks}</Text>
            </Pressable>
            {onReport && !item.mine ? (
              <Pressable accessibilityRole="button" onPress={onReport} style={styles.report}>
                <Text style={styles.reportText}>通報</Text>
              </Pressable>
            ) : null}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12, paddingVertical: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.line },
  body: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  name: { fontFamily: fonts.body, fontSize: 13, fontWeight: '700', color: C.ink },
  time: { fontFamily: fonts.body, fontSize: 11, color: C.sub },
  text: { fontFamily: fonts.body, fontSize: 14, lineHeight: 24, color: C.ink, marginTop: 4 },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  thanks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 36,
    paddingLeft: 10,
    paddingRight: 13,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: C.line,
    backgroundColor: '#FFFFFF',
  },
  thanksOn: { borderColor: C.pinkRing, backgroundColor: '#FFF0F3' },
  thanksMine: { opacity: 0.5 },
  thanksText: { fontFamily: fonts.body, fontSize: 12, fontWeight: '700', color: C.ink },
  report: { minHeight: 36, minWidth: 44, alignItems: 'center', justifyContent: 'center' },
  reportText: { fontFamily: fonts.body, fontSize: 12, color: C.sub },
});
