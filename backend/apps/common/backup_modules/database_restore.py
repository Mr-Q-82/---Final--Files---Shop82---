from ._shared import *
from .creation import *
from .validation import *


def _objects_for_current_schema(objects):
    """Make logical backups tolerant of fields removed in newer releases.

    Django's serializer already supplies model defaults for fields added after a
    backup was created.  The opposite direction needs explicit handling: an old
    fixture may contain a field that no longer exists.  Unknown models are not
    discarded because doing so could silently remove an entire business domain.
    Duplicate primary-key rows are collapsed deterministically (last row wins),
    which also repairs a few early Shop82 backup files that repeated records.
    """
    prepared = []
    indexed = {}
    for item in objects:
        label = str(item.get("model", "")).lower()
        try:
            model = apps.get_model(label)
        except (LookupError, ValueError) as exc:
            raise InvalidBackup(
                f"مدل قدیمی «{label or 'نامشخص'}» در نسخه فعلی سایت وجود ندارد."
            ) from exc
        if model is None:
            raise InvalidBackup(
                f"مدل قدیمی «{label or 'نامشخص'}» در نسخه فعلی سایت وجود ندارد."
            )
        allowed_fields = {
            field.name
            for field in model._meta.get_fields()
            if getattr(field, "serialize", False)
        }
        normalized = {
            "model": model._meta.label_lower,
            "fields": {
                key: value
                for key, value in item.get("fields", {}).items()
                if key in allowed_fields
            },
        }
        if "pk" in item:
            normalized["pk"] = item["pk"]
        identity = (
            normalized["model"],
            str(normalized.get("pk")),
        ) if normalized.get("pk") is not None else None
        if identity and identity in indexed:
            prepared[indexed[identity]] = normalized
        else:
            if identity:
                indexed[identity] = len(prepared)
            prepared.append(normalized)
    return prepared

def _load_objects(objects):
    objects = _objects_for_current_schema(objects)
    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".json", encoding="utf-8", delete=False
    ) as fixture:
        json.dump(objects, fixture, ensure_ascii=False)
        fixture_path = Path(fixture.name)
    try:
        call_command("flush", interactive=False, verbosity=0)
        call_command("loaddata", str(fixture_path), verbosity=0)
    finally:
        fixture_path.unlink(missing_ok=True)


def restore_database_backup(payload):
    ensure_schema_is_current()
    safety_path = create_database_backup(prefix="before-restore")
    try:
        with transaction.atomic(using=DEFAULT_DB_ALIAS):
            _load_objects(payload["objects"])
    except Exception as restore_error:
        # The outer transaction rolls flush/loaddata back without running a
        # second destructive restore.  The safety file remains available as an
        # additional manual recovery point.
        raise RestoreFailed(
            recovered=True, reason=restore_error, safety_path=safety_path
        ) from restore_error
    return safety_path
