from ._shared import *

def _dump_objects():
    stream = StringIO()
    call_command(
        "dumpdata",
        "--natural-foreign",
        "--natural-primary",
        *[f"--exclude={model}" for model in EXCLUDED_MODELS],
        stdout=stream,
    )
    return json.loads(stream.getvalue())


def _database_payload():
    return {
        "format": BACKUP_FORMAT,
        "version": BACKUP_VERSION,
        "created_at": timezone.now().isoformat(),
        "django_version": django.get_version(),
        "objects": _dump_objects(),
    }


def _backup_root(output_dir=None):
    return Path(
        output_dir
        or getattr(settings, "DATABASE_BACKUP_ROOT", settings.BASE_DIR / "backups")
    ).resolve()


def create_database_backup(output_dir=None, prefix="shop82-database"):
    target_dir = _backup_root(output_dir)
    target_dir.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S-%f")
    target = target_dir / f"{prefix}-{stamp}.json.gz"
    payload = _database_payload()
    with gzip.open(target, "wt", encoding="utf-8", compresslevel=6) as stream:
        json.dump(payload, stream, ensure_ascii=False, separators=(",", ":"))
    return target


def create_full_backup(output_dir=None, prefix="shop82-full-backup"):
    target_dir = _backup_root(output_dir)
    target_dir.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S-%f")
    target = target_dir / f"{prefix}-{stamp}.zip"
    media_root = Path(settings.MEDIA_ROOT).resolve()
    media_files = [
        item
        for item in media_root.rglob("*")
        if item.is_file() and not item.is_symlink()
    ] if media_root.exists() else []
    database = _database_payload()
    database_bytes = json.dumps(database, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    manifest = {
        "format": FULL_BACKUP_FORMAT,
        "version": FULL_BACKUP_VERSION,
        "created_at": database["created_at"],
        "database_objects": len(database["objects"]),
        "media_files": len(media_files),
        "database_sha256": hashlib.sha256(database_bytes).hexdigest(),
    }
    with zipfile.ZipFile(
        target, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6,
        allowZip64=True,
    ) as archive:
        archive.writestr(
            "manifest.json", json.dumps(manifest, ensure_ascii=False)
        )
        archive.writestr("database.json", database_bytes)
        for item in media_files:
            relative = item.relative_to(media_root).as_posix()
            archive.write(item, f"media/{relative}")
    return target


