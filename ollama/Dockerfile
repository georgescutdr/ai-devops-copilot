# ai-devops-copilot/ollama/Dockerfile
FROM ubuntu:22.04

# Install dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    unzip \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy the Ollama binary into the container
COPY ollama /usr/local/bin/ollama
RUN chmod +x /usr/local/bin/ollama

# Expose Ollama API port
EXPOSE 11434

# Start Ollama in server mode
CMD ["ollama", "serve", "--port", "11434"]  