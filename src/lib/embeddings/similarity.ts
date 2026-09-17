/**
 * NagrikAI Vector Similarity & Embedding Engine (Fullstack TypeScript Implementation)
 * Provides 768-dimensional normalized embedding vectors matching Supabase pgvector VECTOR(768).
 */

const DIMENSIONS = 768;

const CIVIC_TOPIC_BUCKETS: Record<string, string[]> = {
  road: ["pothole", "crater", "cave", "road", "tar", "asphalt", "flyover", "खड्डा", "रस्ता", "गड्ढा", "सड़क"],
  water: ["water", "leak", "pipe", "pipeline", "drain", "manhole", "sewage", "पाणी", "गळती", "पाईप", "गटार", "पानी", "सीवर"],
  waste: ["garbage", "trash", "waste", "dump", "bin", "litter", "कचरा", "घाण", "कूड़ा", "गंदगी"],
  electricity: ["electric", "wire", "spark", "pole", "light", "transformer", "वीज", "वायर", "खांब", "बिजली", "तार"],
  health: ["dengue", "malaria", "mosquito", "fever", "stagnant", "डेंग्यू", "डास", "डेंगू", "मच्छर"],
};

/**
 * Generates a deterministic, L2-normalized 768-dimensional embedding vector.
 */
export function generateCivicEmbedding(text: string): number[] {
  const vec = new Array(DIMENSIONS).fill(0.0);
  const cleaned = text.toLowerCase().trim();

  if (!cleaned) {
    const val = 1.0 / Math.sqrt(DIMENSIONS);
    return new Array(DIMENSIONS).fill(val);
  }

  // Helper string hash
  function strHash(s: string): number {
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
      hash = (hash << 5) - hash + s.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  // 1. Word tokenization and n-gram hashing
  const words = cleaned.match(/[\w\u0900-\u097F]+/g) || [];
  for (const w of words) {
    if (w.length < 2) continue;
    const h = strHash(w);
    vec[h % DIMENSIONS] += 2.0;

    for (let i = 0; i < w.length - 2; i++) {
      const tri = w.slice(i, i + 3);
      const th = strHash(tri);
      vec[th % DIMENSIONS] += 0.5;
    }
  }

  // 2. Topic semantic boosting (Dimensions 0 to 250)
  let bucketIdx = 0;
  for (const [, kws] of Object.entries(CIVIC_TOPIC_BUCKETS)) {
    const startDim = bucketIdx * 50;
    for (const kw of kws) {
      if (cleaned.includes(kw)) {
        for (let offset = 0; offset < 50; offset++) {
          vec[startDim + offset] += 3.5;
        }
      }
    }
    bucketIdx++;
  }

  // 3. Location boosting (Dimensions 250 to 450)
  const wardMatch = cleaned.match(/(ward\s*\d+|प्रभाग\s*\d+|वार्ड\s*\d+)/);
  if (wardMatch) {
    const whash = strHash(wardMatch[0].replace(/\s+/g, ""));
    for (let offset = 0; offset < 30; offset++) {
      const idx = 250 + ((whash + offset) % 200);
      vec[idx] += 4.0;
    }
  }

  const roadMatch = cleaned.match(/(sinhagad|kothrud|aundh|baner|shivaji|camp|hadapsar|swargate|shaniwar)/);
  if (roadMatch) {
    const rhash = strHash(roadMatch[0]);
    for (let offset = 0; offset < 30; offset++) {
      const idx = 250 + ((rhash + offset) % 200);
      vec[idx] += 4.5;
    }
  }

  // 4. Strict L2 Normalization
  let sumSq = 0;
  for (let i = 0; i < DIMENSIONS; i++) {
    sumSq += vec[i] * vec[i];
  }
  const norm = Math.sqrt(sumSq);

  if (norm > 0) {
    for (let i = 0; i < DIMENSIONS; i++) {
      vec[i] = vec[i] / norm;
    }
  } else {
    const val = 1.0 / Math.sqrt(DIMENSIONS);
    vec.fill(val);
  }

  return vec;
}

/**
 * Computes cosine similarity between two 768-dim float vectors.
 */
export function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0.0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) return 0.0;

  const sim = dotProduct / (normA * normB);
  return Math.max(0.0, Math.min(1.0, sim));
}

export interface SimilarComplaintMatch {
  id: string;
  grievance_number: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  ward: string;
  reported_at: string;
  similarity: number;
  similarity_score: number;
  is_duplicate_candidate: boolean;
}
