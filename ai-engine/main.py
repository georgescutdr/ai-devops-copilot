# main.py
from fastapi import FastAPI
from pydantic import BaseModel
import os
import datetime
import subprocess
import logging
import requests
import json

# -----------------------------
# App setup
# -----------------------------
app = FastAPI()
logger = logging.getLogger("ai_engine")
logging.basicConfig(level=logging.INFO)

# -----------------------------
# Environment
# -----------------------------
OLLAMA_HOST = os.environ.get("OLLAMA_HOST", "http://ollama:11434")
K8S_NAMESPACE = os.environ.get("K8S_NAMESPACE", "ai-assistant")
AUTO_RESTART_ENABLED = os.environ.get("AUTO_RESTART_ENABLED", "true").lower() == "true"
DEFAULT_DEPLOYMENT = os.environ.get("DEFAULT_DEPLOYMENT", "worker")

# -----------------------------
# Request model
# -----------------------------
class AnalyzeRequest(BaseModel):
    question: str
    logs: str = ""
    metrics: dict = {}

# -----------------------------
# Ollama AI reasoning
# -----------------------------
def analyze_with_ollama(question: str, logs: str, metrics: dict):
    prompt = f"""
You are an AI DevOps assistant.

Question: {question}

Logs:
{logs}

Metrics:
{metrics}

Provide structured JSON response with fields:
- root_cause (string)
- issue (string)
- fix (string)
- severity (low/medium/high)

Return ONLY JSON.
"""

    try:
        response = requests.post(
            f"{OLLAMA_HOST}/api/generate",  
            json={
                "model": "phi3",          
                "prompt": prompt,
                "stream": False
            },
            timeout=60
        )

        response.raise_for_status()

        data = response.json()
        completion = data.get("response")

        # ✅ Handle empty response
        if not completion:
            logger.error(f"Empty response from Ollama: {data}")
            return {"error": "Empty response from Ollama", "details": data}

        # ✅ Clean markdown formatting if present
        cleaned = completion.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("```")[1]
            cleaned = cleaned.replace("json", "").strip()

        # ✅ Parse JSON safely
        try:
            ai_result = json.loads(cleaned)
        except json.JSONDecodeError:
            logger.warning("Failed to parse Ollama JSON, returning raw text")
            ai_result = {"raw": completion}

        return ai_result

    except Exception as e:
        logger.error(f"Ollama request failed: {e}")
        return {"error": "AI service unavailable", "details": str(e)}

# -----------------------------
# Kubernetes auto-restart
# -----------------------------
def restart_k8s_deployment(deployment: str, namespace: str = K8S_NAMESPACE):
    try:
        now = datetime.datetime.utcnow().isoformat()

        subprocess.run([
            "kubectl", "patch", "deployment", deployment,
            "-n", namespace,
            "--type=merge",
            "-p",
            f'{{"spec":{{"template":{{"metadata":{{"annotations":{{"kubectl.kubernetes.io/restartedAt":"{now}"}}}}}}}}}}'
        ], check=True)

        logger.info(f"Deployment {deployment} restarted at {now}")
        return {"success": True, "message": f"{deployment} restarted"}

    except Exception as e:
        logger.error(f"Failed to restart deployment: {e}")
        return {"success": False, "error": str(e)}

# -----------------------------
# FastAPI endpoint
# -----------------------------
@app.post("/analyze")
async def analyze(data: AnalyzeRequest):

    # 🧠 AI reasoning
    ai_result = analyze_with_ollama(data.question, data.logs, data.metrics)

    # ✅ Safe severity handling
    severity = "low"
    if isinstance(ai_result, dict):
        severity = ai_result.get("severity", "low").lower()

    auto_restart_result = None

    # 🔁 Auto-restart logic
    if AUTO_RESTART_ENABLED and severity == "high":
        logger.info("High severity detected, attempting auto-restart...")
        auto_restart_result = restart_k8s_deployment(DEFAULT_DEPLOYMENT, K8S_NAMESPACE)

    return {
        "answer": f"Analyzed: {data.question}",
        "insight": ai_result,
        "auto_restart": auto_restart_result
    }