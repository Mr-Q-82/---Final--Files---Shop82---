from celery import shared_task
from django.core.management import call_command


@shared_task(autoretry_for=(Exception,), retry_backoff=True, max_retries=3)
def process_store_tasks():
    call_command("process_store_tasks")


@shared_task(autoretry_for=(Exception,), retry_backoff=True, max_retries=2)
def create_scheduled_backup():
    call_command("backup_store")
