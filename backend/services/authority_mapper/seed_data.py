from typing import List, Dict, Any

PMC_AUTHORITY_MAPPINGS: List[Dict[str, Any]] = [
    # 1. Ward 12 - Road Infrastructure & Civil Maintenance
    {
        "rule_id": "RULE-PMC-CIVIL-W12",
        "jurisdiction_keywords": ["ward 12", "sinhagad", "sinhgad", "vadgaon", "hingne", "dhayari", "abhiruchi", "anand nagar"],
        "category_keywords": ["road", "pothole", "crater", "footpath", "pavement", "asphalt", "tarring", "median", "bridge"],
        "department_code": "PMC-CIVIL",
        "department_name": "PMC Road Infrastructure & Civil Maintenance",
        "jurisdiction_name": "Ward 12, Sinhagad Zone",
        "responsible_authority": {
            "id": "33333333-0000-0000-0000-000000000001",
            "name": "Er. Rajesh Sharma",
            "designation": "Executive Engineer (Ward 12 Civil Division)",
            "email": "rajesh.sharma@pmc.gov.in",
            "phone": "+91 98230 44102",
            "office_address": "PMC Sinhagad Ward Office, Sinhagad Road, Pune - 411030",
            "department_name": "PMC Road Infrastructure & Civil Maintenance",
            "department_code": "PMC-CIVIL",
            "jurisdiction_name": "Ward 12, Sinhagad Zone"
        },
        "escalation_chain": [
            {
                "tier": 1,
                "role": "FIELD_OFFICER",
                "name": "Er. Sandeep Patil",
                "designation": "Junior Engineer (Road Maintenance)",
                "email": "sandeep.patil@pmc.gov.in",
                "phone": "+91 98221 00234",
                "trigger_condition": "Initial assignment (0h to 24h statutory SLA)",
                "sla_threshold_hours": 24
            },
            {
                "tier": 2,
                "role": "DEPARTMENT_ADMIN",
                "name": "Er. Sunita Deshpande",
                "designation": "Superintending Engineer (West Zone)",
                "email": "sunita.deshpande@pmc.gov.in",
                "phone": "+91 98225 11090",
                "trigger_condition": "Breach +12h non-response (Tier 2 Zonal Escalation)",
                "sla_threshold_hours": 36
            },
            {
                "tier": 3,
                "role": "SYSTEM_ADMIN",
                "name": "Dr. Anand Rao, IAS",
                "designation": "Additional Municipal Commissioner",
                "email": "amc.digital@pmc.gov.in",
                "phone": "+91 98200 99001",
                "trigger_condition": "Breach +24h critical failure (Apex Governance Escalation)",
                "sla_threshold_hours": 48
            }
        ]
    },

    # 2. Ward 12 - Electrical Infrastructure & Street Lighting
    {
        "rule_id": "RULE-PMC-ELEC-W12",
        "jurisdiction_keywords": ["ward 12", "sinhagad", "sinhgad", "vadgaon", "hingne", "dhayari", "abhiruchi"],
        "category_keywords": ["electric", "light", "street light", "wire", "cable", "conduit", "transformer", "pole", "blackout", "shock"],
        "department_code": "PMC-ELEC",
        "department_name": "PMC Electrical Infrastructure & Street Lighting",
        "jurisdiction_name": "Ward 12, Sinhagad Zone",
        "responsible_authority": {
            "id": "33333333-0000-0000-0000-000000000002",
            "name": "Er. Vikram Joshi",
            "designation": "Executive Engineer (Sinhagad Electrical Division)",
            "email": "vikram.joshi@pmc.gov.in",
            "phone": "+91 98230 55211",
            "office_address": "PMC Electrical Division, Sinhagad Road, Pune - 411030",
            "department_name": "PMC Electrical Infrastructure & Street Lighting",
            "department_code": "PMC-ELEC",
            "jurisdiction_name": "Ward 12, Sinhagad Zone"
        },
        "escalation_chain": [
            {
                "tier": 1,
                "role": "FIELD_OFFICER",
                "name": "Er. Amit Shinde",
                "designation": "Junior Engineer (Street Lighting)",
                "email": "amit.shinde@pmc.gov.in",
                "phone": "+91 98222 33412",
                "trigger_condition": "Initial assignment (0h to 12h SLA - Hazard Priority)",
                "sla_threshold_hours": 12
            },
            {
                "tier": 2,
                "role": "DEPARTMENT_ADMIN",
                "name": "Er. Milind Kadam",
                "designation": "Chief Electrical Inspector",
                "email": "milind.kadam@pmc.gov.in",
                "phone": "+91 98226 77810",
                "trigger_condition": "Breach +6h non-response (Tier 2 Escalation)",
                "sla_threshold_hours": 18
            },
            {
                "tier": 3,
                "role": "SYSTEM_ADMIN",
                "name": "Dr. Anand Rao, IAS",
                "designation": "Additional Municipal Commissioner",
                "email": "amc.digital@pmc.gov.in",
                "phone": "+91 98200 99001",
                "trigger_condition": "Breach +18h critical public safety failure (Apex Authority)",
                "sla_threshold_hours": 30
            }
        ]
    },

    # 3. Ward 10 (Kothrud Zone) - Water Supply & Sewage
    {
        "rule_id": "RULE-PMC-WATER-W10",
        "jurisdiction_keywords": ["ward 10", "kothrud", "bavdhan", "paud road", "karve nagar", "mayur colony", "chandani chowk"],
        "category_keywords": ["water", "sewage", "pipeline", "drainage", "contamination", "leak", "manhole", "low pressure", "tap"],
        "department_code": "PMC-WATER",
        "department_name": "PMC Water Supply & Sewage Management",
        "jurisdiction_name": "Ward 10, Kothrud Zone",
        "responsible_authority": {
            "id": "33333333-0000-0000-0000-000000000003",
            "name": "Er. Pradeep Gokhale",
            "designation": "Executive Engineer (Kothrud Water Works)",
            "email": "pradeep.gokhale@pmc.gov.in",
            "phone": "+91 98231 66100",
            "office_address": "PMC Kothrud Ward Office, Paud Road, Pune - 411038",
            "department_name": "PMC Water Supply & Sewage Management",
            "department_code": "PMC-WATER",
            "jurisdiction_name": "Ward 10, Kothrud Zone"
        },
        "escalation_chain": [
            {
                "tier": 1,
                "role": "FIELD_OFFICER",
                "name": "Er. Nitin Shirole",
                "designation": "Ward Pipeline Inspector",
                "email": "nitin.shirole@pmc.gov.in",
                "phone": "+91 98223 88102",
                "trigger_condition": "Initial assignment (0h to 24h SLA - Field Inspection)",
                "sla_threshold_hours": 24
            },
            {
                "tier": 2,
                "role": "DEPARTMENT_ADMIN",
                "name": "Er. Snehal Kulkarni",
                "designation": "Superintending Engineer (Water Distribution)",
                "email": "snehal.kulkarni@pmc.gov.in",
                "phone": "+91 98227 99021",
                "trigger_condition": "Breach +12h non-response (Tier 2 Escalation)",
                "sla_threshold_hours": 36
            },
            {
                "tier": 3,
                "role": "SYSTEM_ADMIN",
                "name": "Dr. Anand Rao, IAS",
                "designation": "Additional Municipal Commissioner",
                "email": "amc.digital@pmc.gov.in",
                "phone": "+91 98200 99001",
                "trigger_condition": "Breach +24h water disruption failure (Apex Authority)",
                "sla_threshold_hours": 48
            }
        ]
    },

    # 4. Ward 8 (Central Pune / Kasba / Shivajinagar) - Solid Waste Management & Sanitation
    {
        "rule_id": "RULE-PMC-WASTE-W8",
        "jurisdiction_keywords": ["ward 8", "central pune", "kasba", "shivajinagar", "swargate", "deccan", "fc road", "jm road"],
        "category_keywords": ["waste", "garbage", "trash", "sanitation", "dump", "bin", "overflow", "debris", "dead animal", "litter"],
        "department_code": "PMC-WASTE",
        "department_name": "PMC Solid Waste Management & Sanitation",
        "jurisdiction_name": "Ward 8, Central Pune",
        "responsible_authority": {
            "id": "33333333-0000-0000-0000-000000000004",
            "name": "Dr. Ketaki Ranade",
            "designation": "Divisional Medical Officer & Waste Management Lead",
            "email": "ketaki.ranade@pmc.gov.in",
            "phone": "+91 98232 77201",
            "office_address": "PMC Central Ward Office, Kasba Peth, Pune - 411011",
            "department_name": "PMC Solid Waste Management & Sanitation",
            "department_code": "PMC-WASTE",
            "jurisdiction_name": "Ward 8, Central Pune"
        },
        "escalation_chain": [
            {
                "tier": 1,
                "role": "FIELD_OFFICER",
                "name": "Shri Ganesh More",
                "designation": "Ward Sanitary Inspector",
                "email": "ganesh.more@pmc.gov.in",
                "phone": "+91 98224 55001",
                "trigger_condition": "Initial assignment (0h to 12h SLA - Sanitation Squad Clearance)",
                "sla_threshold_hours": 12
            },
            {
                "tier": 2,
                "role": "DEPARTMENT_ADMIN",
                "name": "Dr. Sanjay Shirole",
                "designation": "Deputy Commissioner (Solid Waste)",
                "email": "sanjay.shirole@pmc.gov.in",
                "phone": "+91 98228 11990",
                "trigger_condition": "Breach +8h non-response (Tier 2 Escalation)",
                "sla_threshold_hours": 20
            },
            {
                "tier": 3,
                "role": "SYSTEM_ADMIN",
                "name": "Dr. Anand Rao, IAS",
                "designation": "Additional Municipal Commissioner",
                "email": "amc.digital@pmc.gov.in",
                "phone": "+91 98200 99001",
                "trigger_condition": "Breach +24h severe sanitation hazard (Apex Authority)",
                "sla_threshold_hours": 36
            }
        ]
    },

    # 5. Ward 4 (Aundh / Baner / Pashan) - Road Infrastructure & Civil Maintenance
    {
        "rule_id": "RULE-PMC-CIVIL-W4",
        "jurisdiction_keywords": ["ward 4", "aundh", "baner", "pashan", "balewadi", "sus road", "dp road"],
        "category_keywords": ["road", "pothole", "crater", "footpath", "pavement", "asphalt", "traffic signal", "divider"],
        "department_code": "PMC-CIVIL",
        "department_name": "PMC Road Infrastructure & Civil Maintenance",
        "jurisdiction_name": "Ward 4, Aundh/Baner Zone",
        "responsible_authority": {
            "id": "33333333-0000-0000-0000-000000000005",
            "name": "Er. Ananya Sen",
            "designation": "Executive Engineer (Aundh-Baner Civil Division)",
            "email": "ananya.sen@pmc.gov.in",
            "phone": "+91 98233 88310",
            "office_address": "PMC Aundh Ward Office, DP Road, Aundh, Pune - 411007",
            "department_name": "PMC Road Infrastructure & Civil Maintenance",
            "department_code": "PMC-CIVIL",
            "jurisdiction_name": "Ward 4, Aundh/Baner Zone"
        },
        "escalation_chain": [
            {
                "tier": 1,
                "role": "FIELD_OFFICER",
                "name": "Er. Rahul Thorat",
                "designation": "Junior Engineer (Aundh Civil)",
                "email": "rahul.thorat@pmc.gov.in",
                "phone": "+91 98225 66120",
                "trigger_condition": "Initial assignment (0h to 24h SLA)",
                "sla_threshold_hours": 24
            },
            {
                "tier": 2,
                "role": "DEPARTMENT_ADMIN",
                "name": "Er. Sunita Deshpande",
                "designation": "Superintending Engineer (West Zone)",
                "email": "sunita.deshpande@pmc.gov.in",
                "phone": "+91 98225 11090",
                "trigger_condition": "Breach +12h non-response (Tier 2 Escalation)",
                "sla_threshold_hours": 36
            },
            {
                "tier": 3,
                "role": "SYSTEM_ADMIN",
                "name": "Dr. Anand Rao, IAS",
                "designation": "Additional Municipal Commissioner",
                "email": "amc.digital@pmc.gov.in",
                "phone": "+91 98200 99001",
                "trigger_condition": "Breach +24h critical failure (Apex Authority)",
                "sla_threshold_hours": 48
            }
        ]
    }
]

# Fallback Authority Resolution for missing, unmapped, or novel civic categories
FALLBACK_AUTHORITY_RESOLUTION: Dict[str, Any] = {
    "rule_id": "RULE-PMC-APEX-FALLBACK",
    "department_code": "PMC-APEX",
    "department_name": "PMC Central Grievance Redressal & Citizen Services Cell",
    "jurisdiction_name": "Pune Citywide Apex Governance",
    "responsible_authority": {
        "id": "33333333-0000-0000-0000-000000000099",
        "name": "Dr. Anand Rao, IAS",
        "designation": "Additional Municipal Commissioner & Head of Central Grievance Cell",
        "email": "amc.digital@pmc.gov.in",
        "phone": "+91 98200 99001",
        "office_address": "PMC Headquarters, Shivaji Nagar, Pune - 411005",
        "department_name": "PMC Central Grievance Redressal & Citizen Services Cell",
        "department_code": "PMC-APEX",
        "jurisdiction_name": "Pune Citywide Apex Governance"
    },
    "escalation_chain": [
        {
            "tier": 1,
            "role": "FIELD_OFFICER",
            "name": "Shri Vinay Deshmukh",
            "designation": "Senior Grievance Redressal Officer",
            "email": "vinay.deshmukh@pmc.gov.in",
            "phone": "+91 98220 11999",
            "trigger_condition": "Initial Triage & Departmental Dispatch (0h to 12h SLA)",
            "sla_threshold_hours": 12
        },
        {
            "tier": 2,
            "role": "DEPARTMENT_ADMIN",
            "name": "Er. Sunita Deshpande",
            "designation": "Zonal Deputy Commissioner (Grievance Oversight)",
            "email": "sunita.deshpande@pmc.gov.in",
            "phone": "+91 98225 11090",
            "trigger_condition": "Breach +12h unallocated triage (Tier 2 Escalation)",
            "sla_threshold_hours": 24
        },
        {
            "tier": 3,
            "role": "SYSTEM_ADMIN",
            "name": "Dr. Anand Rao, IAS",
            "designation": "Additional Municipal Commissioner",
            "email": "amc.digital@pmc.gov.in",
            "phone": "+91 98200 99001",
            "trigger_condition": "Breach +24h critical SLA failure (Apex Municipal Authority)",
            "sla_threshold_hours": 36
        }
    ]
}
