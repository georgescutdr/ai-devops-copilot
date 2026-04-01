import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import axios from 'axios';

const execAsync = promisify(exec);

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  private readonly namespace = process.env.K8S_NAMESPACE || 'ai-assistant';
  private readonly defaultContainer = process.env.DEFAULT_CONTAINER || 'worker';
  private readonly prometheusUrl = process.env.PROMETHEUS_URL || 'http://prometheus:9090';

  // -------------------------
  // LOGS (Kubernetes)
  // -------------------------
  async getLogs(container: string = this.defaultContainer) {
    try {
      this.logger.log(`Fetching logs for container: ${container}`);

      const { stdout } = await execAsync(
        `kubectl logs deployment/${container} -n ${this.namespace} --tail=50`
      );

      return { container, logs: stdout };
    } catch (error: any) {
      this.logger.error(`Failed to fetch logs for ${container}`, error.message);
      return { container, logs: '', error: error.message };
    }
  }

  // -------------------------
  // METRICS (Prometheus)
  // -------------------------
  async getMetrics() {
    try {
      const response = await axios.get(`${this.prometheusUrl}/api/v1/query`, {
        params: { query: 'rate(container_cpu_usage_seconds_total[1m])' },
      });

      return { data: response.data };
    } catch (error: any) {
      this.logger.error('Failed to fetch metrics', error.message);
      return { data: null, error: error.message };
    }
  }
}