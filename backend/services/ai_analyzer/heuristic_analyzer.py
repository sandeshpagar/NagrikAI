import re
import logging
from typing import List, Dict, Any

from .base import (
    BaseGrievanceAnalyzer,
    GrievanceAnalysisInput,
    GrievanceAnalysisOutput,
    CivicEntity,
)

logger = logging.getLogger("nagrikai.analyzer.heuristic")

class HeuristicCivicAnalyzer(BaseGrievanceAnalyzer):
    """
    Intelligent Rule-Based Civic NLP Analyzer (Safe Fallback Engine).
    Provides zero-latency, offline, deterministic analysis of multilingual
    (English, Hindi, Marathi) municipal grievances.
    """

    CATEGORIES = {
        "ROAD": {
            "name": "Road Infrastructure & Public Safety",
            "keywords": [
                "pothole", "crater", "cave-in", "caved in", "road", "tar", "asphalt", "flyover", "divider", "speed breaker",
                "खड्डा", "रस्ता", "डांबर", "उड्डाणपूल", "पादचारी", "अपघात", "चिखल",
                "गड्ढा", "सड़क", "गड्ढे", "डामर", "दुर्घटना", "टूटी सड़क", "धंसी सड़क"
            ],
            "department": "Road Maintenance & Traffic Infrastructure Dept",
            "subcategories": [
                ("Deep Pothole / Road Cave-in", ["deep", "massive", "crater", "cave", "large", "मोठा", "खड्डा", "धंसा"]),
                ("Damaged Speed Breaker / Divider", ["speed breaker", "divider", "रस्ता दुभाजक", "गतिरोधक"]),
                ("Waterlogged Broken Road", ["waterlog", "monsoon", "drain", "पाणी साचणे", "जलभराव"]),
                ("General Road Maintenance", [])
            ],
            "base_population": 2500,
            "actions": "Deploy quick-setting cold mix bituminous patch within 12h; erect warning barricades and traffic diversion signage immediately."
        },
        "WATER": {
            "name": "Water Supply & Sewerage",
            "keywords": [
                "water", "leak", "pipeline", "pipe", "burst", "contamination", "dirty water", "sewage", "drain", "manhole", "gutter",
                "पाणी", "गळती", "पाईप", "नळ", "गटार", "दूषित पाणी", "दुर्गंधी", "मलनिस्सारण",
                "पानी", "लीकेज", "पाइपलाइन", "गंदा पानी", "नाली", "सीवर", "गटर", "दुर्गंध"
            ],
            "department": "Water Supply and Drainage Management Board",
            "subcategories": [
                ("Potable Drinking Water Contamination", ["contaminat", "dirty", "smell", "color", "दूषित", "गंदा पानी"]),
                ("Main Transmission Pipeline Burst", ["burst", "major leak", "flood", "गळती", "लीकेज", "फूट"]),
                ("Open / Overflowing Manhole", ["manhole", "overflow", "open", "उघडे गटार", "खुला गटर"]),
                ("Low Pressure / No Supply", [])
            ],
            "base_population": 4000,
            "actions": "Dispatch zonal hydraulic emergency crew to isolate ruptured line; issue water tanker relief and test bacterial contamination indices."
        },
        "WASTE": {
            "name": "Solid Waste Management",
            "keywords": [
                "garbage", "trash", "waste", "dump", "bin", "litter", "debris", "rotting", "plastic",
                "कचरा", "कचराकुंडी", "घाण", "प्लास्टिक", "कचरा साचला",
                "कूड़ा", "कचरा", "कूड़ेदान", "गंदगी", "सड़ता कूड़ा", "सफाई"
            ],
            "department": "Solid Waste Management & Public Sanitation Division",
            "subcategories": [
                ("Illegal Dump Yard / Overflowing Bin", ["dump", "overflow", "heaps", "साचला", "ढेर"]),
                ("Biomedical / Hazardous Waste", ["hospital", "needle", "chemical", "धोकादायक"]),
                ("Uncollected Household Waste", [])
            ],
            "base_population": 1200,
            "actions": "Deploy automated compactor vehicle and sanitation workforce; sanitize area with bleaching powder and disinfectants within 6 hours."
        },
        "ELECTRICITY": {
            "name": "Electricity & Street Lighting",
            "keywords": [
                "electric", "wire", "spark", "sparking", "current", "pole", "streetlight", "transformer", "darkness",
                "वीज", "वायर", "ठिणग्या", "शॉर्ट सर्किट", "खांब", "दिवाबत्ती", "अंधार",
                "बिजली", "तार", "स्पार्किंग", "खंभा", "स्ट्रीट लाइट", "अंधेरा", "करंट"
            ],
            "department": "Electrical Engineering & Public Lighting Dept",
            "subcategories": [
                ("Open / Sparking High Voltage Wire", ["wire", "spark", "loose", "hanging", "current", "उघडी वायर", "करंट", "नंगी तार"]),
                ("Faulty Transformer / Power Hazard", ["transformer", "blast", "फ्यूज"]),
                ("Dark Corridor / Defective Streetlights", ["streetlight", "dark", "नादुरुस्त दिवे", "बंद लाइट"]),
                ("General Electrical Maintenance", [])
            ],
            "base_population": 1800,
            "actions": "Urgent electrical isolator trip request; dispatch bucket van line maintenance crew to secure exposed conductors and replace fixtures."
        },
        "HEALTH": {
            "name": "Public Health & Vector Control",
            "keywords": [
                "dengue", "malaria", "mosquito", "fogging", "stagnant", "epidemic", "fever", "rats",
                "डेंग्यू", "मलेरिया", "डास", "धुरळणी", "साचलेले पाणी", "साथीचा रोग",
                "डेंगू", "मलेरिया", "मच्छर", "फॉगिंग", "बीमारी", "मच्छरों का प्रकोप"
            ],
            "department": "Municipal Health & Vector-Borne Disease Control Dept",
            "subcategories": [
                ("Vector-Borne Outbreak Risk", ["dengue", "malaria", "fever", "डेंग्यू", "डेंगू"]),
                ("Stagnant Water Breeding Site", ["stagnant", "breeding", "साचलेले पाणी"]),
                ("General Sanitation Concern", [])
            ],
            "base_population": 3000,
            "actions": "Initiate thermal chemical fogging and larvicide spraying within 200m perimeter; conduct door-to-door febrile case surveillance."
        }
    }

    CRITICAL_TRIGGERS = [
        "accident", "death", "hospital", "school", "kid", "child", "children", "elderly", "ambulance",
        "spark", "electrocution", "cave-in", "drowning", "choke", "burst", "life threatening",
        "अपघात", "मृत्यू", "रुग्णालय", "शाळा", "मुल", "धोकादायक", "तातडीने", "जीवघेणा",
        "दुर्घटना", "मौत", "अस्पताल", "स्कूल", "बच्चे", "खतरनाक", "जानलेवा", "तुरंत"
    ]

    HIGH_TRIGGERS = [
        "overflow", "leak", "blocked", "traffic", "jam", "foul smell", "stink", "stagnant", "dark", "crime",
        "तुंबणे", "गळती", "वाहतूक कोंडी", "दुर्गंधी", "अंधार",
        "जाम", "रिसाव", "बदबू", "अंधेरा", "गंदगी"
    ]

    def analyze(self, input_data: GrievanceAnalysisInput) -> GrievanceAnalysisOutput:
        text = input_data.complaint_text.strip()
        lower_text = text.lower()
        location = input_data.location or {}
        ward = location.get("ward") or "Ward 12"
        address = location.get("address") or "Municipal Jurisdiction"

        # 1. Match category
        matched_cat_key = "ROAD"
        best_score = -1

        for cat_key, cat_data in self.CATEGORIES.items():
            score = 0
            for kw in cat_data["keywords"]:
                if kw in lower_text:
                    score += 1
            if score > best_score and score > 0:
                best_score = score
                matched_cat_key = cat_key

        cat_info = self.CATEGORIES[matched_cat_key]

        # 2. Determine subcategory
        subcat = cat_info["subcategories"][-1][0]
        for sub_name, sub_kws in cat_info["subcategories"]:
            if any(sk in lower_text for sk in sub_kws):
                subcat = sub_name
                break

        # 3. Priority and Severity Scoring
        critical_matches = [ct for ct in self.CRITICAL_TRIGGERS if ct in lower_text]
        high_matches = [ht for ht in self.HIGH_TRIGGERS if ht in lower_text]

        if critical_matches:
            priority = "CRITICAL"
            severity = 8.5 + min(1.3, len(critical_matches) * 0.4)
            affected_pop = int(cat_info["base_population"] * 1.8)
        elif high_matches:
            priority = "HIGH"
            severity = 6.5 + min(1.5, len(high_matches) * 0.3)
            affected_pop = int(cat_info["base_population"] * 1.2)
        elif len(text) > 80:
            priority = "MEDIUM"
            severity = 4.5
            affected_pop = cat_info["base_population"]
        else:
            priority = "LOW"
            severity = 3.0
            affected_pop = 500

        # Adjust for evidence verification risk if provided
        evidence = input_data.evidence_analysis or {}
        if evidence.get("verification_status") == "POTENTIALLY_MANIPULATED":
            confidence_penalty = 15.0
        else:
            confidence_penalty = 0.0

        # 4. Extract Entities
        entities: List[CivicEntity] = []

        # Ward extraction
        ward_match = re.search(r"(ward\s*\d+|प्रभाग\s*\d+|वार्ड\s*\d+)", text, re.IGNORECASE)
        if ward_match:
            entities.append(CivicEntity(name=ward_match.group(0), type="WARD"))
        elif ward:
            entities.append(CivicEntity(name=ward, type="WARD"))

        # Road / Chowk / Landmark patterns
        road_patterns = [
            r"([A-Za-z0-9\s]+(?:Road|Marg|Chowk|Flyover|Bridge|Nagar|Colony|Lane|Gali|Highway|Expressway))",
            r"([A-Za-z0-9\s]+(?:रस्ता|चौक|उड्डाणपूल|मार्ग|कॉलनी|नगर))",
            r"([A-Za-z0-9\s]+(?:सड़क|मार्ग|चौराहा|चौक|कॉलोनी|नगर))"
        ]
        found_locations = set()
        for pat in road_patterns:
            matches = re.findall(pat, text, re.IGNORECASE)
            for m in matches:
                clean_loc = m.strip()
                if len(clean_loc) > 3 and clean_loc not in found_locations:
                    entities.append(CivicEntity(name=clean_loc, type="LOCATION"))
                    found_locations.add(clean_loc)

        # Landmark triggers: near, opposite, behind, samne
        landmark_matches = re.findall(r"(?:near|opposite|behind|जवळ|समोर|मागे|के पास|के सामने)\s+([A-Za-z0-9\s\.\-]{3,30})", text, re.IGNORECASE)
        for lm in landmark_matches:
            clean_lm = lm.strip().split(",")[0]
            if len(clean_lm) > 2:
                entities.append(CivicEntity(name=f"Near {clean_lm}", type="LANDMARK"))

        # Hazard entities
        if critical_matches:
            entities.append(CivicEntity(name=f"Hazard: {', '.join(critical_matches[:2])}", type="HAZARD"))

        # 5. Formulate Issue & Summary
        first_line = text.split("\n")[0][:120].strip()
        issue = f"{cat_info['name']}: {subcat}"
        if len(first_line) > 10:
            issue = f"{subcat} ({first_line[:70]}...)" if len(first_line) > 70 else f"{subcat}: {first_line}"

        summary = (
            f"Municipal grievance regarding {subcat.lower()} reported at {address} ({ward}). "
            f"Evaluated as {priority} priority based on public safety indices and resident density. "
            f"Estimated impact spans approximately {affected_pop:,} residents."
        )

        confidence = max(65.0, min(96.5, 91.0 - confidence_penalty + (2.5 if best_score > 2 else 0.0)))

        return GrievanceAnalysisOutput(
            category=cat_info["name"],
            subcategory=subcat,
            issue=issue,
            summary=summary,
            department=cat_info["department"],
            jurisdiction=f"Pune Municipal Corporation, {ward}",
            priority=priority,
            duration="Ongoing 24-48 hours",
            affected_population=affected_pop,
            entities=entities,
            recommended_action=cat_info["actions"],
            recommendation_rationale=f"Automated SOP routing triggered for {subcat} with priority {priority} in accordance with Maharashtra RTS Standards.",
            confidence=round(confidence, 1),
            severity_score=round(severity, 1),
            model_name="nagrikai-civic-nlp-v1 (Safe Heuristic Engine)",
            is_fallback=True
        )
