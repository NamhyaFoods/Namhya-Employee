from supabase import Client
from typing import Optional, Dict
from app.db.supabase import get_supabase_admin
import logging

logger = logging.getLogger(__name__)

async def verify_token(token: str, supabase: Client) -> Optional[Dict]:
    """
    Verify JWT token with Supabase
    Returns user data if valid, None otherwise
    """
    try:
        # Verify the token with Supabase (this call is fine on the
        # anon-key client — it's just validating the JWT itself)
        # TEMPORARY DIAGNOSTIC: check admin client header immediately
        # before and after this call, to see if it gets mutated by it.
        try:
            import base64, json as _json
            _admin_hdr_before = get_supabase_admin().postgrest.session.headers.get('Authorization', '')
            _p = _admin_hdr_before.replace('Bearer ', '').split('.')[1]
            _p += '=' * (-len(_p) % 4)
            logger.error(f"DEBUG verify_token BEFORE get_user: admin header role = {_json.loads(base64.urlsafe_b64decode(_p)).get('role')}")
        except Exception as diag_e:
            logger.error(f"DEBUG verify_token BEFORE: could not decode: {diag_e}")

        user = supabase.auth.get_user(token)

        try:
            import base64, json as _json
            _admin_hdr_after = get_supabase_admin().postgrest.session.headers.get('Authorization', '')
            _p = _admin_hdr_after.replace('Bearer ', '').split('.')[1]
            _p += '=' * (-len(_p) % 4)
            logger.error(f"DEBUG verify_token AFTER get_user: admin header role = {_json.loads(base64.urlsafe_b64decode(_p)).get('role')}")
        except Exception as diag_e:
            logger.error(f"DEBUG verify_token AFTER: could not decode: {diag_e}")
        if user and user.user:
            # Look up the user's profile using the service-role client.
            # We do this with the admin client (not the anon-key client)
            # because the `users` table's RLS policies reference the
            # `users` table itself (e.g. "is this caller an admin?"),
            # which self-references and silently returns zero rows when
            # queried as the anon/authenticated role from the backend.
            # This is trusted server-side code verifying its own token,
            # so bypassing RLS here is safe and correct.
            admin_supabase = get_supabase_admin()
            response = admin_supabase.table('users')\
                .select('*')\
                .eq('auth_user_id', user.user.id)\
                .execute()

            if response.data and len(response.data) > 0:
                user_data = response.data[0]
                # Add email from auth
                user_data['email'] = user.user.email
                return user_data

            # If user exists in auth but not in our users table
            # Return basic info
            return {
                'id': user.user.id,
                'email': user.user.email,
                'auth_user_id': user.user.id,
                'role': 'employee',  # Default role
                'full_name': user.user.user_metadata.get('full_name', user.user.email),
                'is_active': True
            }
    except Exception as e:
        logger.error(f"Token verification failed: {str(e)}")
        return None

    return None

def get_user_id_from_token(token: str) -> Optional[str]:
    """Extract user ID from JWT token"""
    try:
        # Simple extraction - in production use proper JWT decoding
        import jwt
        from app.config import settings

        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload.get('sub')
    except:
        return None