import { api } from './http';

export interface LikeData {
  id: string;
  placeId: string;
  name: string | null;
  address: string | null;
  rating: number | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LikeStatus {
  liked: boolean;
  like: LikeData | null;
}

// 좋아요 상태 확인
export async function checkLikeStatus(placeId: string): Promise<LikeStatus> {
  const data = await api(`/v1/likes/${placeId}`);
  return data;
}

// 좋아요 추가/업데이트
export async function addLike(payload: {
  placeId: string;
  name?: string;
  address?: string;
  rating?: number;
  tags?: string[];
}): Promise<{ success: boolean; like: LikeData }> {
  const data = await api('/v1/likes', {
    method: 'POST',
    body: payload
  });
  return data;
}

// 좋아요 취소
export async function removeLike(placeId: string): Promise<{ success: boolean; message: string }> {
  const data = await api(`/v1/likes/${placeId}`, {
    method: 'DELETE'
  });
  return data;
}
