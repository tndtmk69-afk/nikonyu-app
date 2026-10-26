// LINEのチャネルIDは公開されても問題ない値なので、EXPO_PUBLIC_ でクライアントに渡す。
// チャネルシークレットはサーバー側（src/app/api/line/login+api.ts）だけで読む。
export const LINE_CHANNEL_ID = process.env.EXPO_PUBLIC_LINE_CHANNEL_ID ?? '';

export const lineDiscovery = {
  authorizationEndpoint: 'https://access.line.me/oauth2/v2.1/authorize',
};

export type LineProfile = {
  userId: string;
  name: string;
  picture?: string;
};
