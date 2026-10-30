import { StyleSheet, Text, View } from 'react-native';

import { Fukumaru } from '@/components/nikonyu/icons';
import { BackHeader, Page, text } from '@/components/nikonyu/ui';
import { C, fonts } from '@/constants/nikonyu';

// 試作版を試してもらう人向けの説明。正式公開の前に、利用規約とプライバシーポリシーとして整える。
const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: 'にこにゅーについて',
    body: [
      '世界のいいニュースだけを届ける、試作中のニュースアプリです。',
      '記事は、海外のニュースサイトの内容をAIが日本語で要約したものです。各記事に元記事の名前とURLを載せています。',
      '記事の写真は、雰囲気を伝えるためのイメージです。実際の出来事の写真ではありません。',
    ],
  },
  {
    title: '保存する情報',
    body: [
      'LINEでログインしたとき：LINEの表示名、アイコン画像、LINEのユーザーID。',
      'ひとことを書いたとき：書いた内容と日時。',
      'スタンプや「ありがとう」、通報：押した記事やひとことと、端末を区別するためのID（ログインしていない場合）。',
      'これらは、アプリの表示と、コメント欄を見守るためだけに使います。',
    ],
  },
  {
    title: 'AIの使い方',
    body: [
      '記事の選定と要約、ひとことの投稿前の確認に、GoogleのAI（Gemini API の無料枠）を使っています。',
      '無料枠では、送った内容がGoogleのサービス改善に使われることがあります。個人を特定できる情報は書かないでください。',
      '正式公開の前に、内容が学習に使われない有料枠へ切り替える予定です。',
    ],
  },
  {
    title: 'コメント欄のお約束',
    body: [
      'ここは、誰も嫌な気持ちにならない場所です。人を責める言葉、からかう言葉、個人情報は書かないでください。',
      '通報が一定数集まったひとことは、運営が確認するまで表示されなくなります。',
    ],
  },
];

export default function AboutScreen() {
  return (
    <Page>
      <BackHeader title="このアプリについて" />
      <View style={styles.hero}>
        <Fukumaru size={80} />
        <Text style={styles.badge}>試作版</Text>
      </View>
      {SECTIONS.map((s) => (
        <View key={s.title} style={styles.section}>
          <Text style={text.h2}>{s.title}</Text>
          {s.body.map((p) => (
            <Text key={p} style={styles.body}>
              {p}
            </Text>
          ))}
        </View>
      ))}
    </Page>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: 8, paddingVertical: 8 },
  badge: { fontFamily: fonts.body, fontSize: 12, fontWeight: '700', color: C.sunInk, backgroundColor: C.sunTint, paddingVertical: 4, paddingHorizontal: 12, borderRadius: 999, overflow: 'hidden' },
  section: { paddingHorizontal: 20, paddingTop: 20, gap: 8 },
  body: { fontFamily: fonts.body, fontSize: 14, lineHeight: 24, color: C.ink },
});
