import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('WorkerBootstrap');
  const app = await NestFactory.createApplicationContext(AppModule);

  logger.log('🚀 TaskFlow Worker (taskflow-wrt-etl) is running and listening for BullMQ jobs...');

  // Handle graceful shutdown
  process.on('SIGTERM', async () => {
    logger.log('SIGTERM received. Closing worker context...');
    await app.close();
    process.exit(0);
  });
}
bootstrap();
