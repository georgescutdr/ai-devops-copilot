import { Controller, Post, Get, Param, Body, Query, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { AppService } from './app.service';
import { AskDto } from './dto/ask.dto';
import { AskResponseDto } from './dto/ask-response.dto';
import { PodDto, PodRestartResponseDto } from './dto/pod.dto';

@ApiTags('AI & Kubernetes') // Group endpoints under this tag in Swagger
@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(private readonly appService: AppService) {}

  // ============================
  // AI Orchestrator
  // ============================
  @Post('ask')
  @ApiOperation({ summary: 'Ask AI a question' })
  @ApiBody({ type: AskDto })
  @ApiResponse({ status: 200, description: 'AI response', type: AskResponseDto })
  async ask(@Body() dto: AskDto): Promise<AskResponseDto> {
    this.logger.log(`Received AI question: ${dto.question}`);
    return this.appService.ask(dto.question);
  }

  // ============================
  // Kubernetes Operations
  // ============================
  @Get('pods')
  @ApiOperation({ summary: 'List all pods in a namespace' })
  @ApiQuery({ name: 'namespace', required: false, description: 'Namespace to list pods from', example: 'default' })
  @ApiResponse({ status: 200, description: 'List of pods', type: [PodDto] })
  async listPods(@Query('namespace') namespace?: string): Promise<PodDto[] | { error: string }> {
    const ns = namespace || 'default';
    this.logger.log(`Listing pods in namespace: ${ns}`);
    return this.appService.listPods(ns);
  }

  @Post('pods/:podName/restart')
  @ApiOperation({ summary: 'Restart a pod in a namespace' })
  @ApiParam({ name: 'podName', description: 'Name of the pod to restart', example: 'worker-abc123' })
  @ApiQuery({ name: 'namespace', required: false, description: 'Namespace of the pod', example: 'default' })
  @ApiResponse({ status: 200, description: 'Pod restart result', type: PodRestartResponseDto })
  async restartPod(
    @Param('podName') podName: string,
    @Query('namespace') namespace?: string
  ): Promise<PodRestartResponseDto> {
    const ns = namespace || 'default';
    this.logger.log(`Restart request for pod: ${podName} in namespace: ${ns}`);
    return this.appService.restartPod(ns, podName);
  }
}