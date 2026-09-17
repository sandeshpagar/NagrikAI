import math
from abc import ABC, abstractmethod
from typing import List

class BaseEmbedder(ABC):
    """
    Abstract Base Class for complaint text embedders.
    Guarantees pluggable swap between Local Ollama, Cloud Gemini, and Deterministic Civic NLP.
    Outputs normalized 768-dimensional float vectors matching Supabase VECTOR(768).
    """

    DIMENSIONS = 768

    @abstractmethod
    def embed_text(self, text: str) -> List[float]:
        """
        Embeds a single string into a 768-dimensional float vector.
        """
        pass

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """
        Embeds a batch of texts.
        """
        return [self.embed_text(t) for t in texts]

    @staticmethod
    def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
        """
        Calculates cosine similarity between two float vectors.
        Returns a float between -1.0 and 1.0 (clamped to 0.0 to 1.0 for normalized embeddings).
        """
        if not vec_a or not vec_b or len(vec_a) != len(vec_b):
            return 0.0

        dot_product = sum(a * b for a, b in zip(vec_a, vec_b))
        norm_a = math.sqrt(sum(a * a for a in vec_a))
        norm_b = math.sqrt(sum(b * b for b in vec_b))

        if norm_a == 0.0 or norm_b == 0.0:
            return 0.0

        similarity = dot_product / (norm_a * norm_b)
        return max(0.0, min(1.0, float(similarity)))
