from supabase import create_client, Client
from app.config import settings
import logging

logger = logging.getLogger(__name__)

class SupabaseClient:
    _instance = None
    _client: Client = None
    _admin_client: Client = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SupabaseClient, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        try:
            self._client = create_client(
                settings.SUPABASE_URL,
                settings.SUPABASE_KEY
            )
            logger.info("Supabase client initialized successfully")
        except Exception as e:
            # Don't crash the whole app/import chain at startup (e.g. during
            # tests or local dev before real credentials are configured).
            # Endpoints that actually need the client will fail loudly and
            # clearly when get_supabase()/client is used instead.
            logger.error(f"Failed to initialize Supabase client: {str(e)}")
            self._client = None

        try:
            self._admin_client = create_client(
                settings.SUPABASE_URL,
                settings.SUPABASE_SERVICE_KEY
            )
            logger.info("Supabase admin (service role) client initialized successfully")
            # TEMPORARY DIAGNOSTIC: confirm what role this client is actually
            # constructed with, right at construction time, before anything
            # else has a chance to touch it.
            try:
                import base64, json as _json
                _key = settings.SUPABASE_SERVICE_KEY
                _payload = _key.split('.')[1]
                _payload += '=' * (-len(_payload) % 4)
                _decoded = _json.loads(base64.urlsafe_b64decode(_payload))
                logger.error(f"DEBUG _initialize: SUPABASE_SERVICE_KEY role at construction = {_decoded.get('role')}")
                _hdr = self._admin_client.postgrest.session.headers.get('Authorization', '')
                _hdr_payload = _hdr.replace('Bearer ', '').split('.')[1]
                _hdr_payload += '=' * (-len(_hdr_payload) % 4)
                _hdr_decoded = _json.loads(base64.urlsafe_b64decode(_hdr_payload))
                logger.error(f"DEBUG _initialize: admin_client.postgrest header role at construction = {_hdr_decoded.get('role')}")
            except Exception as diag_e:
                logger.error(f"DEBUG _initialize: could not decode: {diag_e}")
        except Exception as e:
            logger.error(f"Failed to initialize Supabase admin client: {str(e)}")
            self._admin_client = None

    @property
    def client(self) -> Client:
        if self._client is None:
            raise RuntimeError(
                "Supabase client is not initialized. Check SUPABASE_URL and "
                "SUPABASE_KEY in your environment/.env file."
            )
        return self._client

    @property
    def admin_client(self) -> Client:
        if self._admin_client is None:
            raise RuntimeError(
                "Supabase admin client is not initialized. Check SUPABASE_URL and "
                "SUPABASE_SERVICE_KEY in your environment/.env file."
            )
        return self._admin_client

    def get_client(self) -> Client:
        return self.client

    def get_admin_client(self) -> Client:
        return self.admin_client

# Singleton instance
supabase_client = SupabaseClient()

def get_supabase() -> Client:
    return supabase_client.get_client()

def get_supabase_admin() -> Client:
    """Service-role client that bypasses RLS.
    Use only in trusted server-side code (e.g. verifying our own tokens),
    never expose this client's calls to unauthenticated/unchecked input."""
    return supabase_client.get_admin_client()