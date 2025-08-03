import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export class S3Service {
  private client: S3Client;
  private bucketName: string;

  constructor() {
    this.client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
    });
    this.bucketName = process.env.S3_BUCKET_NAME || `sleep-tracker-api-${process.env.STAGE || 'dev'}-audio-files`;
  }

  async uploadAudioFile(
    audioBuffer: ArrayBuffer,
    fileName: string,
    contentType: string = 'audio/mpeg'
  ): Promise<string> {
    try {
      const key = `audios/${Date.now()}-${fileName}`;
      
      await this.client.send(new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: new Uint8Array(audioBuffer),
        ContentType: contentType,
        Metadata: {
          uploadedAt: new Date().toISOString(),
        }
      }));

      // Return the S3 URL
      return `https://${this.bucketName}.s3.amazonaws.com/${key}`;
    } catch (error) {
      console.error('Error uploading audio file to S3:', error);
      throw new Error('Failed to upload audio file');
    }
  }

  async getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      return await getSignedUrl(this.client, command, { expiresIn });
    } catch (error) {
      console.error('Error generating presigned URL:', error);
      throw new Error('Failed to generate download URL');
    }
  }

  async deleteAudioFile(key: string): Promise<void> {
    try {
      await this.client.send(new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      }));
    } catch (error) {
      console.error('Error deleting audio file from S3:', error);
      throw new Error('Failed to delete audio file');
    }
  }

  extractKeyFromUrl(url: string): string {
    // Extract the S3 key from a full S3 URL
    const urlParts = url.split('/');
    return urlParts.slice(3).join('/'); // Remove https://bucket-name.s3.amazonaws.com/
  }
}

export const s3Service = new S3Service();
