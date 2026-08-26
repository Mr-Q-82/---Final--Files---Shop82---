import json
import logging
from urllib.parse import urlencode
from urllib.request import urlopen

from django.conf import settings

logger = logging.getLogger(__name__)


def send_sms(phone, message, *, token="", template=""):
    backend = getattr(settings, "SMS_BACKEND", "console").lower()
    if backend == "kavenegar":
        api_key = settings.KAVENEGAR_API_KEY
        params = {"receptor": phone.replace("+98", "0"), "token": token or message}
        if template:
            params["template"] = template
        url = (
            f"https://api.kavenegar.com/v1/{api_key}/verify/lookup.json?"
            + urlencode(params)
        )
        with urlopen(url, timeout=10) as response:
            result = json.loads(response.read().decode("utf-8"))
        _log_sms(phone, message, result, True)
        return result
    logger.info("SMS to %s: %s", phone, message)
    result = {"status": "console"}
    _log_sms(phone, message, result, True)
    return result


def _log_sms(phone, message, response, success):
    try:
        from apps.operations.models import CommunicationLog
        CommunicationLog.objects.create(
            recipient=phone, channel=CommunicationLog.Channel.SMS,
            message=message, is_success=success, provider_response=response,
        )
    except Exception:
        logger.debug("Communication log is not available yet.", exc_info=True)
