import { api } from './http';

export type Me = {
  id: string;
  email: string;
  displayName: string | null;
  lang: 'KR' | 'EN' | null;
  createdAt: string;
};

export async function getMe(): Promise<Me> {
  const data = await api('/v1/users/me');
  return data;
}

export async function updateProfile(payload: Partial<Pick<Me, 'displayName' | 'lang'>>): Promise<Me> {
  const data = await api('/v1/users/me', {
    method: 'PATCH',
    body: payload
  });
  return data;
}

export async function changePassword(payload: { currentPassword: string; newPassword: string }): Promise<boolean> {
  const data = await api('/v1/users/me/password', {
    method: 'PATCH',
    body: payload
  });
  return data.ok;
}
