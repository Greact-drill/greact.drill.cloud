import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HistoryModule } from './history/history.module';
import { CurrentModule } from './current/current.module';
import { IngestModule } from './ingest/ingest.module';
import { CleanupService } from './cleanup/cleanup.service';
import { PrismaService } from './prisma.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    HistoryModule,
    CurrentModule,
    IngestModule
  ],
  controllers: [AppController],
  providers: [AppService, CleanupService, PrismaService],
})
export class AppModule { }
