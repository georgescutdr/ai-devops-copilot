import { Controller, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('analyze')
  async analyze(@Body('question') question: string) {
    return this.appService.analyze(question);
  }
}