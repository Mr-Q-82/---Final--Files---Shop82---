import gzip
import io
import json
import shutil
import tempfile
import zipfile
from unittest.mock import patch
from io import StringIO
from pathlib import Path

from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.test import TransactionTestCase, override_settings
from django.http import JsonResponse
from django.test import RequestFactory
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.catalog.models import Category, CustomizationGroup
from apps.common.database_backup import (
    RestoreFailed,
    create_full_backup,
    read_full_backup,
    restore_full_backup,
)
from apps.common.middleware import AdminAuditMiddleware


class DatabaseBackupApiTests(APITestCase):
    def setUp(self):
        self.backup_root = tempfile.mkdtemp(prefix="shop82-backup-tests-")
        self.media_root = tempfile.mkdtemp(prefix="shop82-media-tests-")
        self.override = override_settings(
            DATABASE_BACKUP_ROOT=self.backup_root, MEDIA_ROOT=self.media_root
        )
        self.override.enable()
        self.admin = User.objects.create_user(
            phone="+989120000091",
            password="strong-pass",
            role=User.Role.ADMIN,
            is_staff=True,
        )
        self.customer = User.objects.create_user(
            phone="+989120000092", password="strong-pass"
        )

    def tearDown(self):
        self.override.disable()
        shutil.rmtree(self.backup_root, ignore_errors=True)
        shutil.rmtree(self.media_root, ignore_errors=True)

    def test_only_admin_can_download_database_backup(self):
        self.client.force_authenticate(self.customer)
        self.assertEqual(
            self.client.get("/api/v1/operations/database-backup/").status_code,
            403,
        )
        self.client.force_authenticate(self.admin)
        response = self.client.get("/api/v1/operations/database-backup/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "application/zip")
        self.assertIn("attachment", response["Content-Disposition"])
        self.assertEqual(b"".join(response.streaming_content)[:2], b"PK")

    def test_restore_rejects_unknown_or_unconfirmed_files(self):
        self.client.force_authenticate(self.admin)
        response = self.client.post(
            "/api/v1/operations/database-backup/",
            {"backup": SimpleUploadedFile("invalid.zip", b"not-a-backup")},
            format="multipart",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("RESTORE", response.data["detail"])

        response = self.client.post(
            "/api/v1/operations/database-backup/",
            {
                "confirmation": "RESTORE",
                "backup": SimpleUploadedFile("invalid.zip", b"not-a-backup"),
            },
            format="multipart",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("معتبر", response.data["detail"])

    def test_successful_restore_response_is_not_replaced_by_audit_error(self):
        request = RequestFactory().post("/api/v1/operations/database-backup/")
        request.user = self.admin
        middleware = AdminAuditMiddleware(
            lambda current_request: JsonResponse({"detail": "restored"})
        )
        with patch(
            "apps.common.middleware.AdminAuditLog.objects.create"
        ) as create_audit:
            response = middleware(request)
        self.assertEqual(response.status_code, 200)
        create_audit.assert_not_called()


class DatabaseBackupRestoreTests(TransactionTestCase):
    reset_sequences = False

    def test_backup_can_restore_database_contents(self):
        backup_root = tempfile.mkdtemp(prefix="shop82-restore-tests-")
        media_root = tempfile.mkdtemp(prefix="shop82-restore-media-tests-")
        try:
            with override_settings(
                DATABASE_BACKUP_ROOT=backup_root, MEDIA_ROOT=media_root
            ):
                original = User.objects.create_user(
                    phone="+989120000093", password="strong-pass"
                )
                original_image = Path(media_root) / "products" / "original.jpg"
                original_image.parent.mkdir(parents=True, exist_ok=True)
                original_image.write_bytes(b"original-image-bytes")
                backup_path = create_full_backup()
                User.objects.create_user(phone="+989120000094", password="strong-pass")
                original_image.write_bytes(b"changed-image-bytes")
                extra_image = Path(media_root) / "products" / "after-backup.jpg"
                extra_image.write_bytes(b"after-backup")
                with Path(backup_path).open("rb") as source:
                    payload = read_full_backup(source)
                    restore_full_backup(source, payload)
                self.assertTrue(User.objects.filter(phone=original.phone).exists())
                self.assertFalse(User.objects.filter(phone="+989120000094").exists())
                self.assertEqual(original_image.read_bytes(), b"original-image-bytes")
                self.assertFalse(extra_image.exists())
        finally:
            shutil.rmtree(backup_root, ignore_errors=True)
            shutil.rmtree(media_root, ignore_errors=True)

    def test_restore_does_not_duplicate_category_default_customization(self):
        backup_root = tempfile.mkdtemp(prefix="shop82-config-restore-tests-")
        media_root = tempfile.mkdtemp(prefix="shop82-config-restore-media-")
        try:
            with override_settings(
                DATABASE_BACKUP_ROOT=backup_root, MEDIA_ROOT=media_root
            ):
                category = Category.objects.create(
                    name="لپ‌تاپ تست ریستور",
                    slug="restore-test-laptop",
                    is_active=True,
                )
                expected_codes = set(
                    CustomizationGroup.objects.filter(category=category)
                    .values_list("code", flat=True)
                )
                self.assertTrue(expected_codes)

                backup_path = create_full_backup()
                with backup_path.open("rb") as source:
                    payload = read_full_backup(source)
                    restore_full_backup(source, payload)

                restored = Category.objects.get(slug="restore-test-laptop")
                restored_codes = list(
                    CustomizationGroup.objects.filter(category=restored)
                    .values_list("code", flat=True)
                )
                self.assertEqual(set(restored_codes), expected_codes)
                self.assertEqual(len(restored_codes), len(expected_codes))
        finally:
            shutil.rmtree(backup_root, ignore_errors=True)
            shutil.rmtree(media_root, ignore_errors=True)

    def test_legacy_two_file_archive_can_be_restored(self):
        backup_root = tempfile.mkdtemp(prefix="shop82-legacy-backup-tests-")
        media_root = tempfile.mkdtemp(prefix="shop82-legacy-media-tests-")
        try:
            with override_settings(
                DATABASE_BACKUP_ROOT=backup_root, MEDIA_ROOT=media_root
            ):
                original = User.objects.create_user(
                    phone="+989120000095", password="strong-pass"
                )
                original_image = Path(media_root) / "products" / "legacy.jpg"
                original_image.parent.mkdir(parents=True, exist_ok=True)
                original_image.write_bytes(b"legacy-original-image")

                fixture = StringIO()
                call_command(
                    "dumpdata", "--natural-foreign", "--natural-primary",
                    "--exclude=contenttypes", "--exclude=auth.permission",
                    stdout=fixture,
                )
                nested_media = io.BytesIO()
                with zipfile.ZipFile(nested_media, "w", zipfile.ZIP_DEFLATED) as media_zip:
                    media_zip.write(original_image, "products/legacy.jpg")
                legacy_path = Path(backup_root) / "backups.zip"
                with zipfile.ZipFile(legacy_path, "w", zipfile.ZIP_DEFLATED) as outer:
                    outer.writestr(
                        "backups/techstore-legacy.json.gz",
                        gzip.compress(fixture.getvalue().encode("utf-8")),
                    )
                    outer.writestr(
                        "backups/techstore-media-legacy.zip",
                        nested_media.getvalue(),
                    )

                User.objects.create_user(
                    phone="+989120000096", password="strong-pass"
                )
                original_image.write_bytes(b"changed")
                with legacy_path.open("rb") as source:
                    payload = read_full_backup(source)
                    self.assertIn("legacy_media_member", payload)
                    restore_full_backup(source, payload)

                self.assertTrue(User.objects.filter(phone=original.phone).exists())
                self.assertFalse(User.objects.filter(phone="+989120000096").exists())
                self.assertEqual(original_image.read_bytes(), b"legacy-original-image")
        finally:
            shutil.rmtree(backup_root, ignore_errors=True)
            shutil.rmtree(media_root, ignore_errors=True)

    def test_removed_legacy_fields_are_ignored_during_restore(self):
        backup_root = tempfile.mkdtemp(prefix="shop82-old-fields-tests-")
        media_root = tempfile.mkdtemp(prefix="shop82-old-fields-media-")
        try:
            with override_settings(
                DATABASE_BACKUP_ROOT=backup_root, MEDIA_ROOT=media_root
            ):
                user = User.objects.create_user(
                    phone="+989120000097", password="strong-pass"
                )
                backup_path = create_full_backup()
                with zipfile.ZipFile(backup_path, "r") as source_zip:
                    manifest = json.loads(source_zip.read("manifest.json"))
                    database = json.loads(source_zip.read("database.json"))
                    media_entries = {
                        item.filename: source_zip.read(item)
                        for item in source_zip.infolist()
                        if item.filename.startswith("media/") and not item.is_dir()
                    }
                target = next(
                    item for item in database["objects"]
                    if item["model"] == "accounts.user" and str(item.get("pk")) == str(user.pk)
                )
                target["fields"]["removed_field_from_old_release"] = "legacy"
                database_raw = json.dumps(
                    database, ensure_ascii=False, separators=(",", ":")
                ).encode("utf-8")
                import hashlib
                manifest["database_sha256"] = hashlib.sha256(database_raw).hexdigest()
                legacy_path = Path(backup_root) / "old-field-backup.zip"
                with zipfile.ZipFile(legacy_path, "w", zipfile.ZIP_DEFLATED) as output:
                    output.writestr("manifest.json", json.dumps(manifest, ensure_ascii=False))
                    output.writestr("database.json", database_raw)
                    for name, content in media_entries.items():
                        output.writestr(name, content)
                with legacy_path.open("rb") as source:
                    payload = read_full_backup(source)
                    restore_full_backup(source, payload)
                self.assertTrue(User.objects.filter(pk=user.pk).exists())
        finally:
            shutil.rmtree(backup_root, ignore_errors=True)
            shutil.rmtree(media_root, ignore_errors=True)

    def test_failed_restore_leaves_database_and_media_unchanged(self):
        backup_root = tempfile.mkdtemp(prefix="shop82-atomic-restore-tests-")
        media_root = tempfile.mkdtemp(prefix="shop82-atomic-restore-media-")
        try:
            with override_settings(
                DATABASE_BACKUP_ROOT=backup_root, MEDIA_ROOT=media_root
            ):
                user = User.objects.create_user(
                    phone="+989120000098", password="strong-pass"
                )
                media_file = Path(media_root) / "products" / "keep.jpg"
                media_file.parent.mkdir(parents=True, exist_ok=True)
                media_file.write_bytes(b"must-stay")
                backup_path = create_full_backup()
                with backup_path.open("rb") as source:
                    payload = read_full_backup(source)
                    payload["database"]["objects"].append({
                        "model": "removed.applicationmodel",
                        "pk": 1,
                        "fields": {},
                    })
                    with self.assertRaises(RestoreFailed) as raised:
                        restore_full_backup(source, payload)
                self.assertTrue(raised.exception.recovered)
                self.assertTrue(User.objects.filter(pk=user.pk).exists())
                self.assertEqual(media_file.read_bytes(), b"must-stay")
        finally:
            shutil.rmtree(backup_root, ignore_errors=True)
            shutil.rmtree(media_root, ignore_errors=True)
