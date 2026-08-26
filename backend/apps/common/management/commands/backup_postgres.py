import hashlib
import os
import subprocess
from datetime import datetime
from pathlib import Path
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = "ساخت بکاپ native و قابل بازیابی PostgreSQL همراه SHA-256"

    def add_arguments(self, parser):
        parser.add_argument("--output-dir", default=str(settings.BASE_DIR / "backups"))

    def handle(self, *args, **options):
        database = settings.DATABASES["default"]
        if "postgresql" not in database["ENGINE"]:
            raise CommandError("بکاپ native فقط برای PostgreSQL قابل استفاده است.")
        output_dir = Path(options["output_dir"]).resolve()
        output_dir.mkdir(parents=True, exist_ok=True)
        target = output_dir / f"shop82-{datetime.now():%Y%m%d-%H%M%S}.dump"
        env = os.environ.copy()
        env["PGPASSWORD"] = str(database.get("PASSWORD") or "")
        command = [
            "pg_dump", "--format=custom", "--no-owner", "--no-acl",
            "--host", str(database.get("HOST") or "localhost"),
            "--port", str(database.get("PORT") or "5432"),
            "--username", str(database.get("USER") or ""),
            "--file", str(target), str(database.get("NAME") or ""),
        ]
        result = subprocess.run(command, env=env, capture_output=True, text=True, timeout=3600)
        if result.returncode:
            target.unlink(missing_ok=True)
            raise CommandError(result.stderr.strip() or "pg_dump ناموفق بود.")
        digest = hashlib.sha256(target.read_bytes()).hexdigest()
        target.with_suffix(".dump.sha256").write_text(f"{digest}  {target.name}\n", encoding="utf-8")
        self.stdout.write(self.style.SUCCESS(str(target)))
