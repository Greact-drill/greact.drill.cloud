import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';

const MAX_RECORDS = 100_000;
const CRON_EXPRESSION = '0 2 * * *'; // каждый день в 2:00

@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);

  constructor(private prisma: PrismaService) { }

  @Cron(CRON_EXPRESSION)
  async cleanupHistorySQL() {
    this.logger.log('Starting history cleanup...');

    // Получаем текущее количество записей
    const count = await this.prisma.history.count();

    if (count <= MAX_RECORDS) {
      this.logger.log(`Records: ${count}/${MAX_RECORDS} - OK, cleanup not needed`);
      return;
    }

    const toDelete = count - MAX_RECORDS;
    this.logger.log(`Records: ${count}/${MAX_RECORDS} - Need to delete ${toDelete} old records`);

    // Прямое SQL-удаление самых старых записей (более производительно)
    const result = await this.prisma.$executeRaw`
      DELETE FROM history 
      WHERE id IN (
        SELECT id FROM history 
        ORDER BY timestamp ASC 
        LIMIT ${toDelete}
      )
    `;

    this.logger.log(`Successfully deleted ${toDelete} old records. Remaining: ${MAX_RECORDS}`);

  }

}
