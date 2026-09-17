import logging
from typing import Optional
from config import settings

logger = logging.getLogger("nagrikai.supabase")

_supabase_client = None

def get_supabase():
    """
    Returns an authenticated Supabase client using the service role key.
    Falls back gracefully if credentials are not configured or client library fails.
    """
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    if not settings.NEXT_PUBLIC_SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
        logger.warning("Supabase URL or Service Role Key missing in environment settings.")
        return None

    try:
        from supabase import create_client, Client
        _supabase_client = create_client(
            settings.NEXT_PUBLIC_SUPABASE_URL,
            settings.SUPABASE_SERVICE_ROLE_KEY
        )
        return _supabase_client
    except Exception as e:
        logger.error(f"Failed to initialize Supabase Python client: {e}")
        return None
