import sys
from pathlib import Path
import re

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from services.authority_mapper.base import AuthorityResolutionInput
from services.authority_mapper.mapper_service import AuthorityMapperService
from services.authority_mapper.seed_data import PMC_AUTHORITY_MAPPINGS, FALLBACK_AUTHORITY_RESOLUTION

def test_road_ward12_mapping():
    service = AuthorityMapperService()
    req = AuthorityResolutionInput(
        jurisdiction="Ward 12, Sinhagad Road Zone",
        category="Road Infrastructure & Public Safety"
    )
    res = service.resolve(req)

    assert res.is_fallback is False
    assert res.mapping_rule_id == "RULE-PMC-CIVIL-W12"
    assert res.responsible_authority.name == "Er. Rajesh Sharma"
    assert res.responsible_authority.email == "rajesh.sharma@pmc.gov.in"
    assert "Ward 12" in res.responsible_authority.designation
    
    # Escalation chain checks
    assert len(res.escalation_chain) == 3
    assert res.escalation_chain[0].tier == 1
    assert res.escalation_chain[0].name == "Er. Sandeep Patil"
    assert res.escalation_chain[0].email == "sandeep.patil@pmc.gov.in"
    
    assert res.escalation_chain[1].tier == 2
    assert res.escalation_chain[1].name == "Er. Sunita Deshpande"
    
    assert res.escalation_chain[2].tier == 3
    assert res.escalation_chain[2].name == "Dr. Anand Rao, IAS"
    assert res.escalation_chain[2].email == "amc.digital@pmc.gov.in"

def test_water_ward10_mapping():
    service = AuthorityMapperService()
    req = AuthorityResolutionInput(
        jurisdiction="Paud Road, Kothrud (Ward 10)",
        category="Water Supply & Pipeline Leakage"
    )
    res = service.resolve(req)

    assert res.is_fallback is False
    assert res.mapping_rule_id == "RULE-PMC-WATER-W10"
    assert res.responsible_authority.name == "Er. Pradeep Gokhale"
    assert res.responsible_authority.email == "pradeep.gokhale@pmc.gov.in"
    assert len(res.escalation_chain) == 3
    assert res.escalation_chain[0].role == "FIELD_OFFICER"

def test_electricity_ward12_mapping():
    service = AuthorityMapperService()
    req = AuthorityResolutionInput(
        jurisdiction="Sinhagad Road, Ward 12",
        category="Exposed electrical wiring casing and street lighting outage"
    )
    res = service.resolve(req)

    assert res.is_fallback is False
    assert res.mapping_rule_id == "RULE-PMC-ELEC-W12"
    assert res.responsible_authority.name == "Er. Vikram Joshi"
    assert res.responsible_authority.email == "vikram.joshi@pmc.gov.in"
    assert res.escalation_chain[0].sla_threshold_hours == 12

def test_solid_waste_ward8_mapping():
    service = AuthorityMapperService()
    req = AuthorityResolutionInput(
        jurisdiction="Kasba Peth, Ward 8, Central Pune",
        category="Solid waste overflowing garbage dump"
    )
    res = service.resolve(req)

    assert res.is_fallback is False
    assert res.mapping_rule_id == "RULE-PMC-WASTE-W8"
    assert res.responsible_authority.name == "Dr. Ketaki Ranade"
    assert res.responsible_authority.email == "ketaki.ranade@pmc.gov.in"

def test_missing_unmapped_jurisdiction_fallback():
    service = AuthorityMapperService()
    req = AuthorityResolutionInput(
        jurisdiction="Ward 999 Remote Lunar Outpost",
        category="Unprecedented Alien Debris"
    )
    res = service.resolve(req)

    # Never fail or throw; gracefully route to Apex PMC Central Grievance Cell
    assert res.is_fallback is True
    assert res.mapping_rule_id == "RULE-PMC-APEX-FALLBACK"
    assert res.responsible_authority.email == "amc.digital@pmc.gov.in"
    assert res.responsible_authority.name == "Dr. Anand Rao, IAS"
    assert len(res.escalation_chain) == 3
    assert res.escalation_chain[0].email == "vinay.deshmukh@pmc.gov.in"

def test_escalation_chain_integrity_all_rules():
    service = AuthorityMapperService()
    email_regex = re.compile(r"^[\w\.-]+@[\w\.-]+\.\w+$")

    rules_to_test = list(PMC_AUTHORITY_MAPPINGS)
    rules_to_test.append(FALLBACK_AUTHORITY_RESOLUTION)

    for rule in rules_to_test:
        auth = rule["responsible_authority"]
        assert email_regex.match(auth["email"]), f"Invalid authority email: {auth['email']}"
        assert auth["phone"].startswith("+91"), f"Invalid phone: {auth['phone']}"
        assert len(auth["office_address"]) > 5

        chain = rule["escalation_chain"]
        assert len(chain) == 3, f"Rule {rule.get('rule_id')} does not have exactly 3 tiers"

        for idx, tier in enumerate(chain):
            assert tier["tier"] == idx + 1, f"Tier order mismatch in rule {rule.get('rule_id')}"
            assert email_regex.match(tier["email"]), f"Invalid tier email in {tier}"
            assert len(tier["trigger_condition"]) > 0

if __name__ == "__main__":
    test_road_ward12_mapping()
    test_water_ward10_mapping()
    test_electricity_ward12_mapping()
    test_solid_waste_ward8_mapping()
    test_missing_unmapped_jurisdiction_fallback()
    test_escalation_chain_integrity_all_rules()
    print("ALL AUTHORITY MAPPING TESTS PASSED SUCCESSFULLY!")
