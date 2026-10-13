import math
import re
import json
from typing import List, Dict, Any, Tuple

class VectorStoreService:
    """Embedding generation and semantic vector search with hybrid keyword matching."""

    @staticmethod
    def _tokenize(text: str) -> List[str]:
        return re.findall(r"\b[a-zA-Z0-9_]{2,}\b", text.lower())

    @classmethod
    def generate_embedding(cls, text: str, dimensions: int = 64) -> List[float]:
        """Generate normalized vector embedding using frequency hash projection."""
        tokens = cls._tokenize(text)
        if not tokens:
            return [0.0] * dimensions

        vec = [0.0] * dimensions
        for i, token in enumerate(tokens):
            h = hash(token)
            idx = abs(h) % dimensions
            sign = 1.0 if (h >> 4) % 2 == 0 else -1.0
            weight = 1.0 + 0.5 * math.log(1 + len(token))
            vec[idx] += sign * weight

        # Normalize to unit length
        norm = math.sqrt(sum(x * x for x in vec))
        if norm > 1e-9:
            vec = [x / norm for x in vec]
        return vec

    @staticmethod
    def cosine_similarity(v1: List[float], v2: List[float]) -> float:
        if not v1 or not v2 or len(v1) != len(v2):
            return 0.0
        dot = sum(a * b for a, b in zip(v1, v2))
        norm1 = math.sqrt(sum(a * a for a in v1))
        norm2 = math.sqrt(sum(b * b for b in v2))
        if norm1 < 1e-9 or norm2 < 1e-9:
            return 0.0
        return dot / (norm1 * norm2)

    @classmethod
    def search_chunks(
        cls,
        query: str,
        chunks: List[Any], # list of MaterialChunk model objects or dicts
        top_k: int = 4,
        min_threshold: float = 0.15
    ) -> List[Tuple[Any, float]]:
        """Hybrid search combining dense vector cosine similarity and keyword BM25-like overlap."""
        query_vec = cls.generate_embedding(query)
        query_tokens = set(cls._tokenize(query))

        scored = []
        for c in chunks:
            content = c.content if hasattr(c, "content") else c.get("content", "")
            
            # Vector similarity
            chunk_vec = None
            if hasattr(c, "embedding_json") and c.embedding_json:
                try:
                    chunk_vec = json.loads(c.embedding_json)
                except Exception:
                    pass
            if not chunk_vec:
                chunk_vec = cls.generate_embedding(content)

            cos_sim = cls.cosine_similarity(query_vec, chunk_vec)

            # Keyword lexical overlap
            chunk_tokens = set(cls._tokenize(content))
            intersection = query_tokens.intersection(chunk_tokens)
            keyword_score = len(intersection) / max(1, len(query_tokens))

            # Hybrid score
            hybrid_score = (0.55 * cos_sim) + (0.45 * keyword_score)

            if hybrid_score >= min_threshold or keyword_score > 0.4:
                scored.append((c, hybrid_score))

        scored.sort(key=lambda x: x[1], reverse=True)
        return scored[:top_k]
