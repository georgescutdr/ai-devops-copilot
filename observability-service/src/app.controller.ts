import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AppService } from './app.service';
import { LogsResponseDto } from './dto/logs-response.dto';
import { MetricsResponseDto } from './dto/metrics-response.dto';

@ApiTags('Observability')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('logs')
  @ApiOperation({ summary: 'Fetch recent container logs' })
  @ApiQuery({ name: 'container', required: false, example: 'worker', description: 'Container name' })
  @ApiResponse({ status: 200, description: 'Logs fetched successfully', type: LogsResponseDto })
  getLogs(@Query('container') container: string): Promise<LogsResponseDto> {
    return this.appService.getLogs(container);
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Fetch Prometheus metrics' })
  @ApiResponse({ status: 200, description: 'Metrics fetched successfully', type: MetricsResponseDto })
  getMetrics(): Promise<MetricsResponseDto> {
    return this.appService.getMetrics();
  }
}