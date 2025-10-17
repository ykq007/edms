import Fastify, { type FastifyInstance, type FastifyServerOptions } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';

import { env } from './config/env';

function createLogger(): FastifyServerOptions['logger'] {
  if (env.NODE_ENV !== 'development') {
    return true;
  }

  return {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname'
      }
    }
  };
}

export async function createServer(): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: createLogger()
  });

  await fastify.register(cors);
  await fastify.register(helmet);
  await fastify.register(sensible);
  await fastify.register(multipart);
  await fastify.register(jwt, {
    secret: env.JWT_SECRET
  });
  await fastify.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_TIME_WINDOW
  });

  fastify.get('/health', async () => ({
    status: 'ok'
  }));

  return fastify;
}
