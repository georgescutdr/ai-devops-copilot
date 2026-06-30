#!/bin/bash
set -e

NAMESPACE="ai-assistant"
GATEWAY_PORT=3005
GATEWAY_TARGET_PORT=3000

echo "=== Starting Minikube ==="
minikube start

echo "=== Switching Docker to Minikube daemon ==="
eval $(minikube docker-env)

echo "=== Building Docker images ==="
docker build -t ollama:latest -f ollama/Dockerfile .
docker build -t ai-engine:latest ./ai-engine
docker build -t gateway:latest ./gateway
docker build -t worker:latest ./worker

echo "=== Loading images into Minikube ==="
minikube image load ollama:latest
minikube image load ai-engine:latest
minikube image load gateway:latest
minikube image load worker:latest

echo "=== Creating namespace if it doesn't exist ==="
kubectl get namespace $NAMESPACE >/dev/null 2>&1 || kubectl create namespace $NAMESPACE

echo "=== Applying Kubernetes manifests ==="
kubectl apply -f k8s/ -n $NAMESPACE

echo "=== Preloading Ollama model ==="
kubectl exec -it deployment/ollama -n $NAMESPACE -- ollama pull phi3

echo "=== Restarting deployments to pick up new images ==="
kubectl rollout restart deployment worker -n $NAMESPACE
kubectl rollout restart deployment gateway -n $NAMESPACE
kubectl rollout restart deployment ai-engine -n $NAMESPACE

echo "=== Waiting for pods to be ready ==="
kubectl wait --for=condition=ready pod -l app=ai-engine -n $NAMESPACE --timeout=120s
kubectl wait --for=condition=ready pod -l app=gateway -n $NAMESPACE --timeout=120s
kubectl wait --for=condition=ready pod -l app=worker -n $NAMESPACE --timeout=120s
kubectl wait --for=condition=ready pod -l app=ollama -n $NAMESPACE --timeout=120s

echo "=== Forwarding Gateway port to localhost:${GATEWAY_PORT} ==="
echo "Press Ctrl+C to stop port forwarding when done"
kubectl port-forward svc/gateway $GATEWAY_PORT:$GATEWAY_TARGET_PORT -n $NAMESPACE