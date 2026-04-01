import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(private readonly http: HttpService) {}

  getHello(): string {
    return 'Hello from Orchestrator';
  }

  async analyze(question: string) {
    try {
      this.logger.log(`Analyzing question: ${question}`);

      // Fetch logs + metrics in parallel (faster)
      const [logsRes, metricsRes] = await Promise.all([
        firstValueFrom(
          this.http.get('http://observability:3002/logs', {
            timeout: 3000,
          }),
        ),
        firstValueFrom(
          this.http.get('http://observability:3002/metrics', {
            timeout: 3000,
          }),
        ),
      ]);

      this.logger.log('Fetched logs and metrics');

      // Send to AI engine
      const aiRes = await firstValueFrom(
        this.http.post(
          'http://ai-engine:8000/analyze',
          {
            question,
            logs: logsRes.data,
            metrics: metricsRes.data,
          },
          {
            timeout: 5000,
          },
        ),
      );

      this.logger.log('Received response from AI engine');

      return aiRes.data;

    } catch (error: any) {
      this.logger.error('Analysis failed', error.message);

      return {
        answer: 'System analysis failed',
        error: error.message,
      };
    }
  }
}