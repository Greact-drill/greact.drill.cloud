import { Controller, Post, Body } from '@nestjs/common';
import { IngestService } from './ingest.service';
import { IngestDataItemDto } from './dto/ingest-data.dto';

@Controller('ingest')
export class IngestController {
  constructor(private readonly ingestService: IngestService) { }

  @Post()
  async ingestData(@Body() data: IngestDataItemDto[]) {
    return this.ingestService.ingestData(data);
  }
}
