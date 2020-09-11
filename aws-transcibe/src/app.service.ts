import { Injectable } from '@nestjs/common';

import * as AWS from 'aws-sdk';
import { AudioFile, TranscribeJob } from './app.interface';
@Injectable()
export class AppService {
  async uploadAudio(audio: AudioFile): Promise<TranscribeJob> {
    const credentials = new AWS.Credentials({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    });

    AWS.config.update({
      region: process.env.AWS_REGION,
      credentials: credentials,
    });

    const s3 = new AWS.S3();
    const params = {
      Bucket: `${process.env.AWS_S3_BUCKET_NAME}`,
      Key: audio.originalname,
      Body: audio.buffer,
      ContentType: audio.mimetype,
      ACL: 'public-read',
    };

    // Upload audio to s3Bucket
    const result = await s3.upload(params).promise();

    // Create aws transcribe job
    const transcribeService = new AWS.TranscribeService();

    const TranscriptionJobName = audio.originalname;

    const res = await transcribeService
      .startTranscriptionJob({
        LanguageCode: 'en-US',
        Media: {
          MediaFileUri: result.Location,
        },
        MediaFormat: result.Key.split('.').slice(-1)[0],
        TranscriptionJobName,
        // MediaSampleRateHertz: 8000, // normally 8000 if you are using wav file
        OutputBucketName: `${process.env.AWS_S3_BUCKET_NAME}-transcription`,
      })
      .promise();
    const transcribeJob: TranscribeJob = {
      jobName: res?.TranscriptionJob?.TranscriptionJobName,
      audioUri: res?.TranscriptionJob?.Media?.MediaFileUri,
      status: res?.TranscriptionJob?.TranscriptionJobStatus,
    };

    return transcribeJob;
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  async getTranscription(id: string) {
    const credentials = new AWS.Credentials({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    });

    AWS.config.update({
      region: process.env.AWS_REGION,
      credentials: credentials,
    });
    const s3 = new AWS.S3();
    try {
      const res = await s3
        .getObject({
          Bucket: `${process.env.AWS_S3_BUCKET_NAME}-transcription`,
          Key: `${id}.json`,
        })
        .promise();
      const file = JSON.parse(Buffer.from(res.Body).toString());
      return { ok: true, transcription: file.results };
    } catch (error) {
      console.log(error);
      return { ok: false, message: 'job have not done' };
    }
  }
}
