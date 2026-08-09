"""
Run this from your backend/ folder (where .env lives):

    python check_env_keys.py

It only prints the "role" claim decoded from each key - never the key
itself - so it's safe to run and share the output.
"""
import base64
import json
import os

from dotenv import dotenv_values


def decode_role(token: str) -> str:
    if not token:
        return "(empty)"
    try:
        payload = token.split(".")[1]
        payload += "=" * (-len(payload) % 4)
        decoded = json.loads(base64.urlsafe_b64decode(payload))
        return decoded.get("role", "(no role claim)")
    except Exception as e:
        return f"(could not decode: {e})"


env = dotenv_values(".env")

anon_key = env.get("SUPABASE_KEY", "")
service_key = env.get("SUPABASE_SERVICE_KEY", "")

print(f"SUPABASE_KEY role:         {decode_role(anon_key)}")
print(f"SUPABASE_SERVICE_KEY role: {decode_role(service_key)}")

if anon_key == service_key:
    print("\n⚠️  WARNING: SUPABASE_KEY and SUPABASE_SERVICE_KEY are IDENTICAL.")