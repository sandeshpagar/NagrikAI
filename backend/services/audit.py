import logging
from typing import Optional, Dict, Any
from datetime import datetime

logger = logging.getLogger("nagrikai.audit")

def record_audit_event(
    supabase_client,
    action: str,
    details: str,
    grievance_id: Optional[str] = None,
    grievance_number: Optional[str] = None,
    actor_type: str = "CITIZEN",
    actor_name: str = "Citizen Resident",
    metadata: Optional[Dict[str, Any]] = None
) -> bool:
    """
    Inserts an immutable audit event into the public.audit_logs table.
    """
    if not supabase_client:
        logger.info(f"[AUDIT LOG LOCAL] [{action}] ({grievance_number}): {details}")
        return True

    try:
        payload = {
            "grievance_id": grievance_id,
            "grievance_number": grievance_number,
            "actor_type": actor_type,
            "actor_name": actor_name,
            "action": action,
            "details": details,
            "metadata": metadata or {}
        }
        res = supabase_client.table("audit_logs").insert(payload).execute()
        return bool(res.data)
    except Exception as e:
        logger.error(f"Failed to record audit event to Supabase: {e}")
        return False
