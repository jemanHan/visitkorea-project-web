import { FastifyInstance } from 'fastify';
import { prisma } from '@db/client';
import { normalizeTags } from '../utils/tags.js';

interface LikeBody {
  placeId: string;
  name?: string;
  address?: string;
  rating?: number;
  tags?: string[];
}

export async function likesRoutes(fastify: FastifyInstance) {
  fastify.post('/v1/likes', async (request, reply) => {
    try {
      const user = (request as any).user;
      
      if (!user) {
        return reply.code(401).send({ error: 'Authentication required' });
      }

      const { placeId, name, address, rating, tags = [] } = request.body as LikeBody;

      if (!placeId) {
        return reply.code(400).send({ error: 'placeId is required' });
      }

      // Normalize tags
      const normalizedTags = normalizeTags(tags);

      // Upsert like
      const like = await prisma.userLike.upsert({
        where: {
          userId_placeId: {
            userId: user.userId,
            placeId
          }
        },
        update: {
          name,
          address,
          rating,
          tags: normalizedTags,
          updatedAt: new Date()
        },
        create: {
          userId: user.userId,
          placeId,
          name,
          address,
          rating,
          tags: normalizedTags
        }
      });

      return reply.send({
        success: true,
        like: {
          id: like.id,
          placeId: like.placeId,
          name: like.name,
          address: like.address,
          rating: like.rating,
          tags: like.tags,
          createdAt: like.createdAt,
          updatedAt: like.updatedAt
        }
      });
    } catch (error) {
      console.error('Like error:', error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });
}


