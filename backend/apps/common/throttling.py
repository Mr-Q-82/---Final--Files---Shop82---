import hashlib
from rest_framework.throttling import ScopedRateThrottle


class PhoneScopedRateThrottle(ScopedRateThrottle):
    """Rate-limit sensitive endpoints by both caller IP and normalized phone."""

    def get_cache_key(self, request, view):
        if not self.scope:
            return None
        ident = self.get_ident(request)
        phone = str(request.data.get("phone", "")).strip()
        phone_fingerprint = hashlib.sha256(phone.encode("utf-8")).hexdigest()[:20]
        return self.cache_format % {
            "scope": self.scope,
            "ident": f"{ident}:{phone_fingerprint}",
        }
