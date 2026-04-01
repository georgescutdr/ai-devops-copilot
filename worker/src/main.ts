// worker/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppService } from './app.service';
import * as amqp from 'amqplib';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const appService = app.get(AppService);
  const logger = new Logger('Worker');

  const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672';
  const QUEUE_NAME = process.env.QUEUE_NAME || 'tasks.queue';

  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    await channel.assertQueue(QUEUE_NAME, { durable: true });

    logger.log(`Worker listening on queue: ${QUEUE_NAME}`);

    channel.consume(
      QUEUE_NAME,
      async (msg) => {
        if (msg) {
          const task = JSON.parse(msg.content.toString());
          logger.log(`Received task: ${JSON.stringify(task)}`);

          try {
            const result = await appService.processTask(task);
            logger.log(`Task result: ${JSON.stringify(result)}`);
            channel.ack(msg);
          } catch (err: any) {
            logger.error(`Task failed: ${err.message}`);
            channel.nack(msg, false, false); // discard failed task
          }
        }
      },
      { noAck: false },
    );
  } catch (err: any) {
    logger.error(`Failed to connect to RabbitMQ: ${err.message}`);
    process.exit(1);
  }
}

bootstrap();