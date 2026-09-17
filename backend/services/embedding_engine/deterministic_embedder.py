import math
import hashlib
import re
from typing import List

from .base import BaseEmbedder

class DeterministicCivicEmbedder(BaseEmbedder):
    """
    High-performance, zero-dependency, deterministic 768-dimensional normalized
    civic embedding generator. Supports multilingual English, Marathi, and Hindi texts.
    Ensures safe, instant offline execution without downloading multi-GB PyTorch models.
    """

    CIVIC_TOPIC_BUCKETS = {
        "road": ["pothole", "crater", "cave", "road", "tar", "asphalt", "flyover", "खड्डा", "रस्ता", "गड्ढा", "सड़क"],
        "water": ["water", "leak", "pipe", "pipeline", "drain", "manhole", "sewage", "पाणी", "गळती", "पाईप", "गटार", "पानी", "सीवर"],
        "waste": ["garbage", "trash", "waste", "dump", "bin", "litter", "कचरा", "घाण", "कूड़ा", "गंदगी"],
        "electricity": ["electric", "wire", "spark", "pole", "light", "transformer", "वीज", "वायर", "खांब", "बिजली", "तार"],
        "health": ["dengue", "malaria", "mosquito", "fever", "stagnant", "डेंग्यू", "डास", "डेंगू", "मच्छर"],
    }

    def embed_text(self, text: str) -> List[float]:
        vec = [0.0] * self.DIMENSIONS
        cleaned = text.lower().strip()
        if not cleaned:
            # Return neutral unit vector
            val = 1.0 / math.sqrt(self.DIMENSIONS)
            return [val] * self.DIMENSIONS

        # 1. Word tokenization & N-gram hashing across 768 dimensions
        words = re.findall(r"[\w\u0900-\u097F]+", cleaned)
        for w in words:
            if len(w) < 2:
                continue
            # Hash whole word
            h = int(hashlib.sha256(w.encode("utf-8")).hexdigest(), 16)
            idx = h % self.DIMENSIONS
            vec[idx] += 2.0

            # Hash character 3-grams for morphological similarity
            for i in range(len(w) - 2):
                tri = w[i:i+3]
                th = int(hashlib.md5(tri.encode("utf-8")).hexdigest(), 16)
                tidx = th % self.DIMENSIONS
                vec[tidx] += 0.5

        # 2. Domain Topic Semantic Partitioning (Dimensions 0 to 250)
        bucket_idx = 0
        for topic, kws in self.CIVIC_TOPIC_BUCKETS.items():
            start_dim = bucket_idx * 50
            for kw in kws:
                if kw in cleaned:
                    for offset in range(50):
                        # Distributed topic activation
                        mod_idx = start_dim + offset
                        vec[mod_idx] += 3.5
            bucket_idx += 1

        # 3. Location / Ward Clustering Boost (Dimensions 250 to 450)
        ward_match = re.search(r"(ward\s*\d+|प्रभाग\s*\d+|वार्ड\s*\d+)", cleaned)
        if ward_match:
            ward_str = ward_match.group(0).replace(" ", "")
            whash = int(hashlib.md5(ward_str.encode("utf-8")).hexdigest(), 16)
            for offset in range(30):
                l_idx = 250 + ((whash + offset) % 200)
                vec[l_idx] += 4.0

        road_match = re.search(r"(sinhagad|kothrud|aundh|baner|shivaji|camp|hadapsar|swargate|shaniwar)", cleaned)
        if road_match:
            rhash = int(hashlib.md5(road_match.group(0).encode("utf-8")).hexdigest(), 16)
            for offset in range(30):
                r_idx = 250 + ((rhash + offset) % 200)
                vec[r_idx] += 4.5

        # 4. Strict L2 Vector Normalization
        norm = math.sqrt(sum(v * v for v in vec))
        if norm > 0.0:
            vec = [v / norm for v in vec]
        else:
            val = 1.0 / math.sqrt(self.DIMENSIONS)
            vec = [val] * self.DIMENSIONS

        return vec
