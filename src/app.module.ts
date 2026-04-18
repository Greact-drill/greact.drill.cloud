import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AlarmWidgetLogModule } from './alarm_widget_log/alarm_widget_log.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { KeycloakAuthGuard } from './auth/keycloak-auth.guard';
import { CurrentModule } from './current/current.module';
import { EdgeModule } from './edge/edge.module';
import { EdgeCustomizationModule } from './edge_customization/edge_customization.module';
import { HistoryModule } from './history/history.module';
import { IngestModule } from './ingest/ingest.module';
import { PrismaService } from './prisma.service';
import { TagModule } from './tag/tag.module';
import { TagAlarmLogModule } from './tag_alarm_log/tag_alarm_log.module';
import { TagCustomizationModule } from './tag_customization/tag_customization.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    HistoryModule,
    CurrentModule,
    IngestModule,
    EdgeModule,
    TagModule,
    EdgeCustomizationModule,
    TagCustomizationModule,
    TagAlarmLogModule,
    AlarmWidgetLogModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    {
      provide: APP_GUARD,
      useClass: KeycloakAuthGuard,
    },
  ],
})
export class AppModule {}
