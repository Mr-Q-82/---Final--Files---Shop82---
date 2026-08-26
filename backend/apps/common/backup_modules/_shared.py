import gzip
import hashlib
import json
import secrets
import shutil
import tempfile
import uuid
import zipfile
from datetime import datetime
from io import StringIO
from pathlib import Path, PurePosixPath

import django
from django.apps import apps
from django.conf import settings
from django.core.management import call_command
from django.core.cache import cache
from django.db import DEFAULT_DB_ALIAS, connections, transaction
from django.db.migrations.executor import MigrationExecutor
from django.utils import timezone


BACKUP_FORMAT = "shop82-database-backup"
BACKUP_VERSION = 1
FULL_BACKUP_FORMAT = "shop82-full-backup"
FULL_BACKUP_VERSION = 1
EXCLUDED_MODELS = ("contenttypes", "auth.permission")


class InvalidBackup(ValueError):
    pass


class RestoreFailed(RuntimeError):
    def __init__(self, recovered, reason="", safety_path=None):
        self.recovered = recovered
        self.reason = str(reason or "").strip()
        self.safety_path = safety_path
        super().__init__("database restore failed")


def ensure_schema_is_current():
    connection = connections[DEFAULT_DB_ALIAS]
    executor = MigrationExecutor(connection)
    targets = executor.loader.graph.leaf_nodes()
    pending = executor.migration_plan(targets)
    if pending:
        names = "، ".join(f"{migration.app_label}.{migration.name}" for migration, _ in pending[:6])
        raise InvalidBackup(
            "قبل از ریستور، migrationهای پروژه را اجرا کنید"
            + (f": {names}" if names else ".")
        )



__all__ = [name for name in globals() if not name.startswith('__')]
