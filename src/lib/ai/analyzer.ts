/**
 * NagrikAI Multilingual Civic Intelligence & Analysis Engine (TypeScript Fullstack Implementation)
 * 
 * Complies strictly with Phase 6 schema:
 * category, subcategory, issue, summary, department, jurisdiction,
 * priority, duration, affected_population, entities, recommended_action, confidence.
 */

export interface CivicEntity {
  name: string;
  type: "LOCATION" | "LANDMARK" | "WARD" | "HAZARD" | "BODY" | "PERSON";
}

export interface GrievanceAnalysisResult {
  category: string;
  subcategory: string;
  issue: string;
  summary: string;
  department: string;
  jurisdiction: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  duration: string;
  affected_population: number;
  entities: CivicEntity[];
  recommended_action: string;
  recommendation_rationale: string;
  confidence: number;
  severity_score: number;
  model_name: string;
  is_fallback: boolean;
}

interface CivicCategoryDef {
  name: string;
  department: string;
  keywords: string[];
  subcategories: { name: string; triggers: string[] }[];
  basePopulation: number;
  sopAction: string;
}

const CIVIC_TAXONOMY: Record<string, CivicCategoryDef> = {
  ROAD: {
    name: "Road Infrastructure & Public Safety",
    department: "Road Maintenance & Traffic Infrastructure Dept",
    keywords: [
      "pothole", "crater", "cave-in", "caved in", "road", "tar", "asphalt", "flyover", "divider", "speed breaker",
      "खड्डा", "रस्ता", "डांबर", "उड्डाणपूल", "पादचारी", "अपघात", "चिखल",
      "गड्ढा", "सड़क", "गड्ढे", "डामर", "दुर्घटना", "टूटी सड़क", "धंसी सड़क"
    ],
    subcategories: [
      { name: "Deep Pothole / Road Cave-in", triggers: ["deep", "massive", "crater", "cave", "large", "मोठा", "खड्डा", "धंसा"] },
      { name: "Damaged Speed Breaker / Divider", triggers: ["speed breaker", "divider", "रस्ता दुभाजक", "गतिरोधक"] },
      { name: "Waterlogged Broken Road", triggers: ["waterlog", "monsoon", "drain", "पाणी साचणे", "जलभराव"] },
      { name: "General Road Maintenance", triggers: [] }
    ],
    basePopulation: 2500,
    sopAction: "Deploy quick-setting cold mix bituminous patch within 12h; erect warning barricades and traffic diversion signage immediately."
  },
  WATER: {
    name: "Water Supply & Sewerage",
    department: "Water Supply and Drainage Management Board",
    keywords: [
      "water", "leak", "pipeline", "pipe", "burst", "contamination", "dirty water", "sewage", "drain", "manhole", "gutter",
      "पाणी", "गळती", "पाईप", "नळ", "गटार", "दूषित पाणी", "दुर्गंधी", "मलनिस्सारण",
      "पानी", "लीकेज", "पाइपलाइन", "गंदा पानी", "नाली", "सीवर", "गटर", "दुर्गंध"
    ],
    subcategories: [
      { name: "Potable Drinking Water Contamination", triggers: ["contaminat", "dirty", "smell", "color", "दूषित", "गंदा पानी"] },
      { name: "Main Transmission Pipeline Burst", triggers: ["burst", "major leak", "flood", "गळती", "लीकेज", "फूट"] },
      { name: "Open / Overflowing Manhole", triggers: ["manhole", "overflow", "open", "उघडे गटार", "खुला गटर"] },
      { name: "Low Pressure / No Supply", triggers: [] }
    ],
    basePopulation: 4000,
    sopAction: "Dispatch zonal hydraulic emergency crew to isolate ruptured line; issue water tanker relief and test bacterial contamination indices."
  },
  WASTE: {
    name: "Solid Waste Management",
    department: "Solid Waste Management & Public Sanitation Division",
    keywords: [
      "garbage", "trash", "waste", "dump", "bin", "litter", "debris", "rotting", "plastic",
      "कचरा", "कचराकुंडी", "घाण", "प्लास्टिक", "कचरा साचला",
      "कूड़ा", "कचरा", "कूड़ेदान", "गंदगी", "सड़ता कूड़ा", "सफाई"
    ],
    subcategories: [
      { name: "Illegal Dump Yard / Overflowing Bin", triggers: ["dump", "overflow", "heaps", "साचला", "ढेर"] },
      { name: "Biomedical / Hazardous Waste", triggers: ["hospital", "needle", "chemical", "धोकादायक"] },
      { name: "Uncollected Household Waste", triggers: [] }
    ],
    basePopulation: 1200,
    sopAction: "Deploy automated compactor vehicle and sanitation workforce; sanitize area with bleaching powder and disinfectants within 6 hours."
  },
  ELECTRICITY: {
    name: "Electricity & Street Lighting",
    department: "Electrical Engineering & Public Lighting Dept",
    keywords: [
      "electric", "wire", "spark", "sparking", "current", "pole", "streetlight", "transformer", "darkness",
      "वीज", "वायर", "ठिणग्या", "शॉर्ट सर्किट", "खांब", "दिवाबत्ती", "अंधार",
      "बिजली", "तार", "स्पार्किंग", "खंभा", "स्ट्रीट लाइट", "अंधेरा", "करंट"
    ],
    subcategories: [
      { name: "Open / Sparking High Voltage Wire", triggers: ["wire", "spark", "loose", "hanging", "current", "उघडी वायर", "करंट", "नंगी तार"] },
      { name: "Faulty Transformer / Power Hazard", triggers: ["transformer", "blast", "फ्यूज"] },
      { name: "Dark Corridor / Defective Streetlights", triggers: ["streetlight", "dark", "नादुरुस्त दिवे", "बंद लाइट"] },
      { name: "General Electrical Maintenance", triggers: [] }
    ],
    basePopulation: 1800,
    sopAction: "Urgent electrical isolator trip request; dispatch bucket van line maintenance crew to secure exposed conductors and replace fixtures."
  },
  HEALTH: {
    name: "Public Health & Vector Control",
    department: "Municipal Health & Vector-Borne Disease Control Dept",
    keywords: [
      "dengue", "malaria", "mosquito", "fogging", "stagnant", "epidemic", "fever", "rats",
      "डेंग्यू", "मलेरिया", "डास", "धुरळणी", "साचलेले पाणी", "साथीचा रोग",
      "डेंगू", "मलेरिया", "मच्छर", "फॉगिंग", "बीमारी", "मच्छरों का प्रकोप"
    ],
    subcategories: [
      { name: "Vector-Borne Outbreak Risk", triggers: ["dengue", "malaria", "fever", "डेंग्यू", "डेंगू"] },
      { name: "Stagnant Water Breeding Site", triggers: ["stagnant", "breeding", "साचलेले पाणी"] },
      { name: "General Sanitation Concern", triggers: [] }
    ],
    basePopulation: 3000,
    sopAction: "Initiate thermal chemical fogging and larvicide spraying within 200m perimeter; conduct door-to-door febrile case surveillance."
  }
};

const CRITICAL_WORDS = [
  "accident", "death", "hospital", "school", "kid", "child", "children", "elderly", "ambulance",
  "spark", "electrocution", "cave-in", "drowning", "choke", "burst", "life threatening",
  "अपघात", "मृत्यू", "रुग्णालय", "शाळा", "मुल", "धोकादायक", "तातडीने", "जीवघेणा",
  "दुर्घटना", "मौत", "अस्पताल", "स्कूल", "बच्चे", "खतरनाक", "जानलेवा", "तुरंत"
];

const HIGH_WORDS = [
  "overflow", "leak", "blocked", "traffic", "jam", "foul smell", "stink", "stagnant", "dark", "crime",
  "तुंबणे", "गळती", "वाहतूक कोंडी", "दुर्गंधी", "अंधार",
  "जाम", "रिसाव", "बदबू", "अंधेरा", "गंदगी"
];

/**
 * Executes AI Grievance Analysis.
 * 1. Tries local Ollama endpoint if reachable within 2s.
 * 2. If unreachable, gracefully falls back to HeuristicCivicEngine.
 */
export async function analyzeGrievanceText(
  complaintText: string,
  options: {
    language?: string;
    location?: { ward?: string; address?: string; lat?: number; lng?: number };
    evidenceStatus?: string;
    evidenceRisk?: number;
  } = {}
): Promise<GrievanceAnalysisResult> {
  const text = complaintText.trim();
  const lower = text.toLowerCase();
  const ward = options.location?.ward || "Ward 12";
  const address = options.location?.address || "Municipal Ward Jurisdiction";

  // 1. Attempt Local Ollama LLM if configured
  const ollamaUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  const ollamaModel = process.env.OLLAMA_TEXT_MODEL || "llama3.1:8b";

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    const prompt = `You are a municipal civic triage officer. Output ONLY valid JSON matching:
{
  "category": "Road Infrastructure & Public Safety" | "Water Supply & Sewerage" | "Solid Waste Management" | "Electricity & Street Lighting" | "Public Health & Sanitation",
  "subcategory": "string",
  "issue": "string",
  "summary": "string in English",
  "department": "string",
  "jurisdiction": "string",
  "priority": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  "duration": "string",
  "affected_population": number,
  "entities": [{"name": "string", "type": "LOCATION" | "LANDMARK" | "WARD" | "HAZARD"}],
  "recommended_action": "string",
  "recommendation_rationale": "string",
  "confidence": number,
  "severity_score": number
}
Complaint: ${text}
Location: ${address}, ${ward}`;

    const resp = await fetch(`${ollamaUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: ollamaModel,
        prompt,
        stream: false,
        format: "json",
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (resp.ok) {
      const data = await resp.json();
      const parsed = JSON.parse(data.response || "{}");
      if (parsed.category && parsed.priority) {
        return {
          category: parsed.category,
          subcategory: parsed.subcategory || "General Municipal Issue",
          issue: parsed.issue || text.slice(0, 70),
          summary: parsed.summary || "AI synthesized municipal complaint analysis.",
          department: parsed.department || "Municipal Public Works",
          jurisdiction: parsed.jurisdiction || `Pune Municipal Corporation, ${ward}`,
          priority: ["CRITICAL", "HIGH", "MEDIUM", "LOW"].includes(parsed.priority) ? parsed.priority : "MEDIUM",
          duration: parsed.duration || "Ongoing 24-48 hours",
          affected_population: Number(parsed.affected_population) || 1500,
          entities: Array.isArray(parsed.entities) ? parsed.entities : [],
          recommended_action: parsed.recommended_action || "Dispatch zonal team for site evaluation.",
          recommendation_rationale: parsed.recommendation_rationale || "Automated triage classification.",
          confidence: Math.min(99.0, Math.max(60.0, Number(parsed.confidence) || 92.4)),
          severity_score: Math.min(10.0, Math.max(1.0, Number(parsed.severity_score) || 6.5)),
          model_name: `ollama/${ollamaModel}`,
          is_fallback: false,
        };
      }
    }
  } catch {
    // Ollama offline or timed out; proceed to Safe Heuristic Fallback Engine
  }

  // 2. Safe Heuristic Fallback Engine
  let matchedCatKey = "ROAD";
  let maxScore = -1;

  for (const [catKey, catDef] of Object.entries(CIVIC_TAXONOMY)) {
    let score = 0;
    for (const kw of catDef.keywords) {
      if (lower.includes(kw.toLowerCase())) score++;
    }
    if (score > maxScore && score > 0) {
      maxScore = score;
      matchedCatKey = catKey;
    }
  }

  const catDef = CIVIC_TAXONOMY[matchedCatKey];

  // Match subcategory
  let matchedSubcat = catDef.subcategories[catDef.subcategories.length - 1].name;
  for (const sub of catDef.subcategories) {
    if (sub.triggers.some((t) => lower.includes(t.toLowerCase()))) {
      matchedSubcat = sub.name;
      break;
    }
  }

  // Priority scoring
  const hasCritical = CRITICAL_WORDS.filter((w) => lower.includes(w.toLowerCase()));
  const hasHigh = HIGH_WORDS.filter((w) => lower.includes(w.toLowerCase()));

  let priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" = "MEDIUM";
  let severity = 5.0;
  let affectedPop = catDef.basePopulation;

  if (hasCritical.length > 0) {
    priority = "CRITICAL";
    severity = Math.min(9.8, 8.5 + hasCritical.length * 0.4);
    affectedPop = Math.round(catDef.basePopulation * 1.8);
  } else if (hasHigh.length > 0) {
    priority = "HIGH";
    severity = Math.min(8.0, 6.5 + hasHigh.length * 0.3);
    affectedPop = Math.round(catDef.basePopulation * 1.2);
  } else if (text.length > 80) {
    priority = "MEDIUM";
    severity = 4.8;
  } else {
    priority = "LOW";
    severity = 3.2;
    affectedPop = 600;
  }

  // Entities extraction
  const entities: CivicEntity[] = [];
  entities.push({ name: ward, type: "WARD" });

  const locMatch = text.match(/([A-Za-z0-9\s]+(?:Road|Marg|Chowk|Flyover|Bridge|Nagar|Colony|Lane|Gali|Highway))/i);
  if (locMatch) {
    entities.push({ name: locMatch[1].trim(), type: "LOCATION" });
  }

  const landmarkMatch = text.match(/(?:near|opposite|behind|के पास|के सामने|जवळ|समोर)\s+([A-Za-z0-9\s\.\-]{3,25})/i);
  if (landmarkMatch) {
    entities.push({ name: `Near ${landmarkMatch[1].trim()}`, type: "LANDMARK" });
  }

  if (hasCritical.length > 0) {
    entities.push({ name: `Hazard: ${hasCritical[0]}`, type: "HAZARD" });
  }

  const firstLine = text.split("\n")[0].trim();
  const issue = firstLine.length > 60 ? `${matchedSubcat} (${firstLine.slice(0, 55)}...)` : `${matchedSubcat}: ${firstLine}`;

  const summary = `Municipal grievance regarding ${matchedSubcat.toLowerCase()} at ${address} (${ward}). Priority assigned as ${priority} based on citizen safety and density indicators. Estimated impact: ~${affectedPop.toLocaleString()} residents.`;

  const confidence = Math.min(96.0, Math.max(78.0, 88.5 + (maxScore > 1 ? 3.5 : 0)));

  return {
    category: catDef.name,
    subcategory: matchedSubcat,
    issue,
    summary,
    department: catDef.department,
    jurisdiction: `Pune Municipal Corporation, ${ward}`,
    priority,
    duration: "Ongoing 24-48 hours",
    affected_population: affectedPop,
    entities,
    recommended_action: catDef.sopAction,
    recommendation_rationale: `Automated SOP routing triggered for ${matchedSubcat} with priority ${priority} under Maharashtra RTS Civic Service standards.`,
    confidence: Number(confidence.toFixed(1)),
    severity_score: Number(severity.toFixed(1)),
    model_name: "nagrikai-civic-nlp-v1 (Safe Heuristic Engine)",
    is_fallback: true,
  };
}
