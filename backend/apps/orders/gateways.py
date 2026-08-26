from dataclasses import dataclass


@dataclass(frozen=True)
class GatewayResult:
    success: bool
    reference_id: str = ""
    raw: dict | None = None


class PaymentGateway:
    name = "BASE"

    def create(self, *, amount, callback_url, description, mobile):
        raise NotImplementedError

    def verify(self, *, amount, authority):
        raise NotImplementedError

    def refund(self, *, reference_id, amount):
        raise NotImplementedError("این درگاه بازپرداخت مستقیم را پشتیبانی نمی‌کند.")
