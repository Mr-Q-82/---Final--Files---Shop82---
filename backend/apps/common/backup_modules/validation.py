from ._shared import *
from .creation import *

def _validate_database_payload(payload):
    if not isinstance(payload, dict) or payload.get("format") != BACKUP_FORMAT:
        raise InvalidBackup("این فایل توسط ابزار بکاپ فروشگاه 82 ساخته نشده است.")
    if payload.get("version") != BACKUP_VERSION:
        raise InvalidBackup("نسخه فایل بکاپ با این نسخه فروشگاه سازگار نیست.")
    objects = payload.get("objects")
    if not isinstance(objects, list) or not all(
        isinstance(item, dict) and {"model", "fields"}.issubset(item)
        for item in objects
    ):
        raise InvalidBackup("ساختار داده‌های فایل بکاپ معتبر نیست.")
    return payload


def read_database_backup(source, max_uncompressed_bytes=250 * 1024 * 1024):
    try:
        with gzip.GzipFile(fileobj=source, mode="rb") as archive:
            raw = archive.read(max_uncompressed_bytes + 1)
    except (OSError, EOFError) as exc:
        raise InvalidBackup("فایل انتخاب‌شده یک بکاپ معتبر و سالم نیست.") from exc
    if len(raw) > max_uncompressed_bytes:
        raise InvalidBackup("حجم بازشده فایل بکاپ بیش از حد مجاز است.")
    try:
        payload = json.loads(raw.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise InvalidBackup("محتوای فایل بکاپ قابل خواندن نیست.") from exc
    return _validate_database_payload(payload)


def _safe_archive_members(
    archive, max_files=100_000, max_size=10 * 1024**3, allowed_roots=None
):
    members = archive.infolist()
    if len(members) > max_files:
        raise InvalidBackup("تعداد فایل‌های داخل بکاپ بیش از حد مجاز است.")
    if sum(item.file_size for item in members) > max_size:
        raise InvalidBackup("حجم بازشده بکاپ بیش از حد مجاز است.")
    for item in members:
        path = PurePosixPath(item.filename)
        is_symlink = (item.external_attr >> 16) & 0o170000 == 0o120000
        if (
            path.is_absolute()
            or ".." in path.parts
            or is_symlink
            or not path.parts
            or (allowed_roots is not None and path.parts[0] not in allowed_roots)
        ):
            raise InvalidBackup("مسیر ناامن یا ناشناخته‌ای داخل فایل بکاپ وجود دارد.")
    return members


def read_full_backup(source):
    try:
        source.seek(0)
        with zipfile.ZipFile(source, "r") as archive:
            members = _safe_archive_members(archive)
            names = {item.filename for item in members}
            if {"manifest.json", "database.json"}.issubset(names):
                _safe_archive_members(
                    archive,
                    allowed_roots={"manifest.json", "database.json", "media"},
                )
                manifest = json.loads(
                    archive.read("manifest.json").decode("utf-8")
                )
                if (
                    manifest.get("format") != FULL_BACKUP_FORMAT
                    or manifest.get("version") != FULL_BACKUP_VERSION
                ):
                    raise InvalidBackup("این فایل بکاپ کامل فروشگاه 82 نیست.")
                database_raw = archive.read("database.json")
                if len(database_raw) > 250 * 1024 * 1024:
                    raise InvalidBackup("حجم اطلاعات دیتابیس بیش از حد مجاز است.")
                expected_hash = manifest.get("database_sha256")
                if expected_hash and not secrets.compare_digest(
                    hashlib.sha256(database_raw).hexdigest(), expected_hash
                ):
                    raise InvalidBackup("هش فایل پایگاه داده با مانیفست بکاپ یکسان نیست.")
                database = json.loads(database_raw.decode("utf-8"))
                return {
                    "manifest": manifest,
                    "database": _validate_database_payload(database),
                }

            database_members = [
                item for item in members if item.filename.lower().endswith(".json.gz")
            ]
            media_members = [
                item
                for item in members
                if item.filename.lower().endswith(".zip")
                and "media" in PurePosixPath(item.filename).name.lower()
            ]
            if len(database_members) != 1 or len(media_members) != 1:
                raise InvalidBackup(
                    "ساختار بکاپ قدیمی کامل نیست؛ فایل دیتابیس یا تصاویر پیدا نشد."
                )
            with archive.open(database_members[0], "r") as compressed:
                with gzip.GzipFile(fileobj=compressed, mode="rb") as database_stream:
                    database_raw = database_stream.read(250 * 1024 * 1024 + 1)
            if len(database_raw) > 250 * 1024 * 1024:
                raise InvalidBackup("حجم اطلاعات دیتابیس بیش از حد مجاز است.")
            legacy_objects = json.loads(database_raw.decode("utf-8"))
            database = _validate_database_payload({
                "format": BACKUP_FORMAT,
                "version": BACKUP_VERSION,
                "created_at": None,
                "django_version": "legacy",
                "objects": legacy_objects,
            })
            manifest = {
                "format": "shop82-legacy-full-backup",
                "version": 1,
                "created_at": None,
                "database_objects": len(legacy_objects),
            }
            return {
                "manifest": manifest,
                "database": database,
                "legacy_media_member": media_members[0].filename,
            }
    except InvalidBackup:
        raise
    except (OSError, KeyError, UnicodeDecodeError, json.JSONDecodeError, zipfile.BadZipFile) as exc:
        raise InvalidBackup("فایل انتخاب‌شده یک بکاپ کامل معتبر و سالم نیست.") from exc


