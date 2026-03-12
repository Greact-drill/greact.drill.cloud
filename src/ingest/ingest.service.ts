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

      // Загружаем метаданные тегов для проверки аварий
      const tagRecords = await prisma.tag.findMany({
        where: { id: { in: uniqueTagIds } },
        select: { id: true, name: true, min: true, max: true, unit_of_measurement: true },
      });
      const tagMap = new Map(tagRecords.map((t) => [t.id, t]));

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

        // Запись в журнал аварий при выходе за min/max
        const tagMeta = tagMap.get(item.tag);
        if (tagMeta && typeof item.value === 'number') {
          const minVal = Number(tagMeta.min);
          const maxVal = Number(tagMeta.max);
          if (item.value < minVal) {
            await prisma.tagAlarmLog.create({
              data: {
                edge_id: item.edge,
                tag_id: item.tag,
                tag_name: tagMeta.name,
                value: item.value,
                min_limit: minVal,
                max_limit: maxVal,
                alarm_type: 'min',
                unit_of_measurement: tagMeta.unit_of_measurement || 'N/A',
                timestamp: timestampDate,
              },
            });
          } else if (item.value > maxVal) {
            await prisma.tagAlarmLog.create({
              data: {
                edge_id: item.edge,
                tag_id: item.tag,
                tag_name: tagMeta.name,
                value: item.value,
                min_limit: minVal,
                max_limit: maxVal,
                alarm_type: 'max',
                unit_of_measurement: tagMeta.unit_of_measurement || 'N/A',
                timestamp: timestampDate,
              },
            });
          }
        }
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
