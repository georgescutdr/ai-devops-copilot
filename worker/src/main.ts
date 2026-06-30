// worker/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppService } from './app.service';
import * as amqp from 'amqplib';
import { Logger } from '@nestjs/common';

const logger = new Logger('Worker');

const RABBITMQ_URL =
  process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672';
const QUEUE_NAME =
  process.env.QUEUE_NAME || 'tasks.queue';

async function startWorker(appService: AppService) {
  while (true) {
    try {
      logger.log('Connecting to RabbitMQ...');

      const connection = await amqp.connect(RABBITMQ_URL);

      connection.on('error', (err) => {
        logger.error('RabbitMQ connection error', err);
      });

      connection.on('close', () => {
        logger.warn('RabbitMQ connection closed. Reconnecting...');
      });

      const channel = await connection.createChannel();

      // 👇 IMPORTANT: avoid flooding worker
      await channel.prefetch(1);

      await channel.assertQueue(QUEUE_NAME, {
        durable: true,
      });

      logger.log(`✅ Worker listening on queue: ${QUEUE_NAME}`);

      channel.consume(
        QUEUE_NAME,
        async (msg) => {
          if (!msg) return;

          let task: any;

          try {
            task = JSON.parse(msg.content.toString());
          } catch (err) {
            logger.error('Invalid JSON message, discarding');
            channel.nack(msg, false, false);
            return;
          }

          logger.log(`📩 Received task: ${JSON.stringify(task)}`);

          try {
            const result = await appService.processTask(task);
            logger.log(`✅ Task result: ${JSON.stringify(result)}`);

            channel.ack(msg);
          } catch (err: any) {
            logger.error(`❌ Task failed: ${err.message}`);

            // 👇 choose behavior
            channel.nack(msg, false, false); // discard
            // OR retry:
            // channel.nack(msg, false, true);
          }
        },
        { noAck: false },
      );

      // 👇 Keep process alive until connection dies
      await new Promise((resolve) => {
        connection.on('close', resolve);
      });

    } catch (err: any) {
      logger.error(`❌ RabbitMQ connection failed: ${err.message}`);
    }

    // 👇 retry delay
    logger.log('Retrying connection in 5 seconds...');
    await new Promise((res) => setTimeout(res, 5000));
  }
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const appService = app.get(AppService);

  // Graceful shutdown
  process.on('SIGINT', async () => {
    logger.warn('Shutting down worker...');
    await app.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    logger.warn('Shutting down worker...');
    await app.close();
    process.exit(0);
  });

  await startWorker(appService);
}

bootstrap();