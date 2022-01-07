import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { configure as serverlessExpress } from '@vendia/serverless-express';
import { Callback, Context, Handler } from 'aws-lambda';
import { AppModule } from './app.module';

let server: Handler;

function setupSwagger(nestApp: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Sample API')
    .setDescription('Sample API Documentation')
    .setVersion('0.0.1')
    .addServer('/dev')
    .build();

  const document = SwaggerModule.createDocument(nestApp, config);

  SwaggerModule.setup('/swagger', nestApp, document, {
    customSiteTitle: 'Sample',
    swaggerOptions: {
      docExpansion: 'none',
      operationSorter: 'alpha',
      tagSorter: 'alpha',
    },
  });
}

async function bootstrap(): Promise<Handler> {
  const app = await NestFactory.create(AppModule);

  setupSwagger(app);
  await app.init();

  const expressApp = app.getHttpAdapter().getInstance();
  return serverlessExpress({ app: expressApp });
}

export const handler: Handler = async (
  event: any,
  context: Context,
  callback: Callback,
) => {
  event.path = `${event.path}/`;
  event.path = event.path.includes('swagger-ui')
    ? `swagger${event.path}`
    : event.path;

  server = server ?? (await bootstrap());

  return server(event, context, callback);
};
