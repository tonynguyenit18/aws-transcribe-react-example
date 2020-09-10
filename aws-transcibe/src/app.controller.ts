/* eslint-disable @typescript-eslint/no-var-requires */
import {
  Controller,
  Get,
  Post,
  UseInterceptors,
  UploadedFile,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AppService } from './app.service';
import { AudioFile, TranscribeJob } from './app.interface';

@Controller('aws')
export class AppController {
  constructor(private readonly appService: AppService) {}
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAudio(@UploadedFile() audio: AudioFile): Promise<TranscribeJob> {
    return this.appService.uploadAudio(audio);
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  @Get('transcription/:id')
  async getTranscription(@Param('id') id: string) {
    return this.appService.getTranscription(id);
  }
}
