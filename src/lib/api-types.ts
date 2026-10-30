import type { CategoryId, StampKind } from '@/constants/nikonyu';
import type { AvatarKind, SceneName } from '@/data/articles';
import type { ArticlePhoto } from '@/server/photos';

// アプリとサーバー（src/app/api）の間でやり取りするデータの形

export type ApiArticle = {
  id: string;
  featuredDate: string | null;
  category: CategoryId;
  region: string;
  minutes: number;
  title: string;
  lead: string;
  summary: string[];
  body: string[];
  source: string;
  sourceUrl: string | null;
  scene: SceneName;
  sceneCaption: string;
  photo: ArticlePhoto | null;
  stamps: Record<StampKind, number>;
  myStamps: StampKind[];
  commentCount: number;
};

export type ApiComment = {
  id: string;
  author: string;
  avatar: AvatarKind;
  picture: string | null;
  createdAt: string;
  text: string;
  thanks: number;
  thankedByMe: boolean;
  mine: boolean;
};

export type ArticleListResponse = { today: ApiArticle[]; archive: ApiArticle[]; sample: boolean };
export type ArticleDetailResponse = { article: ApiArticle; comments: ApiComment[]; sample: boolean };

export type PostCommentResponse =
  | { status: 'posted'; comment: ApiComment }
  | { status: 'suggest'; suggestion: string; byAi: boolean };

export type LoginResponse = { userId: string; name: string; picture?: string; token: string | null };
