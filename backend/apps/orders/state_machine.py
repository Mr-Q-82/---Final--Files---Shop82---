from .models import Order


ORDER_TRANSITIONS = {
    Order.Status.PENDING: {Order.Status.PAID, Order.Status.CANCELED},
    Order.Status.PAID: {Order.Status.PROCESSING, Order.Status.CANCELED},
    Order.Status.PROCESSING: {Order.Status.SENT, Order.Status.CANCELED},
    Order.Status.SENT: {Order.Status.DELIVERED},
    Order.Status.DELIVERED: set(),
    Order.Status.CANCELED: set(),
}


def can_transition(current, target):
    return target in ORDER_TRANSITIONS.get(current, set())


def require_transition(current, target):
    if not can_transition(current, target):
        raise ValueError("این تغییر وضعیت مجاز نیست.")
