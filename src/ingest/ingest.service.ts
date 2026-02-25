import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { IngestDataItemDto } from './dto/ingest-data.dto';

@Injectable()
export class IngestService {
  constructor(private prisma: PrismaService) { }

  async ingestData(data: IngestDataItemDto[]) {
    // Начинаем транзакцию для атомарности операций
    return this.prisma.$transaction(async (prisma) => {
      const historyResults = [];
      const currentResults = [];
      const uniqueTagIds = Array.from(new Set(data.map(item => item.tag).filter(Boolean)));

      if (uniqueTagIds.length) {
        await Promise.all(
          uniqueTagIds.map(tagId =>
            prisma.tag.upsert({
              where: { id: tagId },
              update: {},
              create: {
                id: tagId,
                name: tagId,
                min: 0,
                max: 100,
                comment: 'Auto-created by ingest',
                unit_of_measurement: 'N/A',
              },
            })
          )
        );
      }

      for (const item of data) {
        // Конвертируем timestamp из числа в Date
        const timestampDate = new Date(item.timestamp);

        // Сохраняем в таблицу History
        const historyRecord = await prisma.history.create({
          data: {
            edge: item.edge,
            timestamp: timestampDate,
            tag: item.tag,
            value: item.value,
          },
        });
        historyResults.push(historyRecord);

        // Обновляем или создаем запись в таблице Current
        const currentRecord = await prisma.current.upsert({
          where: {
            edge_tag: {
              edge: item.edge,
              tag: item.tag,
            },
          },
          update: {
            value: item.value,
            updatedAt: new Date(),
          },
          create: {
            edge: item.edge,
            tag: item.tag,
            value: item.value,
          },
        });
        currentResults.push(currentRecord);
      }

      return [
        {
        //historyRecords: historyResults,
        //currentRecords: currentResults,
          processed: data.length,
        }
      ];
    });
  }
}
