import { Module } from '@nestjs/common';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_PIPE, Reflector } from '@nestjs/core';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './service-modules/prisma/prisma.module.js';
import { ChessModule } from './api-modules/chess/chess.module.js';
import { AgentModule } from './api-modules/agent/agent.module.js';
import { MatchModule } from './api-modules/match/match.module.js';
import { BigIntSerializerInterceptor } from './interceptors/big-int-serializer.interceptor.js';

@Module({
  imports: [PrismaModule, ChessModule, AgentModule, MatchModule],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useFactory: (reflector: Reflector) =>
        new ClassSerializerInterceptor(reflector),
      inject: [Reflector],
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: BigIntSerializerInterceptor,
    },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    },
  ],
})
export class AppModule {}
