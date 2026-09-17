import json
import logging
import math
import urllib.request
import urllib.error
from typing import List, Optional

from config import settings
from .base import BaseEmbedder
from .deterministic_embedder import DeterministicCivicEmbedder

logger = logging.getLogger("nagrikai.embeddings.gemini")

class GeminiEmbedder(BaseEmbedder):
    """
    Google Gemini Embeddings Adapter utilizing text-embedding-004 (768 dimensions).
    Falls back to DeterministicCivicEmbedder if API key is not configured or on network error.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.fallback = DeterministicCivicEmbedder()

    def embed_text(self, text: str) -> List[float]:
        if not self.api_key:
            return self.fallback.embed_text(text)

        url = f"https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key={self.api_key}"
        payload = {
            "model": "models/text-embedding-004",
            "content": {"parts": [{"text": text[:2000]}]}
        }

        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST"
            )

            with urllib.request.urlopen(req, timeout=3.0) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode("utf-8"))
                    values = data.get("embedding", {}).get("values", [])
                    if len(values) == self.DIMENSIONS:
                        norm = math.sqrt(sum(v * v for v in values))
                        return [v / norm for v in values] if norm > 0.0 else values
        except Exception as err:
            logger.info(f"Gemini embedding unavailable ({err}). Delegating to DeterministicCivicEmbedder.")

        return self.fallback.embed_text(text)
