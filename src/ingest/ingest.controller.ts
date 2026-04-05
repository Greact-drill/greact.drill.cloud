import { Body, Controller, Param, Post } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { IngestDataItemDto } from './dto/ingest-data.dto';
import { IngestRequestDto } from './dto/ingest-request.dto';
import { IngestService } from './ingest.service';

@Controller('ingest')
export class IngestController {
  constructor(private readonly ingestService: IngestService) {}

  @Public()
  @Post()
  async ingestData(@Body() data: IngestDataItemDto[]) {
    return this.ingestService.ingestData(data);
  }

  @Public()
  @Post(':edge')
  async ingestDataWithRequest(
    @Param('edge') edge: string,
    @Body() body: IngestRequestDto,
  ) {
    const dataForService: IngestDataItemDto[] = Object.entries(body.values).map(([tag, value]) => ({
      edge,
      timestamp: body.timestamp,
      tag,
      value,
    }));

    return this.ingestService.ingestData(dataForService);
  }
}
