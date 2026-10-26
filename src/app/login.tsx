import { makeRedirectUri, useAuthRequest } from 'expo-auth-session';
import Constants from 'expo-constants';
import * as Crypto from 'expo-crypto';
import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState, useSyncExternalStore } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Fukumaru } from '@/components/nikonyu/icons';
import { fonts } from '@/constants/nikonyu';
import { LINE_CHANNEL_ID, lineDiscovery } from '@/lib/line-auth';
import { useNikonyu } from '@/state/nikonyu-store';

function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

// スマホでは、LINEからいったん開発サーバーの中継ページ（src/app/line-callback+api.ts）に戻し、
// そこからアプリに戻す。LINEのコールバックURLにアプリ専用のURLを登録できるか分からないため。
function getNativeRedirectUri() {
  const host = Constants.expoConfig?.hostUri;
  if (!host) return '';
  // トンネル（*.exp.direct）はポートなしのhttps、同じWi-Fi内はポート付きのhttp
  return `${host.includes(':') ? 'http' : 'https'}://${host}/line-callback`;
}

const redirectUri =
  Platform.OS === 'web'
    ? makeRedirectUri({ scheme: 'nikonyuapp', path: 'callback' })
    : getNativeRedirectUri();

// Web版のサーバー描画ではURLが分からず空になるため、表示はブラウザ側の値に揃える
const subscribeNoop = () => () => {};
function useClientRedirectUri() {
  return useSyncExternalStore(subscribeNoop, () => redirectUri, () => '');
}

export default function LoginScreen() {
  const shownRedirectUri = useClientRedirectUri();
  const [nonce] = useState(() => Crypto.randomUUID());
  const [request, , promptAsync] = useAuthRequest(
    {
      clientId: LINE_CHANNEL_ID,
      redirectUri,
      scopes: ['profile', 'openid'],
      usePKCE: true,
      extraParams: { nonce },
    },
    lineDiscovery
  );
  const { profile, setProfile } = useNikonyu();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // LINEのログイン画面を開き、戻ってきた認可コードを返す（キャンセルや失敗は null）
  async function getCodeOnWeb() {
    let result: Awaited<ReturnType<typeof promptAsync>>;
    try {
      result = await promptAsync();
    } catch {
      // ブラウザがポップアップを止めたとき
      setError('LINEのログイン画面を開けませんでした。ブラウザのポップアップを許可して、もう一度押してください');
      return null;
    }
    if (result.type === 'error') {
      setError(
        result.params.error === 'access_denied'
          ? 'ログインがキャンセルされました'
          : (result.params.error_description ?? 'ログインに失敗しました')
      );
      return null;
    }
    return result.type === 'success' ? result.params.code : null;
  }

  async function getCodeOnNative() {
    if (!request?.url) return null;
    const result = await WebBrowser.openAuthSessionAsync(request.url, Linking.createURL('callback'));
    if (result.type !== 'success') return null;

    const params = Linking.parse(result.url).queryParams ?? {};
    if (params.state !== request.state) {
      setError('ログインの確認に失敗しました（stateが一致しません）');
      return null;
    }
    if (params.error) {
      setError(params.error === 'access_denied' ? 'ログインがキャンセルされました' : 'ログインに失敗しました');
      return null;
    }
    return typeof params.code === 'string' ? params.code : null;
  }

  async function handleLogin() {
    const codeVerifier = request?.codeVerifier;
    if (!codeVerifier || !redirectUri) return;
    setError(null);

    const code = Platform.OS === 'web' ? await getCodeOnWeb() : await getCodeOnNative();
    if (!code) return;

    setLoading(true);
    try {
      const res = await fetch('/api/line/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, redirectUri, codeVerifier, nonce }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProfile(data);
      goBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  const configured = LINE_CHANNEL_ID !== '';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.hero}>
        <Fukumaru size={96} />
        <Text style={styles.title}>にこにゅー</Text>
        <Text style={styles.subtitle}>ひとことを書くには、LINEでログインしてください。{'\n'}読むこととスタンプは、ログインなしで使えます。</Text>
      </View>

      {profile ? (
        <View style={styles.card}>
          {profile.picture ? (
            <Image source={profile.picture} style={styles.avatar} contentFit="cover" />
          ) : null}
          <Text style={styles.welcome}>{profile.name}さん、ログイン中です</Text>
          <Pressable style={styles.secondaryButton} onPress={goBack}>
            <Text style={styles.secondaryButtonText}>もどる</Text>
          </Pressable>
          <Pressable onPress={() => setProfile(null)}>
            <Text style={styles.small}>ログアウトする</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.card}>
          <Pressable
            accessibilityRole="button"
            disabled={!configured || !request || loading}
            onPress={handleLogin}
            style={({ pressed }) => [
              styles.lineButton,
              (!configured || !request || loading) && styles.disabled,
              pressed && styles.pressed,
            ]}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.lineButtonText}>LINEでログイン</Text>
            )}
          </Pressable>
          {!configured ? (
            <Text style={styles.notice}>
              LINEのチャネルIDが未設定です。.env.local に EXPO_PUBLIC_LINE_CHANNEL_ID を書いて、開発サーバーを起動し直してください。
            </Text>
          ) : null}
          <Pressable onPress={goBack}>
            <Text style={styles.small}>あとで</Text>
          </Pressable>
        </View>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.devInfo}>
        <Text style={styles.small}>LINE Developersに登録するコールバックURL</Text>
        <Text selectable style={styles.code}>
          {shownRedirectUri}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFDF9',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 24,
  },
  hero: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontFamily: fonts.rounded,
    fontSize: 28,
    fontWeight: '800',
    color: '#2A2730',
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    color: '#6B6670',
  },
  card: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    gap: 12,
  },
  lineButton: {
    width: '100%',
    minHeight: 52,
    borderRadius: 999,
    backgroundColor: '#06C755',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lineButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.8,
  },
  notice: {
    fontSize: 13,
    lineHeight: 20,
    color: '#5A4A2A',
    backgroundColor: '#FFF3D1',
    borderRadius: 12,
    padding: 12,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  welcome: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2A2730',
  },
  secondaryButton: {
    minHeight: 44,
    paddingHorizontal: 20,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#2A2730',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2A2730',
  },
  error: {
    maxWidth: 360,
    fontSize: 13,
    lineHeight: 20,
    color: '#A12B1F',
  },
  devInfo: {
    maxWidth: 360,
    alignItems: 'center',
    gap: 4,
  },
  small: {
    fontSize: 12,
    color: '#6B6670',
  },
  code: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#2A2730',
  },
});
