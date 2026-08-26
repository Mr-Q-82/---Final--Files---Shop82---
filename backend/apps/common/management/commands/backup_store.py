from pathlib import Path

from django.conf import settings
from django.core.management import BaseCommand

from apps.common.database_backup import create_full_backup


class Command(BaseCommand):
    help = "Creates one full backup containing the database and all media files."

    def add_arguments(self, parser):
        parser.add_argument("--output", default=str(settings.BASE_DIR / "backups"))

    def handle(self, *args, **options):
        output = Path(options["output"]).resolve()
        output.mkdir(parents=True, exist_ok=True)
        backup = create_full_backup(output)
        self.stdout.write(self.style.SUCCESS(f"Full backup created: {backup}"))
