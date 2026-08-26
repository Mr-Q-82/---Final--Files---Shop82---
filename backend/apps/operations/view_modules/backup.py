from ._shared import *

import logging


logger = logging.getLogger(__name__)

class DatabaseBackupView(APIView):
    permission_classes = [IsAdminRole]
    max_upload_size = 2 * 1024 * 1024 * 1024

    def get(self, request):
        backup_path = create_full_backup()
        response = FileResponse(
            open(backup_path, "rb"),
            as_attachment=True,
            filename=backup_path.name,
            content_type="application/zip",
        )
        response["X-Content-Type-Options"] = "nosniff"
        return response

    def post(self, request):
        upload = request.FILES.get("backup")
        confirmation = str(request.data.get("confirmation", "")).strip()
        if confirmation != "RESTORE":
            return Response(
                {"detail": "برای تأیید ریستور باید عبارت RESTORE ارسال شود."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not upload:
            return Response(
                {"detail": "فایل بکاپ انتخاب نشده است."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if upload.size > self.max_upload_size:
            return Response(
                {"detail": "حجم فایل بکاپ نباید بیشتر از ۲ گیگابایت باشد."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            payload = read_full_backup(upload)
            safety_path = restore_full_backup(upload, payload)
        except InvalidBackup as exc:
            return Response(
                {"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST
            )
        except RestoreFailed as exc:
            logger.exception("Full backup restore failed; transaction rolled back")
            safety_name = getattr(exc.safety_path, "name", "before-restore-full")
            reason = exc.reason[:400] if settings.DEBUG and exc.reason else ""
            detail = (
                "ریستور انجام نشد؛ اما تراکنش لغو شد و دیتابیس و تصاویر بدون تغییر باقی ماندند. "
                f"بکاپ ایمنی نیز با نام {safety_name} ساخته شد."
                if exc.recovered
                else "ریستور کامل نشد؛ بکاپ ایمنی را از پوشه backups نگهداری کنید."
            )
            if reason:
                detail += f" علت فنی: {reason}"
            return Response(
                {
                    "detail": detail,
                    "recovery_succeeded": exc.recovered,
                    "safety_backup": safety_name,
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        except Exception:
            logger.exception("Unexpected full backup restore failure")
            return Response(
                {"detail": "سرور نتوانست عملیات بکاپ یا ریستور را کامل کند."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        return Response({
            "detail": "دیتابیس و تمام تصاویر با موفقیت ریستور شدند. برای ادامه دوباره وارد شوید.",
            "backup_created_at": payload["manifest"].get("created_at"),
            "safety_backup": safety_path.name,
        })
