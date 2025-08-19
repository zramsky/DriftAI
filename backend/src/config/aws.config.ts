import { S3Client } from '@aws-sdk/client-s3';
import { SQSClient } from '@aws-sdk/client-sqs';
import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { TextractClient } from '@aws-sdk/client-textract';
import { ConfigService } from '@nestjs/config';

export const getS3Client = (configService: ConfigService): S3Client => {
  return new S3Client({
    region: configService.get('AWS_REGION'),
    credentials: {
      accessKeyId: configService.get('AWS_ACCESS_KEY_ID'),
      secretAccessKey: configService.get('AWS_SECRET_ACCESS_KEY'),
    },
  });
};

export const getSQSClient = (configService: ConfigService): SQSClient => {
  return new SQSClient({
    region: configService.get('AWS_REGION'),
    credentials: {
      accessKeyId: configService.get('AWS_ACCESS_KEY_ID'),
      secretAccessKey: configService.get('AWS_SECRET_ACCESS_KEY'),
    },
  });
};

export const getSecretsManagerClient = (configService: ConfigService): SecretsManagerClient => {
  return new SecretsManagerClient({
    region: configService.get('AWS_REGION'),
    credentials: {
      accessKeyId: configService.get('AWS_ACCESS_KEY_ID'),
      secretAccessKey: configService.get('AWS_SECRET_ACCESS_KEY'),
    },
  });
};

export const getTextractClient = (configService: ConfigService): TextractClient => {
  return new TextractClient({
    region: configService.get('AWS_REGION'),
    credentials: {
      accessKeyId: configService.get('AWS_ACCESS_KEY_ID'),
      secretAccessKey: configService.get('AWS_SECRET_ACCESS_KEY'),
    },
  });
};