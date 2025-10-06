// src/sync/sync.controller.ts (новый файл)

import { Controller, Post, Query, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { TagService } from '../tag/tag.service'; 

@Controller('sync')
export class SyncController {
  private readonly currentApiBaseUrl: string;

  constructor(
    private readonly tagService: TagService,
    private readonly configService: ConfigService,
  ) {
    this.currentApiBaseUrl = this.configService.get<string>('CURRENT_API_BASE_URL')!;

    if (!this.currentApiBaseUrl) {
        throw new Error('CURRENT_API_BASE_URL is not defined in environment variables.');
    }
  }

  @Post('tags')
  async syncTagsFromCurrentApi(@Query('edge') edge: string = 'real') {
    const apiUrl = `${this.currentApiBaseUrl}/api/current?edge=${edge}`;
    
    try {
      const response = await axios.get<{ [tagId: string]: number }>(apiUrl);
      const tagsData = response.data;
      const tagIds = Object.keys(tagsData);

      if (tagIds.length === 0) {
        return { message: 'No tags found in the API response.', count: 0 };
      }

      await this.tagService.upsertTagsFromApi(tagIds);

      return { 
        message: `Successfully upserted ${tagIds.length} tags for edge: ${edge}`, 
        count: tagIds.length 
      };

    } catch (error) {
      console.error(`Error during tag sync for edge ${edge}:`, error.message);
      throw new InternalServerErrorException('Failed to sync tags from external API.');
    }
  }
}