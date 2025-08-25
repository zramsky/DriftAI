import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller({ path: 'health', version: '1' })
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('live')
  liveness(): { status: string } {
    return { status: 'ok' };
  }

  @Get('ready')
  readiness(): { status: string } {
    return { status: 'ok' };
  }
}
