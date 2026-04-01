ai-devops-copilot/
├── gateway/                # NestJS API (entry point)
├── orchestrator/          # Decision engine (your brain)
├── observability-service/ # Prometheus + logs + traces
├── ai-engine/             # FastAPI (LLM + reasoning)
├── worker/                # Background jobs (optional later)
├── k8s/                   # Kubernetes manifests
├── docker-compose.yml     # Local dev
└── README.md