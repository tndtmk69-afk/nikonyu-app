const TOKEN_ENDPOINT = 'https://api.line.me/oauth2/v2.1/token';
const VERIFY_ENDPOINT = 'https://api.line.me/oauth2/v2.1/verify';

type LoginBody = {
  code?: string;
  redirectUri?: string;
  codeVerifier?: string;
  nonce?: string;
};

// LINEのトークン取得にはチャネルシークレットが必須なので、アプリではなくこのサーバー側で行う。
export async function POST(request: Request) {
  try {
    return await login(request);
  } catch (e) {
    const reason = e instanceof Error ? (e.cause instanceof Error ? e.cause.message : e.message) : String(e);
    return Response.json({ error: `LINEのサーバーに接続できませんでした: ${reason}` }, { status: 502 });
  }
}

async function login(request: Request) {
  const channelId = process.env.EXPO_PUBLIC_LINE_CHANNEL_ID;
  const channelSecret = process.env.LINE_CHANNEL_SECRET;
  if (!channelId || !channelSecret) {
    return Response.json(
      { error: 'LINEのチャネルIDかチャネルシークレットが設定されていません（.env.local を確認してください）' },
      { status: 500 }
    );
  }

  const { code, redirectUri, codeVerifier, nonce } = (await request.json()) as LoginBody;
  if (!code || !redirectUri || !codeVerifier || !nonce) {
    return Response.json({ error: 'リクエストに必要な値が足りません' }, { status: 400 });
  }

  const tokenRes = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: channelId,
      client_secret: channelSecret,
      code_verifier: codeVerifier,
    }),
  });
  const token = await tokenRes.json();
  if (!tokenRes.ok) {
    return Response.json(
      { error: `トークンの取得に失敗しました: ${token.error_description ?? token.error}` },
      { status: 502 }
    );
  }

  // IDトークンをLINEに検証してもらい、nonceでなりすましや使い回しを防ぐ
  const verifyRes = await fetch(VERIFY_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ id_token: token.id_token, client_id: channelId, nonce }),
  });
  const claims = await verifyRes.json();
  if (!verifyRes.ok) {
    return Response.json(
      { error: `IDトークンの検証に失敗しました: ${claims.error_description ?? claims.error}` },
      { status: 401 }
    );
  }

  // 試作では自前のセッションは発行せず、プロフィールだけを返す
  return Response.json({ userId: claims.sub, name: claims.name, picture: claims.picture });
}
