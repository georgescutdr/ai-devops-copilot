# AI DevOps Copilot

![Python](https://img.shields.io/badge/Python-3.12-blue?logo=python)
![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi)
![Kubernetes](https://img.shields.io/badge/Kubernetes-1.30-326CE5?logo=kubernetes)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)
![RabbitMQ](https://img.shields.io/badge/RabbitMQ-3.13-FF6600?logo=rabbitmq)
![License](https://img.shields.io/badge/License-MIT-green)

An AI-powered cloud-native DevOps assistant that combines **Kubernetes**, **observability**, and a **local Large Language Model (Ollama)** to analyze infrastructure issues, identify root causes, recommend fixes, and automatically recover services from critical failures.

---

## Overview

Modern Kubernetes environments generate massive amounts of logs and metrics, making troubleshooting increasingly complex. AI DevOps Copilot streamlines incident investigation by collecting runtime data from the cluster, sending it to a locally hosted LLM, and returning structured diagnostics with actionable recommendations.

For high-severity incidents, the platform can automatically trigger Kubernetes remediation actions such as restarting deployments.

The project demonstrates cloud-native architecture, distributed systems, observability, AI integration, and Kubernetes automation.

---

# Table of Contents

- Features
- Architecture
- System Workflow
- Technology Stack
- Project Structure
- Installation
- Running the Project
- Kubernetes Deployment
- API Documentation
- AI Workflow
- Environment Variables
- Security
- Future Roadmap
- Contributing
- License

---

# Features

## AI Analysis

- Analyze Kubernetes logs
- Analyze Prometheus metrics
- Detect root causes
- Generate structured remediation suggestions
- Severity classification
- JSON-formatted AI responses

---

## Kubernetes Operations

- List pods
- Restart pods
- Automatic deployment restart
- RBAC-secured cluster access

---

## Observability

- Collect Kubernetes logs
- Retrieve Prometheus metrics
- Runtime monitoring

---

## AI

- Local LLM using Ollama
- Structured prompting
- Deterministic JSON parsing
- Automatic severity detection

---

## Background Processing

- RabbitMQ worker
- Asynchronous tasks
- Infrastructure automation

---

# Architecture

```text
                          User
                           │
                           │
                  REST API Request
                           │
                           ▼
                  +-----------------+
                  |     Gateway     |
                  |     NestJS      |
                  +--------+--------+
                           │
                           ▼
                 +-------------------+
                 |   Orchestrator    |
                 |      NestJS       |
                 +--------+----------+
                          │
          ┌───────────────┴──────────────┐
          │                              │
          ▼                              ▼
 +------------------+            +------------------+
 | Observability    |            |    AI Engine     |
 |      NestJS      |            | FastAPI/Python   |
 +--------+---------+            +--------+---------+
          │                               │
          ▼                               ▼
 Kubernetes API                    Ollama (Phi-3)
          │
          ▼
 Cluster Logs / Metrics

                          │
                          ▼
                    RabbitMQ Worker
```

---

# System Workflow

1. User submits a DevOps question.

2. Gateway receives the request.

3. Gateway forwards it to the Orchestrator.

4. Orchestrator retrieves:

- Kubernetes logs
- Runtime metrics

5. Runtime context is sent to the AI Engine.

6. AI Engine builds a prompt and sends it to Ollama.

7. Ollama analyzes the infrastructure state.

8. AI Engine returns structured JSON.

9. If the incident severity is **High**, the deployment is restarted automatically.

10. The final response is returned to the client.

---

# Microservices

## Gateway

Public entry point into the platform.

Responsibilities:

- REST API
- Swagger documentation
- Request validation
- Kubernetes endpoints
- Routes requests to the orchestrator

---

## Orchestrator

Coordinates the entire workflow.

Responsibilities:

- Retrieve logs
- Retrieve metrics
- Build AI context
- Send requests to AI Engine
- Process background tasks

---

## Observability

Collects runtime information from Kubernetes.

Responsibilities:

- Kubernetes logs
- Prometheus metrics
- Runtime diagnostics

---

## AI Engine

Python service responsible for infrastructure reasoning.

Responsibilities:

- Prompt engineering
- Ollama communication
- JSON parsing
- Severity detection
- Automatic remediation

Example response:

```json
{
  "root_cause": "Worker crashed because RabbitMQ connection failed.",
  "issue": "Connection refused",
  "fix": "Verify RabbitMQ availability and restart worker deployment.",
  "severity": "high"
}
```

---

## Worker

RabbitMQ consumer responsible for asynchronous jobs.

Responsibilities:

- AI analysis jobs
- Kubernetes restart tasks
- Background processing

---

## Ollama

Runs the local language model.

Current model:

```
phi3
```

---

# Technology Stack

| Technology | Purpose |
|------------|---------|
| NestJS | Backend services |
| FastAPI | AI Engine |
| Python | AI processing |
| TypeScript | Backend development |
| Kubernetes | Container orchestration |
| Docker | Containerization |
| RabbitMQ | Background jobs |
| Prometheus | Metrics |
| Ollama | Local LLM |
| Swagger | API documentation |

---

# Project Structure

```text
.
├── ai-engine/
│   └── FastAPI AI service
│
├── gateway/
│   └── Public REST API
│
├── orchestrator/
│   └── Workflow coordinator
│
├── observability/
│   └── Logs & metrics
│
├── worker/
│   └── RabbitMQ consumer
│
├── k8s/
│   ├── ai-engine.yaml
│   ├── gateway.yaml
│   ├── observability.yaml
│   ├── orchestrator.yaml
│   ├── rabbitmq.yaml
│   ├── worker.yaml
│   ├── ollama.yaml
│   └── rbac.yaml
│
├── docker-compose.yml
└── README.md
```

---

# Installation

## Prerequisites

- Docker
- Docker Compose
- Kubernetes (Minikube or Kind)
- kubectl
- Node.js 22+
- Python 3.12+

---

## Clone Repository

```bash
git clone https://github.com/yourusername/ai-devops-copilot.git

cd ai-devops-copilot
```

---

## Build Containers

```bash
docker compose build
```

---

## Start Services

```bash
docker compose up
```

---

# Kubernetes Deployment

Deploy every service:

```bash
kubectl apply -f k8s/
```

Verify:

```bash
kubectl get pods -n ai-assistant
```

Expected services:

- gateway
- orchestrator
- observability
- ai-engine
- worker
- rabbitmq
- ollama

---

# API Documentation

Swagger is available after deployment.

Example endpoint:

```
POST /ask
```

Request:

```json
{
  "question": "Why is my worker restarting?"
}
```

Example response:

```json
{
  "answer": "Analyzed: Why is my worker restarting?",
  "insight": {
    "root_cause": "...",
    "issue": "...",
    "fix": "...",
    "severity": "high"
  },
  "auto_restart": {
    "success": true
  }
}
```

---

## Kubernetes Operations

### List Pods

```
GET /pods
```

Optional query:

```
namespace=ai-assistant
```

---

### Restart Pod

```
POST /pods/{podName}/restart
```

---

### AI Analysis

```
POST /analyze
```

---

# AI Workflow

The AI Engine builds prompts using:

- User question
- Kubernetes logs
- Runtime metrics

Example prompt:

```
Question:
Why is my worker crashing?

Logs:
...

Metrics:
...
```

The LLM returns structured JSON:

```json
{
  "root_cause":"",
  "issue":"",
  "fix":"",
  "severity":"high"
}
```

The application safely parses the response and performs automated remediation when configured.

---

# Automatic Recovery

When the AI Engine classifies an incident as **High** severity:

- Deployment restart is triggered automatically.
- Kubernetes rollout is initiated.
- New pods are scheduled by Kubernetes.

Automatic recovery can be disabled using:

```
AUTO_RESTART_ENABLED=false
```

---

# Environment Variables

## AI Engine

| Variable | Description |
|----------|-------------|
| OLLAMA_HOST | Ollama endpoint |
| K8S_NAMESPACE | Kubernetes namespace |
| DEFAULT_DEPLOYMENT | Deployment restarted automatically |
| AUTO_RESTART_ENABLED | Enable automatic remediation |

---

## Gateway

| Variable | Description |
|----------|-------------|
| AI_ENGINE_URL | AI Engine |
| OBSERVABILITY_URL | Observability |
| ORCHESTRATOR_URL | Orchestrator |

---

## Worker

| Variable | Description |
|----------|-------------|
| RABBITMQ_URL | RabbitMQ connection |
| QUEUE_NAME | Queue name |

---

# Security

The platform uses Kubernetes RBAC.

Permissions include:

- List pods
- Watch pods
- Delete pods
- Read deployments

A dedicated ServiceAccount is used by the orchestrator to communicate with the Kubernetes API.

---

# Future Roadmap

- [x] AI-powered infrastructure analysis
- [x] Kubernetes integration
- [x] Automatic remediation
- [x] RabbitMQ task processing
- [ ] Multi-model LLM support
- [ ] Grafana dashboards
- [ ] Historical incident memory
- [ ] RAG over infrastructure documentation
- [ ] Slack notifications
- [ ] Microsoft Teams integration
- [ ] GitOps support
- [ ] Autonomous remediation workflows

---

# Screenshots

You can add screenshots here to showcase:

- Swagger UI
- Kubernetes Dashboard
- AI analysis results
- Pod management
- Architecture diagram

Example:

```markdown
![Architecture](docs/images/architecture.png)

![Swagger](docs/images/swagger.png)

![AI Analysis](docs/images/analysis.png)
```

---

# Contributing

Contributions are welcome.

1. Fork the repository.
2. Create a feature branch.

```bash
git checkout -b feature/my-feature
```

3. Commit your changes.

```bash
git commit -m "Add new feature"
```

4. Push to your fork.

```bash
git push origin feature/my-feature
```

5. Open a Pull Request.

---

# License

This project is licensed under the MIT License.

---

# Acknowledgements

- Kubernetes
- NestJS
- FastAPI
- Ollama
- RabbitMQ
- Prometheus

---

## Author

Developed as a cloud-native AI DevOps platform demonstrating:

- Microservices architecture
- Kubernetes orchestration
- AI-assisted incident diagnosis
- Observability
- Distributed systems
- Automated remediation
- Local LLM integration