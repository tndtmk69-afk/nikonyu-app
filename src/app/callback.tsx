import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';

// Web版では、LINEから戻ってきたポップアップを閉じてログイン画面に結果を渡す
WebBrowser.maybeCompleteAuthSession();

export default function CallbackScreen() {
  // スマホでは戻りURLでこの画面が開くことがあるので、待っているログイン画面に戻す
  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
