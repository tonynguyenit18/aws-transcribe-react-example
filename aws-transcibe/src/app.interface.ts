export interface AudioFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

export interface TranscribeJob {
  jobName: string;
  audioUri: string;
  status: string;
}
