import json
import logging
import math
import urllib.request
import urllib.error
from typing import List, Optional

from config import settings
from .base import BaseEmbedder
from .deterministic_embedder import DeterministicCivicEmbedder

logger = logging.getLogger("nagrikai.embeddings.ollama")

class OllamaEmbedder(BaseEmbedder):
    """
    Ollama Embeddings Adapter utilizing nomic-embed-text or all-minilm.
    Automatically delegates to DeterministicCivicEmbedder if offline.
    """

    def __init__(self, base_url: Optional[str] = None, model: str = "nomic-embed-text"):
        self.base_url = base_url or settings.OLLAMA_BASE_URL
        self.model = model
        self.fallback = DeterministicCivicEmbedder()

    def embed_text(self, text: str) -> List[float]:
        req_payload = {
            "model": self.model,
            "prompt": text,
        }

        try:
            req = urllib.request.Request(
                f"{self.base_url}/api/embeddings",
                data=json.dumps(req_payload).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST"
            )

            with urllib.request.urlopen(req, timeout=2.5) as response:
                if response.status == 200:
                    data = json.loads(response.read().decode("utf-8"))
                    raw_vec = data.get("embedding", [])
                    if len(raw_vec) == self.DIMENSIONS:
                        norm = math.sqrt(sum(v * v for v in raw_vec))
                        if norm > 0.0:
                            return [v / norm for v in raw_vec]
                        return raw_vec
                    elif len(raw_vec) > 0:
                        # Resample or pad/truncate to 768 dimensions
                        if len(raw_vec) > self.DIMENSIONS:
                            trimmed = raw_vec[:self.DIMENSIONS]
                        else:
                            trimmed = raw_vec + [0.0] * (self.DIMENSIONS - len(raw_vec))
                        norm = math.sqrt(sum(v * v for v in trimmed))
                        return [v / norm for v in trimmed] if norm > 0.0 else trimmed
        except Exception as err:
            logger.info(f"Ollama embedding unavailable ({err}). Using DeterministicCivicEmbedder fallback.")

        return self.fallback.embed_text(text)
