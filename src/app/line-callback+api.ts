// スマホ版の中継ページ。LINEから戻ってきた code と state を、そのままアプリ（Expo Go）に渡す。
// 試作用：Expo Go の戻り先 exp://<開発サーバー>/--/callback に固定している。
export function GET(request: Request) {
  const url = new URL(request.url);
  const host = request.headers.get('host') ?? url.host;
  const appUrl = `exp://${host}/--/callback${url.search}`;
  const safeUrl = appUrl.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

  const html = `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>にこにゅーに戻ります</title>
<meta http-equiv="refresh" content="0;url=${safeUrl}">
</head>
<body style="font-family: sans-serif; text-align: center; padding: 48px 24px; color: #2A2730; background: #FFFDF9;">
<p>にこにゅーに戻ります…</p>
<p><a href="${safeUrl}" style="display: inline-block; padding: 14px 24px; border-radius: 999px; background: #06C755; color: #fff; text-decoration: none; font-weight: bold;">アプリに戻る</a></p>
</body>
</html>`;

  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
