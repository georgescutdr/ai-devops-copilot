ai-devops-copilot/
├── gateway/                # NestJS API (entry point)
├── orchestrator/          # Decision engine (your brain)
├── observability-service/ # Prometheus + logs + traces
├── ai-engine/             # FastAPI (LLM + reasoning)
├── worker/                # Background jobs (optional later)
├── k8s/                   # Kubernetes manifests
├── docker-compose.yml     # Local dev
└── README.md


minikube start

# Forward port
kubectl port-forward svc/gateway 3005:3000 -n ai-assistant

# Every time code is changed
eval $(minikube docker-env)
docker build -t ai-engine:latest ./ai-engine
kubectl rollout restart deployment/ai-engine -n ai-assistant

# Use minikube's Docker daemon so no need to push images
eval $(minikube -p minikube docker-env)

# Install ollama inside the pod
kubectl exec -it deployment/ollama -n ai-assistant -- ollama pull phi3

#Build ollama
docker build -t ollama:latest -f ollama/Dockerfile .

# Create namespace if it doesnt exist

# Restart deployments
kubectl rollout restart deployment -n ai-assistant

# Get pods
kubectl get pods -n ai-assistant

# Build all Docker images
docker build -t worker:latest ./worker
docker build -t gateway:latest ./gateway
docker build -t ai-engine:latest ./ai-engine

docker build -t ollama:latest -f ollama/Dockerfile .
minikube image load ollama:latest

# Reload images
minikube image load gateway:latest
minikube image load worker:latest
minikube image load ai-engine:latest

# Test ollama
kubectl exec -it deployment/gateway -n ai-assistant -- curl http://ollama:11434

docker run -it -p 11434:11434 my-ollama:latest

# Apply Kubernetes manifests
kubectl apply -f k8s/ -n ai-assistant

kubectl apply -f k8s/worker.yaml -n ai-assistant
kubectl apply -f k8s/gateway.yaml -n ai-assistant
kubectl apply -f k8s/ai-engine.yaml -n ai-assistant
kubectl apply -f k8s/ollama.yaml -n ai-assistant

# Force restart pods to pick up new images
kubectl rollout restart deployment worker -n ai-assistant
kubectl rollout restart deployment gateway -n ai-assistant
kubectl rollout restart deployment ai-engine -n ai-assistant

# Optional: watch pods status
kubectl get pods -n ai-assistant -w