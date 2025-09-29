import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HistoryModule } from './history/history.module';
import { CurrentModule } from './current/current.module';
import { IngestModule } from './ingest/ingest.module';
import { CleanupService } from './cleanup/cleanup.service';
import { PrismaService } from './prisma.service';
import { EdgeModule } from './edge/edge.module';
import { BlockModule } from './block/block.module';
import { TagModule } from './tag/tag.module';
import { EdgeCustomizationModule } from './edge_customization/edge_customization.module';
import { BlockCustomizationModule } from './block_customization/block_customization.module';
import { TagCustomizationModule } from './tag_customization/tag_customization.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    HistoryModule,
    CurrentModule,
    IngestModule,
    EdgeModule,
    BlockModule,
    TagModule,
    EdgeCustomizationModule,
    BlockCustomizationModule,
    TagCustomizationModule
  ],
  controllers: [AppController],
  providers: [AppService, CleanupService, PrismaService],
})
export class AppModule { }
