import { Controller, Post, Body, Param } from '@nestjs/common';
import { IngestService } from './ingest.service';
import { IngestDataItemDto } from './dto/ingest-data.dto';
import { IngestRequestDto } from './dto/ingest-request.dto';

@Controller('ingest')
export class IngestController {
  constructor(private readonly ingestService: IngestService) { }

  @Post()
  async ingestData(@Body() data: IngestDataItemDto[]) {
    return this.ingestService.ingestData(data);
  }

  @Post(':edge') 
  async ingestDataWithRequest(
    @Param('edge') edge: string,
    @Body() body: IngestRequestDto
  ) {
    const dataForService: IngestDataItemDto[] = Object.entries(body.values).map(([tag, value]) => ({
      edge: edge,
      timestamp: body.timestamp,
      tag: tag,
      value: value,
    }));
    
    return this.ingestService.ingestData(dataForService);
  }
}
