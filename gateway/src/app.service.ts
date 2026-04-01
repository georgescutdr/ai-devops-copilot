// gateway/src/app.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as k8s from '@kubernetes/client-node';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  private k8sClient: k8s.CoreV1Api;

  constructor(private readonly http: HttpService) {
    // Initialize Kubernetes client
    const kc = new k8s.KubeConfig();
    kc.loadFromDefault(); // loads ~/.kube/config or in-cluster config
    this.k8sClient = kc.makeApiClient(k8s.CoreV1Api);

    this.logger.log('Kubernetes client initialized');
  }

  // ============================
  // AI Orchestrator
  // ============================
  async ask(question: string) {
    try {
      this.logger.log(`Forwarding question to orchestrator: ${question}`);

      // Fetch logs & metrics from observability service
      const logsReq = firstValueFrom(this.http.get('http://observability:3002/logs'));
      const metricsReq = firstValueFrom(this.http.get('http://observability:3002/metrics'));

      const [logs, metrics] = await Promise.all([logsReq, metricsReq]);

      const response = await firstValueFrom(
        this.http.post('http://ai-engine:8000/analyze', {
          question,
          logs: logs.data,
          metrics: metrics.data,
        }),
      );

      this.logger.log('Received AI reasoning from ai-engine');
      return response.data;

    } catch (error: any) {
      this.logger.error('Error calling AI engine', error.message);
      return { answer: 'Failed to process request', error: error.message };
    }
  }

  // ============================
  // Kubernetes Operations
  // ============================

  /**
   * List pods in a namespace
   */
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
        containers: p.spec?.containers?.map(c => ({
          name: c.name,
        })),
      }));
    } catch (err: any) {
      this.logger.error('Failed to list pods', err.message);
      return { error: err.message };
    }
  }

  /**
   * Restart pods in a namespace
   */
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
}