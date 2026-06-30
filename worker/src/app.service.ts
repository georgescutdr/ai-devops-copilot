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
    const kc = new k8s.KubeConfig();
    try {
      kc.loadFromDefault(); // ~/.kube/config or in-cluster
      this.k8sClient = kc.makeApiClient(k8s.CoreV1Api);
      this.logger.log('Kubernetes client initialized');
    } catch (err: any) {
      this.logger.error('Failed to initialize Kubernetes client', err.message);
    }
  }

  // ============================
  // Observability
  // ============================

  async getLogs(container: string = 'worker') {
    try {
      this.logger.log(`Fetching logs for container: ${container}`);

      // Correct usage: listNamespacedPod expects an options object
      const pods = await this.k8sClient.listNamespacedPod({
        namespace: 'ai-assistant',
        labelSelector: `app=${container}`,
      });

      const runningPod = pods.items.find(p => p.status?.phase === 'Running');
      if (!runningPod) {
        this.logger.warn(`No running pod found for ${container}`);
        return { container, logs: 'No running pod logs available' };
      }

      const podName = runningPod.metadata?.name!;
      const { stdout } = await execAsync(`kubectl logs ${podName} -n ai-assistant --tail=50`);
      return { container, logs: stdout || 'No logs available' };
    } catch (err: any) {
      this.logger.error(`Failed to fetch logs for ${container}`, err.message);
      return { container, logs: 'Error fetching logs', error: err.message };
    }
  }

  async getMetrics() {
    try {
      const response = await firstValueFrom(this.http.get('http://observability:3002/metrics'));
      return response.data || { cpu: 0, memory: 0 };
    } catch (err: any) {
      this.logger.error('Failed to fetch metrics', err.message);
      return { cpu: 0, memory: 0, error: err.message };
    }
  }

  // ============================
  // AI Processing
  // ============================

  async analyze(question: string) {
    try {
      this.logger.log(`Analyzing question: ${question}`);

      // Automatically get runtime data
      const [logs, metrics] = await Promise.all([this.getLogs(), this.getMetrics()]);

      // Build payload for AI engine
      const payload = {
        question,
        logs: logs.logs || 'No logs available',
        metrics: metrics || { cpu: 0, memory: 0 },
      };

      const response = await firstValueFrom(
        this.http.post('http://ai-engine:8000/analyze', payload),
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

  async listPods(namespace = 'ai-assistant') {
    try {
      this.logger.log(`Listing pods in namespace: ${namespace}`);

      const res = await this.k8sClient.listNamespacedPod({ namespace });
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

      // Correct usage: deleteNamespacedPod expects an options object
      await this.k8sClient.deleteNamespacedPod({ name: podName, namespace });

      return { message: `Pod ${podName} deleted; a new pod will be scheduled automatically.` };
    } catch (err: any) {
      this.logger.error(`Failed to restart pod ${podName}`, err.message);
      return { error: err.message };
    }
  }

  // ============================
  // Background Job Processor (RabbitMQ)
  // ============================

  async processTask(task: any) {
    this.logger.log(`Processing task: ${JSON.stringify(task)}`);

    try {
      switch (task.type) {
        case 'ai-analysis':
          return await this.analyze(task.question);

        case 'restart-pod':
          return await this.restartPod(task.namespace, task.podName);

        default:
          this.logger.warn(`Unknown task type: ${task.type}`);
          return { error: 'Unknown task type' };
      }
    } catch (err: any) {
      this.logger.error('Task processing failed', err.message);
      return { error: err.message };
    }
  }
}