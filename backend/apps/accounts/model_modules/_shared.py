import secrets
from datetime import timedelta
from django.conf import settings
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.contrib.auth.hashers import check_password, make_password
from django.db import models, transaction
from django.db.utils import OperationalError, ProgrammingError
from django.utils import timezone
from apps.common.models import TimeStampedModel
from apps.common.uploads import validate_support_attachment
from ..managers import UserManager


__all__ = [name for name in globals() if not name.startswith('__')]
