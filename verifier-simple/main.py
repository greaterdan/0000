"""
AIM Currency Verifier Service
Deterministic scoring for AI jobs with optional Hugging Face model support
"""

import asyncio
import hashlib
import json
import logging
import os
import random
import time
from typing import Any, Dict, List, Optional

import httpx
import numpy as np
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AIM Verifier Service",
    description="Deterministic scoring for AI jobs",
    version="1.0.0"
)

# Global model cache
model_cache = {}

class ScoreRequest(BaseModel):
    job_id: str
    inputs_hash: str
    spec: Dict[str, Any]

class ScoreResponse(BaseModel):
    score: float = Field(..., ge=0.0, le=1.0)
    report: Dict[str, Any]

class HealthResponse(BaseModel):
    status: str
    version: str
    models_loaded: List[str]

class VerifierService:
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0)
        self.model_name = os.getenv("VERIFIER_MODEL", "distilbert-base-uncased")
        self.use_model = os.getenv("USE_MODEL", "false").lower() == "true"
        
    async def load_model(self):
        """Load the Hugging Face model if enabled"""
        if not self.use_model:
            logger.info("Model scoring disabled, using rule-based scoring only")
            return
            
        try:
            logger.info(f"Loading model: {self.model_name}")
            tokenizer = AutoTokenizer.from_pretrained(self.model_name)
            model = AutoModelForSequenceClassification.from_pretrained(
                self.model_name, 
                num_labels=2
            )
            model_cache[self.model_name] = {
                "tokenizer": tokenizer,
                "model": model
            }
            logger.info(f"Model {self.model_name} loaded successfully")
        except Exception as e:
            logger.warning(f"Failed to load model {self.model_name}: {e}")
            logger.info("Falling back to rule-based scoring")
            self.use_model = False

    async def score_job(self, job_id: str, inputs_hash: str, spec: Dict[str, Any]) -> ScoreResponse:
        """Score a job using deterministic rules and optional model"""
        logger.info(f"Scoring job {job_id}")
        
        # Add audit delay to simulate work
        audit_delay = random.uniform(0.01, 0.05)  # 10-50ms
        await asyncio.sleep(audit_delay)
        
        # Rule-based scoring
        rule_score = await self._rule_based_score(spec)
        
        # Model-based scoring (if enabled)
        model_score = None
        if self.use_model and self.model_name in model_cache:
            model_score = await self._model_based_score(spec)
        
        # Combine scores
        if model_score is not None:
            # Weighted combination: 70% rule-based, 30% model-based
            final_score = 0.7 * rule_score + 0.3 * model_score
            scoring_method = "hybrid"
        else:
            final_score = rule_score
            scoring_method = "rule_based"
        
        # Generate report
        report = {
            "job_id": job_id,
            "inputs_hash": inputs_hash,
            "scoring_method": scoring_method,
            "rule_score": rule_score,
            "model_score": model_score,
            "final_score": final_score,
            "timestamp": time.time(),
            "audit_delay_ms": audit_delay * 1000,
            "spec_analysis": self._analyze_spec(spec)
        }
        
        logger.info(f"Job {job_id} scored: {final_score:.3f} ({scoring_method})")
        return ScoreResponse(score=final_score, report=report)

    async def _rule_based_score(self, spec: Dict[str, Any]) -> float:
        """Deterministic rule-based scoring"""
        score = 0.0
        
        # Check job type
        job_type = spec.get("type", "unknown")
        if job_type == "label":
            score += 0.3
        elif job_type == "classification":
            score += 0.4
        elif job_type == "generation":
            score += 0.2
        elif job_type == "evaluation":
            score += 0.5
        
        # Check for gold answers (high confidence)
        if "gold" in spec:
            gold_data = spec["gold"]
            if isinstance(gold_data, list) and len(gold_data) > 0:
                score += 0.3
            elif isinstance(gold_data, dict) and gold_data:
                score += 0.2
        
        # Check input quality
        if "inputs" in spec:
            inputs = spec["inputs"]
            if isinstance(inputs, list) and len(inputs) >= 10:
                score += 0.2
            elif isinstance(inputs, dict) and len(inputs) >= 5:
                score += 0.1
        
        # Check for validation criteria
        if "validation" in spec:
            validation = spec["validation"]
            if validation.get("required_accuracy", 0) >= 0.8:
                score += 0.1
            if validation.get("min_samples", 0) >= 100:
                score += 0.1
        
        # Check for attestation
        if "attestation" in spec:
            score += 0.1
        
        # Ensure score is between 0 and 1
        return min(max(score, 0.0), 1.0)

    async def _model_based_score(self, spec: Dict[str, Any]) -> Optional[float]:
        """Model-based scoring using Hugging Face model"""
        try:
            if self.model_name not in model_cache:
                return None
                
            model_data = model_cache[self.model_name]
            tokenizer = model_data["tokenizer"]
            model = model_data["model"]
            
            # Convert spec to text for model input
            spec_text = json.dumps(spec, sort_keys=True)
            
            # Tokenize and encode
            inputs = tokenizer(
                spec_text,
                return_tensors="pt",
                truncation=True,
                max_length=512,
                padding=True
            )
            
            # Get model prediction
            with torch.no_grad():
                outputs = model(**inputs)
                predictions = torch.nn.functional.softmax(outputs.logits, dim=-1)
                # Use the positive class probability as score
                score = float(predictions[0][1])
                
            return score
            
        except Exception as e:
            logger.warning(f"Model scoring failed: {e}")
            return None

    def _analyze_spec(self, spec: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze job specification for reporting"""
        analysis = {
            "job_type": spec.get("type", "unknown"),
            "has_gold": "gold" in spec,
            "has_validation": "validation" in spec,
            "has_attestation": "attestation" in spec,
            "input_count": 0,
            "complexity_score": 0.0
        }
        
        # Count inputs
        if "inputs" in spec:
            inputs = spec["inputs"]
            if isinstance(inputs, list):
                analysis["input_count"] = len(inputs)
            elif isinstance(inputs, dict):
                analysis["input_count"] = len(inputs)
        
        # Calculate complexity score
        complexity = 0.0
        if analysis["has_gold"]:
            complexity += 0.3
        if analysis["has_validation"]:
            complexity += 0.2
        if analysis["has_attestation"]:
            complexity += 0.1
        if analysis["input_count"] > 100:
            complexity += 0.4
        elif analysis["input_count"] > 10:
            complexity += 0.2
        
        analysis["complexity_score"] = min(complexity, 1.0)
        
        return analysis

# Initialize verifier service
verifier = VerifierService()

@app.on_event("startup")
async def startup_event():
    """Initialize the verifier service on startup"""
    await verifier.load_model()

@app.get("/health", response_model=HealthResponse)
async def health():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        models_loaded=list(model_cache.keys()) if verifier.use_model else []
    )

@app.post("/score", response_model=ScoreResponse)
async def score_job(request: ScoreRequest):
    """Score a job and return the result"""
    try:
        return await verifier.score_job(
            request.job_id,
            request.inputs_hash,
            request.spec
        )
    except Exception as e:
        logger.error(f"Error scoring job {request.job_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/models")
async def list_models():
    """List available models"""
    return {
        "loaded_models": list(model_cache.keys()),
        "default_model": verifier.model_name,
        "model_enabled": verifier.use_model
    }

@app.post("/models/load")
async def load_model(model_name: str):
    """Load a specific model"""
    try:
        verifier.model_name = model_name
        await verifier.load_model()
        return {"message": f"Model {model_name} loaded successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=3006,
        reload=True,
        log_level="info"
    )
