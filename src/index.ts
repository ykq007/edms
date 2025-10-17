import { env } from './config/env';
import { createServer } from './server';

async function start() {
  const server = await createServer();

  try {
    await server.listen({
      port: env.PORT,
      host: env.HOST
    });
    server.log.info(`🚀 Server running on http://${env.HOST}:${env.PORT}`);
  } catch (error) {
    server.log.error(error);
    process.exit(1);
  }
}

void start();
