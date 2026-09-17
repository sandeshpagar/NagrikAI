from typing import List
from .models import SlaRule

PMC_DEFAULT_SLA_RULES: List[SlaRule] = [
    # --- PMC Road Infrastructure & Civil Maintenance (PMC-CIVIL) ---
    SlaRule(
        rule_id="SLA-PMC-CIVIL-CRITICAL",
        department_code="PMC-CIVIL",
        category="Road Infrastructure",
        priority="CRITICAL",
        acknowledgement_hours=2,
        resolution_hours=12,
        reminder_before_hours=2,
        reminder_after_hours=2,
        escalation_after_hours=2,
        max_reminders=2,
        description="Emergency road cave-in, deep pothole arterial hazard, or bridge structural breach."
    ),
    SlaRule(
        rule_id="SLA-PMC-CIVIL-HIGH",
        department_code="PMC-CIVIL",
        category="Road Infrastructure",
        priority="HIGH",
        acknowledgement_hours=4,
        resolution_hours=24,
        reminder_before_hours=4,
        reminder_after_hours=4,
        escalation_after_hours=4,
        max_reminders=3,
        description="Major pothole on bus routes, damaged stormwater drain lid, or broken divider."
    ),
    SlaRule(
        rule_id="SLA-PMC-CIVIL-MEDIUM",
        department_code="PMC-CIVIL",
        category="Road Infrastructure",
        priority="MEDIUM",
        acknowledgement_hours=8,
        resolution_hours=48,
        reminder_before_hours=8,
        reminder_after_hours=8,
        escalation_after_hours=8,
        max_reminders=3,
        description="Residential lane pothole or sidewalk paver repair."
    ),
    SlaRule(
        rule_id="SLA-PMC-CIVIL-LOW",
        department_code="PMC-CIVIL",
        category="Road Infrastructure",
        priority="LOW",
        acknowledgement_hours=12,
        resolution_hours=72,
        reminder_before_hours=12,
        reminder_after_hours=12,
        escalation_after_hours=12,
        max_reminders=3,
        description="Cosmetic curb painting or minor paver leveling."
    ),

    # --- PMC Water Supply & Sewage Management (PMC-WATER) ---
    SlaRule(
        rule_id="SLA-PMC-WATER-CRITICAL",
        department_code="PMC-WATER",
        category="Water Supply",
        priority="CRITICAL",
        acknowledgement_hours=1,
        resolution_hours=6,
        reminder_before_hours=1,
        reminder_after_hours=2,
        escalation_after_hours=2,
        max_reminders=2,
        description="Sewage overflow into drinking water pipeline or major transmission line rupture."
    ),
    SlaRule(
        rule_id="SLA-PMC-WATER-HIGH",
        department_code="PMC-WATER",
        category="Water Supply",
        priority="HIGH",
        acknowledgement_hours=2,
        resolution_hours=12,
        reminder_before_hours=2,
        reminder_after_hours=3,
        escalation_after_hours=3,
        max_reminders=3,
        description="Contaminated water supply or zero water pressure in multi-ward zone."
    ),
    SlaRule(
        rule_id="SLA-PMC-WATER-MEDIUM",
        department_code="PMC-WATER",
        category="Water Supply",
        priority="MEDIUM",
        acknowledgement_hours=6,
        resolution_hours=24,
        reminder_before_hours=4,
        reminder_after_hours=6,
        escalation_after_hours=6,
        max_reminders=3,
        description="Localized tap contamination or valve malfunction."
    ),

    # --- PMC Solid Waste Management (PMC-SOLID) ---
    SlaRule(
        rule_id="SLA-PMC-SOLID-HIGH",
        department_code="PMC-SOLID",
        category="Solid Waste Management",
        priority="HIGH",
        acknowledgement_hours=2,
        resolution_hours=12,
        reminder_before_hours=2,
        reminder_after_hours=4,
        escalation_after_hours=4,
        max_reminders=2,
        description="Public health bio-waste dump or open burning near residential zone."
    ),
    SlaRule(
        rule_id="SLA-PMC-SOLID-MEDIUM",
        department_code="PMC-SOLID",
        category="Solid Waste Management",
        priority="MEDIUM",
        acknowledgement_hours=4,
        resolution_hours=24,
        reminder_before_hours=4,
        reminder_after_hours=6,
        escalation_after_hours=6,
        max_reminders=3,
        description="Overflowing community garbage container or missed daily doorstep collection."
    ),

    # --- PMC Electrical & Street Lighting (PMC-ELEC) ---
    SlaRule(
        rule_id="SLA-PMC-ELEC-HIGH",
        department_code="PMC-ELEC",
        category="Electrical & Streetlights",
        priority="HIGH",
        acknowledgement_hours=2,
        resolution_hours=12,
        reminder_before_hours=2,
        reminder_after_hours=4,
        escalation_after_hours=4,
        max_reminders=2,
        description="Hanging live electrical wire or dark blackout zone on accident-prone curve."
    ),
    SlaRule(
        rule_id="SLA-PMC-ELEC-MEDIUM",
        department_code="PMC-ELEC",
        category="Electrical & Streetlights",
        priority="MEDIUM",
        acknowledgement_hours=4,
        resolution_hours=36,
        reminder_before_hours=6,
        reminder_after_hours=8,
        escalation_after_hours=8,
        max_reminders=3,
        description="Single streetlight non-functioning or faulty timer switch."
    ),

    # --- Statutory Apex Fallback (Maharashtra RTSA 2015 Default) ---
    SlaRule(
        rule_id="SLA-PMC-APEX-FALLBACK",
        department_code=None,
        category=None,
        priority=None,
        acknowledgement_hours=12,
        resolution_hours=48,
        reminder_before_hours=6,
        reminder_after_hours=8,
        escalation_after_hours=8,
        max_reminders=3,
        description="Maharashtra Right to Public Services Act (RTSA 2015) statutory standard baseline."
    )
]
