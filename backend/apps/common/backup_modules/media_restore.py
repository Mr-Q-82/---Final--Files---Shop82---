from ._shared import *
from .creation import *
from .validation import *
from .database_restore import *

# Private helpers are intentionally excluded from Python's wildcard imports.
# Restore needs both helpers directly, so keep these imports explicit.
from .validation import _safe_archive_members
from .database_restore import _load_objects

def _extract_archive_files(archive, members, staging, strip_media_prefix=False):
    for item in members:
        path = PurePosixPath(item.filename)
        if item.is_dir():
            continue
        if strip_media_prefix:
            if len(path.parts) < 2 or path.parts[0] != "media":
                continue
            relative_parts = path.parts[1:]
        else:
            relative_parts = path.parts
        destination = staging.joinpath(*relative_parts)
        destination.parent.mkdir(parents=True, exist_ok=True)
        with archive.open(item, "r") as src, destination.open("wb") as dst:
            shutil.copyfileobj(src, dst, length=1024 * 1024)


def _extract_media(source, payload):
    media_root = Path(settings.MEDIA_ROOT).resolve()
    media_root.parent.mkdir(parents=True, exist_ok=True)
    staging = Path(tempfile.mkdtemp(prefix=".shop82-media-restore-", dir=media_root.parent))
    try:
        source.seek(0)
        with zipfile.ZipFile(source, "r") as archive:
            legacy_member = payload.get("legacy_media_member")
            if legacy_member:
                with tempfile.TemporaryFile() as nested_file:
                    with archive.open(legacy_member, "r") as nested_source:
                        shutil.copyfileobj(
                            nested_source, nested_file, length=1024 * 1024
                        )
                    nested_file.seek(0)
                    with zipfile.ZipFile(nested_file, "r") as media_archive:
                        members = _safe_archive_members(media_archive)
                        file_members = [item for item in members if not item.is_dir()]
                        # Some early backups stored `media/...` inside the
                        # nested media ZIP, while others started directly at
                        # `products/...`.  Strip the prefix only when the
                        # archive actually uses it, otherwise files end up in
                        # MEDIA_ROOT/media and every database URL becomes 404.
                        nested_has_media_root = bool(file_members) and all(
                            PurePosixPath(item.filename).parts[0] == "media"
                            for item in file_members
                        )
                        _extract_archive_files(
                            media_archive, members, staging,
                            strip_media_prefix=nested_has_media_root,
                        )
            else:
                members = _safe_archive_members(
                    archive,
                    allowed_roots={"manifest.json", "database.json", "media"},
                )
                _extract_archive_files(
                    archive, members, staging, strip_media_prefix=True
                )
        return staging
    except Exception:
        shutil.rmtree(staging, ignore_errors=True)
        raise


def _replace_media(staging):
    media_root = Path(settings.MEDIA_ROOT).resolve()
    previous = media_root.parent / f".shop82-media-previous-{uuid.uuid4().hex}"
    moved_previous = False
    try:
        if media_root.exists():
            media_root.rename(previous)
            moved_previous = True
        staging.rename(media_root)
    except Exception:
        if moved_previous and previous.exists() and not media_root.exists():
            previous.rename(media_root)
        raise
    return previous if moved_previous else None


def _rollback_media(previous):
    media_root = Path(settings.MEDIA_ROOT).resolve()
    if media_root.exists():
        shutil.rmtree(media_root, ignore_errors=True)
    if previous and previous.exists():
        previous.rename(media_root)


def _finalize_media(previous):
    if previous:
        shutil.rmtree(previous, ignore_errors=True)


def _apply_full_backup(source, payload):
    staging = _extract_media(source, payload)
    previous = None
    try:
        # Database changes and the media swap form one logical transaction.
        # If fixture loading, media replacement, or the database commit fails,
        # both sides are returned to their exact pre-restore state.
        with transaction.atomic(using=DEFAULT_DB_ALIAS):
            _load_objects(payload["database"]["objects"])
            previous = _replace_media(staging)
            staging = None
        _finalize_media(previous)
        previous = None
    except Exception:
        if staging is None:
            _rollback_media(previous)
            previous = None
        raise
    finally:
        if staging is not None:
            shutil.rmtree(staging, ignore_errors=True)


def restore_full_backup(source, payload):
    ensure_schema_is_current()
    safety_path = create_full_backup(prefix="before-restore-full")
    try:
        _apply_full_backup(source, payload)
    except Exception as restore_error:
        raise RestoreFailed(
            recovered=True, reason=restore_error, safety_path=safety_path
        ) from restore_error
    cache.clear()
    return safety_path
