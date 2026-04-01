import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as k8s from '@kubernetes/client-node';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);
  private k8sClient: k8s.CoreV1Api;

  constructor(private readonly http: HttpService) {
    // Initialize Kubernetes client
    const kc = new k8s.KubeConfig();
    kc.loadFromDefault(); // ~/.kube/config or in-cluster config
    this.k8sClient = kc.makeApiClient(k8s.CoreV1Api);

    this.logger.log('Kubernetes client initialized');
  }

  // ============================
  // Observability
  // ============================

  async getLogs(container: string = 'worker') {
    try {
      this.logger.log(`Fetching logs for container: ${container}`);

      const { stdout } = await execAsync(
        `kubectl logs deployment/${container} -n ai-assistant --tail=50`
      );

      return { container, logs: stdout };
    } catch (err: any) {
      this.logger.error('Failed to fetch logs', err.message);
      return { container, logs: '', error: err.message };
    }
  }

  async getMetrics() {
    try {
      const response = await firstValueFrom(
        this.http.get('http://observability:3002/metrics')
      );

      return response.data;
    } catch (err: any) {
      this.logger.error('Failed to fetch metrics', err.message);
      return { error: err.message };
    }
  }

  // ============================
  // AI Processing
  // ============================

  async analyze(question: string) {
    try {
      this.logger.log(`Sending question to AI engine: ${question}`);

      const [logs, metrics] = await Promise.all([
        this.getLogs(),
        this.getMetrics(),
      ]);

      const response = await firstValueFrom(
        this.http.post('http://ai-engine:8000/analyze', {
          question,
          logs: logs.logs,
          metrics,
        }),
      );

      this.logger.log('Received AI analysis result');
      return response.data;
    } catch (err: any) {
      this.logger.error('AI analysis failed', err.message);
      return { answer: 'AI engine unavailable', error: err.message };
    }
  }

  // ============================
  // Kubernetes Operations
  // ============================

  async listPods(namespace = 'default') {
    try {
      this.logger.log(`Listing pods in namespace: ${namespace}`);

      const res = await this.k8sClient.listNamespacedPod({
        namespace,
      });

      return res.items.map(p => ({
        name: p.metadata?.name ?? 'unknown',
        status: p.status?.phase ?? 'unknown',
        node: p.spec?.nodeName,
        containers: p.spec?.containers?.map(c => c.name) ?? [],
      }));
    } catch (err: any) {
      this.logger.error('Failed to list pods', err.message);
      return { error: err.message };
    }
  }

  async restartPod(namespace: string, podName: string) {
    try {
      this.logger.log(`Restarting pod: ${podName} in namespace: ${namespace}`);

      await this.k8sClient.deleteNamespacedPod({
        name: podName,
        namespace,
      });

      return {
        message: `Pod ${podName} deleted; a new pod will be scheduled automatically.`,
      };
    } catch (err: any) {
      this.logger.error(`Failed to restart pod ${podName}`, err.message);
      return { error: err.message };
    }
  }

  // ============================
  // Background job processor (RabbitMQ)
  // ============================

  async processTask(task: any) {
    this.logger.log(`Processing task: ${JSON.stringify(task)}`);

    try {
      if (task.type === 'ai-analysis') {
        const result = await this.analyze(task.question);
        this.logger.log(`AI result: ${JSON.stringify(result)}`);
        return result;
      }

      if (task.type === 'restart-pod') {
        const result = await this.restartPod(task.namespace, task.podName);
        this.logger.log(`Restart result: ${JSON.stringify(result)}`);
        return result;
      }

      this.logger.warn(`Unknown task type: ${task.type}`);
      return { error: 'Unknown task type' };

    } catch (err: any) {
      this.logger.error('Task processing failed', err.message);
      return { error: err.message };
    }
  }
}