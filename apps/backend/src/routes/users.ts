import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcrypt';
import { prisma } from '@db/client';
import { authHook } from '../auth/jwt.js';

// Helper: get userId from request (set by authHook)
function getUserId(req: FastifyRequest): string {
  const anyReq = req as any;
  const uid = anyReq.user?.userId || anyReq.user?.id || anyReq.userId || anyReq.jwt?.id;
  if (!uid) throw new Error('NO_AUTH_USER_ID');
  return String(uid);
}

export async function usersRoutes(app: FastifyInstance) {
  // All routes below require JWT
  app.addHook('onRequest', authHook);

  // GET /v1/users/me
  app.get('/v1/users/me', async (req, rep) => {
    try {
      const userId = getUserId(req);
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, displayName: true, lang: true, createdAt: true },
      });
      if (!user) return rep.status(404).send({ message: 'User not found' });
      return rep.send(user);
    } catch (error) {
      console.error('Get user error:', error);
      return rep.status(500).send({ message: 'Internal server error' });
    }
  });

  // PATCH /v1/users/me  (update profile)
  app.patch('/v1/users/me', async (req, rep) => {
    try {
      const userId = getUserId(req);
      const body = (req.body ?? {}) as Partial<{ displayName: string; lang: string }>;

      const updates: Record<string, any> = {};
      if (typeof body.displayName === 'string') {
        const trimmed = body.displayName.trim();
        if (trimmed.length < 2 || trimmed.length > 30) {
          return rep.status(400).send({ message: 'displayName must be 2~30 chars' });
        }
        updates.displayName = trimmed;
      }
      if (typeof body.lang === 'string') {
        const allowed = ['KR', 'EN'];
        if (!allowed.includes(body.lang)) {
          return rep.status(400).send({ message: 'lang must be KR or EN' });
        }
        updates.lang = body.lang;
      }

      if (Object.keys(updates).length === 0) {
        return rep.status(400).send({ message: 'No valid fields provided' });
      }

      const updated = await prisma.user.update({
        where: { id: userId },
        data: updates,
        select: { id: true, email: true, displayName: true, lang: true },
      });

      return rep.send(updated);
    } catch (error) {
      console.error('Update profile error:', error);
      return rep.status(500).send({ message: 'Internal server error' });
    }
  });

  // PATCH /v1/users/me/password  (change password)
  app.patch('/v1/users/me/password', async (req, rep) => {
    try {
      const userId = getUserId(req);
      const body = (req.body ?? {}) as Partial<{ currentPassword: string; newPassword: string }>;
      const { currentPassword, newPassword } = body;

      if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
        return rep.status(400).send({ message: 'currentPassword and newPassword are required' });
      }
      if (newPassword.length < 8) {
        return rep.status(400).send({ message: 'newPassword must be at least 8 characters' });
      }

      const user = await prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
      if (!user?.passwordHash) return rep.status(404).send({ message: 'User not found' });

      const ok = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!ok) return rep.status(401).send({ message: 'Current password is incorrect' });

      const newHash = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({ where: { id: userId }, data: { passwordHash: newHash } });

      return rep.send({ ok: true });
    } catch (error) {
      console.error('Change password error:', error);
      return rep.status(500).send({ message: 'Internal server error' });
    }
  });
}
