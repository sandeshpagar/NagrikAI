import logging
from typing import List, Dict, Any, Optional

from config import settings
from services.supabase_client import get_supabase
from services.audit import record_audit_event
from .base import BaseEmbedder
from .deterministic_embedder import DeterministicCivicEmbedder
from .ollama_embedder import OllamaEmbedder
from .gemini_embedder import GeminiEmbedder

logger = logging.getLogger("nagrikai.similarity.service")

class SimilarityService:
    """
    Enterprise Complaint Similarity & Clustering Engine.
    Computes vector cosine similarity across 768-dim pgvector embeddings.
    Strictly follows civic safety constraints:
    - Never automatically merges complaints.
    - Surfaces transparent similarity scores and cluster proposals to authorized officers.
    """

    def __init__(self):
        if settings.AI_PROVIDER == "gemini" and settings.GEMINI_API_KEY:
            self.embedder: BaseEmbedder = GeminiEmbedder()
            self.model_name = "gemini/text-embedding-004"
        elif settings.AI_PROVIDER == "ollama":
            self.embedder = OllamaEmbedder()
            self.model_name = "ollama/nomic-embed-text"
        else:
            self.embedder = DeterministicCivicEmbedder()
            self.model_name = "nagrikai-civic-embed-768"

    def embed_text(self, text: str) -> List[float]:
        return self.embedder.embed_text(text)

    def get_or_create_embedding(self, grievance_id: str, text: str) -> List[float]:
        """
        Retrieves existing 768-dim embedding from public.complaint_embeddings or generates and persists it.
        """
        supabase = get_supabase()
        if supabase:
            try:
                res = supabase.table("complaint_embeddings").select("embedding").eq("grievance_id", grievance_id).execute()
                if res.data and len(res.data) > 0:
                    raw_emb = res.data[0].get("embedding")
                    if isinstance(raw_emb, list) and len(raw_emb) == BaseEmbedder.DIMENSIONS:
                        return raw_emb
            except Exception as e:
                logger.debug(f"Could not read existing embedding for {grievance_id}: {e}")

        # Generate new embedding
        vec = self.embedder.embed_text(text)

        # Persist to Supabase complaint_embeddings
        if supabase:
            try:
                supabase.table("complaint_embeddings").upsert({
                    "grievance_id": grievance_id,
                    "embedding": vec,
                    "model_name": self.model_name,
                }, on_conflict="grievance_id").execute()
            except Exception as upsert_err:
                logger.debug(f"Note on embedding upsert: {upsert_err}")

        return vec

    def find_similar(
        self,
        grievance_id: str,
        min_similarity: float = 0.40,
        limit: int = 5,
        actor_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Finds similar complaints for grievance_id based on cosine similarity.
        Returns ranked matches without mutating or merging records.
        """
        supabase = get_supabase()
        if not supabase:
            raise RuntimeError("Database unavailable for similarity search")

        # 1. Fetch target grievance
        target_res = supabase.table("grievances").select("*").eq("id", grievance_id).execute()
        if not target_res.data or len(target_res.data) == 0:
            # Try by grievance_number
            target_res = supabase.table("grievances").select("*").eq("grievance_number", grievance_id).execute()
            if not target_res.data or len(target_res.data) == 0:
                raise ValueError(f"Grievance not found: {grievance_id}")

        target_g = target_res.data[0]
        actual_id = target_g["id"]
        target_text = f"{target_g.get('title', '')}. {target_g.get('description', '')}. {target_g.get('category', '')} {target_g.get('address', '')}"
        target_vec = self.get_or_create_embedding(actual_id, target_text)

        # 2. Fetch candidate grievances to compare against
        candidates_res = supabase.table("grievances").select("*").neq("id", actual_id).limit(50).execute()
        candidates = candidates_res.data or []

        matches = []
        for cand in candidates:
            cand_id = cand["id"]
            cand_text = f"{cand.get('title', '')}. {cand.get('description', '')}. {cand.get('category', '')} {cand.get('address', '')}"
            cand_vec = self.get_or_create_embedding(cand_id, cand_text)

            sim = BaseEmbedder.cosine_similarity(target_vec, cand_vec)
            if sim >= min_similarity:
                matches.append({
                    "id": cand_id,
                    "grievance_number": cand.get("grievance_number", "GRV-XXXX"),
                    "title": cand.get("title", ""),
                    "category": cand.get("category", ""),
                    "priority": cand.get("priority", "MEDIUM"),
                    "status": cand.get("status", "SUBMITTED"),
                    "ward": cand.get("address", ""),
                    "reported_at": cand.get("created_at", ""),
                    "similarity": round(sim, 4),
                    "similarity_score": round(sim * 100, 1),
                    "is_duplicate_candidate": sim >= 0.80,
                })

        # Sort matches by similarity descending
        matches.sort(key=lambda x: x["similarity"], reverse=True)
        top_matches = matches[:limit]

        # Audit event recording
        try:
            record_audit_event(
                grievance_id=actual_id,
                action="SIMILARITY_SCANNED",
                actor_id=actor_id,
                actor_role="OFFICER",
                description=f"Vector similarity search executed. Identified {len(top_matches)} related cases (Top Match: {top_matches[0]['similarity_score'] if top_matches else 0}%).",
                metadata={
                    "model": self.model_name,
                    "matches_count": len(top_matches),
                    "top_similarity": top_matches[0]["similarity_score"] if top_matches else 0,
                }
            )
        except Exception as aud_err:
            logger.debug(f"Audit note: {aud_err}")

        return {
            "grievance_id": actual_id,
            "grievance_number": target_g.get("grievance_number"),
            "model_name": self.model_name,
            "total_candidates_analyzed": len(candidates),
            "similar_complaints": top_matches,
            "guardrail_notice": "Complaints are never automatically merged. Similarity scores are presented for administrative assessment."
        }

    def get_clusters(self) -> List[Dict[str, Any]]:
        """
        Retrieves all active complaint clusters and member associations.
        """
        supabase = get_supabase()
        if not supabase:
            return []

        try:
            clusters_res = supabase.table("grievance_clusters").select("*, cluster_members(*, grievances(*))").execute()
            if clusters_res.data:
                return clusters_res.data
        except Exception as e:
            logger.debug(f"Cluster query note: {e}")

        return []

    def suggest_clusters(self, threshold: float = 0.80) -> Dict[str, Any]:
        """
        Scans grievances for high-density duplicate/geographic clusters (similarity >= threshold).
        Proposes grouping clusters without merging records.
        """
        supabase = get_supabase()
        if not supabase:
            raise RuntimeError("Database unavailable for cluster suggestion")

        res = supabase.table("grievances").select("id, grievance_number, title, description, category, address").limit(60).execute()
        grievances = res.data or []

        if len(grievances) < 2:
            return {"suggested_clusters": [], "message": "Insufficient complaints to form clusters."}

        # Embed all
        item_vecs = {}
        for g in grievances:
            t = f"{g.get('title', '')}. {g.get('description', '')}. {g.get('category', '')} {g.get('address', '')}"
            item_vecs[g["id"]] = self.get_or_create_embedding(g["id"], t)

        visited = set()
        suggested = []

        for i, g1 in enumerate(grievances):
            gid1 = g1["id"]
            if gid1 in visited:
                continue

            cluster_members = [g1]
            vec1 = item_vecs[gid1]

            for j, g2 in enumerate(grievances):
                gid2 = g2["id"]
                if gid1 == gid2 or gid2 in visited:
                    continue

                vec2 = item_vecs[gid2]
                sim = BaseEmbedder.cosine_similarity(vec1, vec2)
                if sim >= threshold:
                    cluster_members.append(g2)
                    visited.add(gid2)

            if len(cluster_members) > 1:
                visited.add(gid1)
                cluster_name = f"{cluster_members[0].get('category', 'Municipal')} Group ({cluster_members[0].get('address', 'Ward 12')})"
                suggested.append({
                    "cluster_name": cluster_name,
                    "category": cluster_members[0].get("category", "General"),
                    "member_count": len(cluster_members),
                    "members": [
                        {
                            "id": m["id"],
                            "grievance_number": m.get("grievance_number"),
                            "title": m.get("title"),
                            "address": m.get("address"),
                        }
                        for m in cluster_members
                    ],
                    "recommendation": "Link related cases into single municipal intervention dispatch without deleting individual records."
                })

        return {
            "total_suggestions": len(suggested),
            "suggested_clusters": suggested,
            "threshold_used": threshold,
            "model_name": self.model_name,
        }

similarity_service = SimilarityService()
