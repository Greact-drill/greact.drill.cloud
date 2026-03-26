import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { IngestDataItemDto } from './dto/ingest-data.dto';

@Injectable()
export class IngestService {
  constructor(private prisma: PrismaService) { }

  private isAlarmWidgetValueActive(value: number | null | undefined): boolean {
    return value === 1;
  }

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

      const uniquePairs = Array.from(
        new Map(
          data.map((d) => [`${d.edge}|${d.tag}`, { edge_id: d.edge, tag_id: d.tag }]),
        ).values(),
      );
      const widgetRows =
        uniquePairs.length > 0
          ? await prisma.tag_customization.findMany({
              where: {
                key: 'widgetConfig',
                OR: uniquePairs.map((p) => ({ edge_id: p.edge_id, tag_id: p.tag_id })),
              },
              select: { edge_id: true, tag_id: true, value: true },
            })
          : [];
      const alarmWidgetPairSet = new Set<string>();
      for (const row of widgetRows) {
        try {
          const cfg = JSON.parse(row.value) as { widgetType?: string };
          if (cfg.widgetType === 'alarm') {
            alarmWidgetPairSet.add(`${row.edge_id}|${row.tag_id}`);
          }
        } catch {
          /* ignore invalid JSON */
        }
      }

      for (const item of data) {
        // Конвертируем timestamp из числа в Date
        const timestampDate = new Date(item.timestamp);

        // Получаем предыдущее значение ДО обновления (для проверки перехода в аварию)
        const prevCurrent = await prisma.current.findUnique({
          where: {
            edge_tag: { edge: item.edge, tag: item.tag },
          },
          select: { value: true },
        });

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

        // Запись в журнал только при ПЕРЕХОДЕ в аварию (предыдущее значение было в норме)
        const tagMeta = tagMap.get(item.tag);
        if (tagMeta && typeof item.value === 'number') {
          const minVal = Number(tagMeta.min);
          const maxVal = Number(tagMeta.max);
          const prevInRange = prevCurrent != null && prevCurrent.value >= minVal && prevCurrent.value <= maxVal;
          const prevUnknown = prevCurrent == null;
          const isAlarmWidgetTag = alarmWidgetPairSet.has(`${item.edge}|${item.tag}`);

          if (!isAlarmWidgetTag && item.value < minVal && (prevInRange || prevUnknown)) {
            await prisma.tagAlarmLog.create({
              data: {
                edge_id: item.edge,
                tag_id: item.tag,
                tag_name: tagMeta.name,
                journal_type: 'indicator',
                value: item.value,
                min_limit: minVal,
                max_limit: maxVal,
                alarm_type: 'min',
                unit_of_measurement: tagMeta.unit_of_measurement || 'N/A',
                timestamp: timestampDate,
              },
            });
          } else if (!isAlarmWidgetTag && item.value > maxVal && (prevInRange || prevUnknown)) {
            await prisma.tagAlarmLog.create({
              data: {
                edge_id: item.edge,
                tag_id: item.tag,
                tag_name: tagMeta.name,
                journal_type: 'indicator',
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

        const alarmKey = `${item.edge}|${item.tag}`;
        if (alarmWidgetPairSet.has(alarmKey) && typeof item.value === 'number') {
          const prevVal = prevCurrent?.value;
          const alarmActiveNow = this.isAlarmWidgetValueActive(item.value);
          const alarmWasInactive = prevVal == null || !this.isAlarmWidgetValueActive(prevVal);
          if (alarmActiveNow && alarmWasInactive) {
            const tagMeta = tagMap.get(item.tag);
            await prisma.tagAlarmLog.create({
              data: {
                edge_id: item.edge,
                tag_id: item.tag,
                tag_name: tagMeta?.name ?? item.tag,
                journal_type: 'alarm',
                value: item.value,
                min_limit: 0,
                max_limit: 1,
                alarm_type: 'max',
                unit_of_measurement: tagMeta?.unit_of_measurement || 'N/A',
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
