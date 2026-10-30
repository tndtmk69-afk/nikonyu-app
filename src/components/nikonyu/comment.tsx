import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar, HeartIcon } from '@/components/nikonyu/icons';
import { C, fonts } from '@/constants/nikonyu';
import type { ApiComment } from '@/lib/api-types';

function timeLabel(iso: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - Date.parse(iso)) / 60_000));
  if (minutes < 1) return 'たった今';
  if (minutes < 60) return `${minutes}分前`;
  if (minutes < 24 * 60) return `${Math.floor(minutes / 60)}時間前`;
  return minutes < 48 * 60 ? 'きのう' : `${Math.floor(minutes / (24 * 60))}日前`;
}

type Props = {
  item: ApiComment;
  compact?: boolean;
  onThanks?: () => void;
  onReport?: () => void;
};

export function CommentRow({ item, compact, onThanks, onReport }: Props) {
  const on = item.thankedByMe;
  const size = compact ? 36 : 42;
  return (
    <View style={[styles.row, !compact && styles.rowBorder]}>
      {item.picture ? (
        <Image source={item.picture} style={{ width: size, height: size, borderRadius: size / 2 }} contentFit="cover" />
      ) : (
        <Avatar kind={item.avatar} size={size} />
      )}
      <View style={styles.body}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{item.author}</Text>
          <Text style={styles.time}>{timeLabel(item.createdAt)}</Text>
        </View>
        <Text style={styles.text}>{item.text}</Text>
        {compact ? null : (
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              disabled={item.mine || !onThanks}
              onPress={onThanks}
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
