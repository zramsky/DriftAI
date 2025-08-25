import { S3Client } from '@aws-sdk/client-s3';
import { SQSClient } from '@aws-sdk/client-sqs';
import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { TextractClient } from '@aws-sdk/client-textract';
import { ConfigService } from '@nestjs/config';

export const getS3Client = (configService: ConfigService): S3Client => {
  const region = configService.get<string>('AWS_REGION') ?? 'us-east-1';
  const accessKeyId = configService.get<string>('AWS_ACCESS_KEY_ID') ?? '';
  const secretAccessKey = configService.get<string>('AWS_SECRET_ACCESS_KEY') ?? '';
  return new S3Client({
    region,
    credentials: accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined,
  });
};

export const getSQSClient = (configService: ConfigService): SQSClient => {
  const region = configService.get<string>('AWS_REGION') ?? 'us-east-1';
  const accessKeyId = configService.get<string>('AWS_ACCESS_KEY_ID') ?? '';
  const secretAccessKey = configService.get<string>('AWS_SECRET_ACCESS_KEY') ?? '';
  return new SQSClient({
    region,
    credentials: accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined,
  });
};

export const getSecretsManagerClient = (configService: ConfigService): SecretsManagerClient => {
  const region = configService.get<string>('AWS_REGION') ?? 'us-east-1';
  const accessKeyId = configService.get<string>('AWS_ACCESS_KEY_ID') ?? '';
  const secretAccessKey = configService.get<string>('AWS_SECRET_ACCESS_KEY') ?? '';
  return new SecretsManagerClient({
    region,
    credentials: accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined,
  });
};

export const getTextractClient = (configService: ConfigService): TextractClient => {
  const region = configService.get<string>('AWS_REGION') ?? 'us-east-1';
  const accessKeyId = configService.get<string>('AWS_ACCESS_KEY_ID') ?? '';
  const secretAccessKey = configService.get<string>('AWS_SECRET_ACCESS_KEY') ?? '';
  return new TextractClient({
    region,
    credentials: accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined,
  });
};