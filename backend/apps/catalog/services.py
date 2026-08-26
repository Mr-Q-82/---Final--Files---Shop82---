"""Deprecated compatibility imports for code written before domain extraction."""

from apps.products.services import notify_stock_available  # noqa: F401

__all__ = ["notify_stock_available"]
