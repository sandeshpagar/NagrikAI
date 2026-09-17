import sys
from pathlib import Path
import math

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from services.embedding_engine.base import BaseEmbedder
from services.embedding_engine.deterministic_embedder import DeterministicCivicEmbedder
from services.embedding_engine.ollama_embedder import OllamaEmbedder

def test_embedding_dimensions_and_normalization():
    embedder = DeterministicCivicEmbedder()
    text = "Severe road cave-in and pothole on Sinhagad Road near Abhiruchi Mall Ward 12"
    vec = embedder.embed_text(text)

    assert len(vec) == 768, f"Expected 768 dimensions, got {len(vec)}"
    # Calculate Euclidean L2 norm
    l2_norm = math.sqrt(sum(v * v for v in vec))
    assert abs(l2_norm - 1.0) < 1e-4, f"Vector should be L2-normalized to 1.0, got {l2_norm}"

def test_high_similarity_between_duplicate_pothole_reports():
    embedder = DeterministicCivicEmbedder()
    t1 = "Severe 2-foot pothole on Sinhagad Road near Abhiruchi Mall Ward 12 causing skidding accidents."
    t2 = "Deep dangerous pothole crater on Sinhagad Road Ward 12 two-wheeler fell and skidded."

    v1 = embedder.embed_text(t1)
    v2 = embedder.embed_text(t2)

    similarity = BaseEmbedder.cosine_similarity(v1, v2)
    assert similarity >= 0.80, f"Expected high similarity >= 0.80 for duplicate road issue, got {similarity}"

def test_low_similarity_between_different_municipal_domains():
    embedder = DeterministicCivicEmbedder()
    t_road = "Severe 2-foot pothole on Sinhagad Road near Abhiruchi Mall Ward 12"
    t_waste = "Rotting garbage bin overflowing with plastic debris and flies in Market Yard Ward 5"

    v_road = embedder.embed_text(t_road)
    v_waste = embedder.embed_text(t_waste)

    similarity = BaseEmbedder.cosine_similarity(v_road, v_waste)
    assert similarity <= 0.45, f"Expected low similarity <= 0.45 across different domains, got {similarity}"

def test_multilingual_similarity_marathi_english():
    embedder = DeterministicCivicEmbedder()
    t_en = "Water pipeline burst causing dirty contaminated water leak on road"
    t_mr = "मुख्य पाणी पाईपलाईन फुटली आणि दूषित पाणी रस्त्यावर वाहत आहे"

    v_en = embedder.embed_text(t_en)
    v_mr = embedder.embed_text(t_mr)

    similarity = BaseEmbedder.cosine_similarity(v_en, v_mr)
    assert similarity >= 0.65, f"Expected cross-lingual water pipeline similarity >= 0.65, got {similarity}"

def test_ollama_offline_fallback():
    # Points to non-existent port to test offline safety
    offline_embedder = OllamaEmbedder(base_url="http://127.0.0.1:59999", model="non-existent")
    vec = offline_embedder.embed_text("Test offline embedding fallback")

    assert len(vec) == 768
    l2_norm = math.sqrt(sum(v * v for v in vec))
    assert abs(l2_norm - 1.0) < 1e-4

if __name__ == "__main__":
    test_embedding_dimensions_and_normalization()
    test_high_similarity_between_duplicate_pothole_reports()
    test_low_similarity_between_different_municipal_domains()
    test_multilingual_similarity_marathi_english()
    test_ollama_offline_fallback()
    print("ALL 5 VECTOR EMBEDDING & SIMILARITY TESTS PASSED!")
