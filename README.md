Shop82 — Full-Stack E-Commerce Platform

Shop82 is a full-stack e-commerce project built for selling computer hardware, gaming products, and related accessories. It includes a customer-facing storefront, a dedicated React administration panel, and a Django REST API.

The project is designed as a practical store management system rather than a UI-only demo. Product catalog management, authentication, orders, inventory, payments, content management, reporting, backup and restore, and customer services are connected through the same API.

Project status: Active development
Default language: Persian (RTL)
Main branch: main

توسعه‌دهندگان

Backend: مهدی پیرحیاتی — Mahdi Pirhayati

Frontend: حامد حسینی — Hamed Hosseini

پیاده‌سازی بک‌اند، APIها و منطق اصلی فروشگاه با Django و Django REST Framework انجام شده است. رابط فروشگاه و پنل مدیریت نیز با React و JavaScript توسعه داده شده‌اند.

نمای کلی پروژه

Shop82 از دو رابط مستقل استفاده می‌کند:

Storefront: فروشگاه اصلی برای مشاهده و جست‌وجوی محصولات، خرید، حساب کاربری و پیگیری سفارش‌ها

Admin Panel: پنل مدیریت اختصاصی برای کنترل محصولات، دسته‌بندی‌ها، سفارش‌ها، کاربران، محتوا، موجودی و تنظیمات سایت

پنل مدیریت این پروژه جایگزین رابط پیش‌فرض Django Admin است و مستقیماً با REST API ارتباط دارد.

Tech Stack

Backend

Python 3.10+

Django 5.2

Django REST Framework

PostgreSQL 17

Simple JWT

Redis and Celery

Gunicorn

Pillow

Frontend

React 18

JavaScript / JSX

esbuild

Leaflet

Playwright

Progressive Web App (PWA)

Infrastructure

Docker Compose

PostgreSQL

Redis

Optional S3-compatible media storage

Optional Sentry monitoring

امکانات اصلی

فروشگاه و کاتالوگ

دسته‌بندی محصولات عادی و گیمینگ

مدیریت محصول، برند، تصویر اصلی و گالری تصاویر

تنوع محصول با SKU، قیمت و موجودی مستقل

جست‌وجوی زنده فارسی از اولین حرف

فیلتر براساس دسته‌بندی، برند، قیمت و ویژگی‌ها

پیشنهاد محصولات مرتبط و پیشنهادهای ویژه

علاقه‌مندی و مقایسه محصولات

صفحه راهنمای خرید و مقایسه مدل‌ها

تاریخچه قیمت و هشدار موجودشدن کالا

ورود و خروجی CSV محصولات

مدیریت گروهی قیمت و موجودی

حساب کاربری و امنیت

مدل کاربر سفارشی با شماره موبایل

ثبت‌نام و ورود با OTP

ورود با شماره موبایل و رمز عبور

بازیابی و تغییر رمز عبور

JWT access/refresh token

نقش‌های CUSTOMER، STAFF و ADMIN

ورود دومرحله‌ای اختیاری مدیر

محدودیت نرخ درخواست‌های ورود و OTP

پروفایل، آواتار و چند آدرس برای هر کاربر

اعلان‌های داخل سایت

سفارش و پرداخت

سبد خرید و ثبت اتمیک سفارش

کنترل و رزرو موجودی

کد تخفیف درصدی یا مبلغ ثابت

درگاه آزمایشی mock برای توسعه

اتصال اختیاری به زرین‌پال

جلوگیری از ثبت یا پرداخت تکراری سفارش

لغو سفارش و بازگردانی موجودی

تاریخچه وضعیت سفارش و کد رهگیری

فاکتور PDF فارسی

مرجوعی و بازپرداخت به کیف پول

امکانات مدیریتی

داشبورد فروش و گزارش‌های مدیریتی

مدیریت کاربران، محصولات، برندها و دسته‌بندی‌ها

مدیریت سفارش، ارسال، انبار و تأمین‌کننده

مدیریت نظرات و پرسش‌وپاسخ محصولات

مدیریت منو، بنر، اسلایدر و محتوای صفحه اصلی

مدیریت مستقل محتوای صفحه گیمینگ

تیکت پشتیبانی و مرکز پیام

باشگاه مشتریان، امتیاز و کد دعوت

فروش ویژه زمان‌دار و قوانین تخفیف

ثبت گزارش فعالیت مدیران

بکاپ و ریستور کامل دیتابیس و تصاویر

SEO و تجربه کاربری

URLهای تمیز برای صفحات فروشگاه

متادیتای قابل ایندکس

Product Schema و Structured Data

sitemap.xml و robots.txt

Prerender صفحات عمومی

طراحی RTL و واکنش‌گرا

تم روشن و تیره

Service Worker و کش کنترل‌شده

Lazy loading برای صفحات و داده‌های کاتالوگ

ساختار پوشه‌ها

Final_Shop82/
├── backend/
│ ├── apps/
│ │ ├── accounts/ # کاربران، ورود، OTP، کیف پول و اعلان‌ها
│ │ ├── catalog/ # محصولات، دسته‌ها، برندها و محتوای فروشگاه
│ │ ├── orders/ # سفارش، پرداخت، تخفیف و مرجوعی
│ │ ├── operations/ # انبار، ارسال و تأمین‌کنندگان
│ │ ├── dashboard/ # گزارش‌ها و آمار مدیریتی
│ │ └── common/ # ابزارها و سرویس‌های مشترک
│ ├── config/ # تنظیمات Django، URLها و Celery
│ ├── media/ # فایل‌های آپلودشده در محیط محلی
│ ├── manage.py
│ └── requirements.txt
├── frontend/
│ ├── html/ # ورودی فروشگاه و پنل مدیریت
│ ├── css/ # استایل‌های فروشگاه و پنل
│ ├── js/
│ │ ├── storefront/ # صفحات و اجزای فروشگاه
│ │ ├── admin/ # صفحات و اجزای پنل مدیریت
│ │ ├── api/ # کلاینت ارتباط با API
│ │ └── shared/ # ابزارهای مشترک
│ ├── public/ # Manifest و فایل‌های عمومی
│ ├── scripts/ # Build، quality check و prerender
│ ├── tests/ # تست‌های واحد و مرورگر
│ ├── dev_server.py
│ └── package.json
├── docker-compose.yml
└── README.md

جزئیات ماژول‌های فرانت‌اند در frontend/README.md و نقشه ماژولارسازی در MODULARIZATION-MAP-v110.md قرار دارد.

پیش‌نیازها

برای اجرای دستی پروژه موارد زیر لازم است:

Python 3.10 یا جدیدتر

Node.js 20 یا جدیدتر

PostgreSQL 17

Git

Redis، فقط برای Celery و وظایف پس‌زمینه

برای اجرای سرویس‌های زیرساختی با Docker:

Docker Desktop

Docker Compose

راه‌اندازی بک‌اند در Windows

از پوشه اصلی پروژه وارد بک‌اند شوید:

cd backend
py -m venv .venv
.venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt
copy .env.example .env

در PostgreSQL یک دیتابیس ایجاد کنید:

CREATE DATABASE shop82;

سپس مشخصات دیتابیس را در backend/.env وارد کنید:

DATABASE_NAME=shop82
DATABASE_USER=postgres
DATABASE_PASSWORD=your-postgres-password
DATABASE_HOST=localhost
DATABASE_PORT=5432

مایگریشن‌ها را اجرا کرده و مدیر اولیه را بسازید:

python manage.py migrate
python manage.py createsuperuser
python manage.py seed_demo
python manage.py runserver

API در آدرس زیر اجرا می‌شود:

http://127.0.0.1:8000/api/v1/

راه‌اندازی بک‌اند در Linux/macOS

cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py createsuperuser
python manage.py seed_demo
python manage.py runserver

راه‌اندازی فرانت‌اند

در یک ترمینال جداگانه:

cd frontend
npm install
npm run build
python dev_server.py

آدرس‌های محلی:

بخش

آدرس

فروشگاه

http://127.0.0.1:5500/

پنل مدیریت

http://127.0.0.1:5500/admin

صفحه گیمینگ

http://127.0.0.1:5500/gaming

راهنمای خرید

http://127.0.0.1:5500/guides

API

http://127.0.0.1:8000/api/v1/

اگر API روی آدرس دیگری اجرا می‌شود، می‌توانید در Console مرورگر آدرس آن را تنظیم کنید:

localStorage.setItem("api_base", "http://127.0.0.1:8000/api/v1");
location.reload();

اجرای سرویس‌ها با Docker

فایل Compose سرویس‌های PostgreSQL، Redis، Django، Celery Worker و Celery Beat را اجرا می‌کند:

docker compose up --build

پس از آماده‌شدن سرویس‌ها، بک‌اند در http://127.0.0.1:8000 در دسترس است. فرانت‌اند را جداگانه از پوشه frontend اجرا کنید:

cd frontend
npm install
npm run build
python dev_server.py

برای توقف سرویس‌ها:

docker compose down

برای حذف Volumeهای دیتابیس و Redis نیز می‌توان از دستور زیر استفاده کرد؛ این دستور داده‌های محلی Docker را حذف می‌کند:

docker compose down -v

Environment Variables

فایل نمونه تنظیمات در backend/.env.example قرار دارد. مهم‌ترین گزینه‌ها:

متغیر

توضیح

DJANGO_SECRET_KEY

کلید امنیتی Django؛ در Production حتماً تغییر کند

DJANGO_DEBUG

در سرور واقعی باید False باشد

DJANGO_ALLOWED_HOSTS

دامنه‌های مجاز بک‌اند

DATABASE\_\*

اطلاعات اتصال PostgreSQL

CORS_ALLOWED_ORIGINS

آدرس‌های مجاز فرانت‌اند

REDIS_URL

اتصال Redis برای کش و سرویس‌های پس‌زمینه

SMS_BACKEND

حالت console یا kavenegar

PAYMENT_PROVIDER

حالت mock یا ZARINPAL

SENTRY_DSN

اتصال اختیاری Sentry

AWS_STORAGE_BUCKET_NAME

ذخیره اختیاری فایل‌ها روی فضای S3-compatible

هیچ‌وقت فایل .env، کلید پیامک، اطلاعات درگاه یا رمز دیتابیس را در GitHub قرار ندهید.

تنظیم پیامک

در محیط توسعه:

SMS_BACKEND=console

برای استفاده از کاوه‌نگار:

SMS_BACKEND=kavenegar
KAVENEGAR_API_KEY=your-api-key
KAVENEGAR_OTP_TEMPLATE=your-otp-template
KAVENEGAR_ORDER_TEMPLATE=your-order-template

تنظیم پرداخت

در محیط توسعه:

PAYMENT_PROVIDER=mock

برای درگاه واقعی:

PAYMENT_PROVIDER=ZARINPAL
ZARINPAL_MERCHANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
PAYMENT_CALLBACK_URL=https://example.com/api/v1/orders/payment-callback/

تصاویر محصولات

تصاویر آپلودشده به‌صورت دسته‌بندی‌شده در مسیر زیر نگهداری می‌شوند:

backend/media/products/<category-slug>/<product-slug>/main/
backend/media/products/<category-slug>/<product-slug>/gallery/

برای اتصال تصاویر آماده پروژه به محصولات دیتابیس:

cd backend
python manage.py import_product_images --replace --dry-run
python manage.py import_product_images --replace

برای بررسی و انتقال تصاویر باقی‌مانده از نسخه‌های قدیمی:

python manage.py reorganize_product_media --dry-run
python manage.py reorganize_product_media

قبل از اجرای دستور دوم، خروجی --dry-run را بررسی کنید.

Backup and Restore

بکاپ کامل شامل داده‌های فروشگاه و تصاویر است:

cd backend
python manage.py backup_store

فایل خروجی در backend/backups ذخیره می‌شود. همین عملیات از بخش «بکاپ کامل» پنل مدیریت نیز در دسترس است.

پیش از Restore، سیستم یک بکاپ ایمنی با پیشوند before-restore-full می‌سازد. بااین‌حال، برای محیط Production توصیه می‌شود فایل بکاپ را در فضای جداگانه نیز نگهداری کنید.

Testing and Quality Checks

Backend tests

cd backend
python manage.py test apps.accounts apps.catalog apps.orders

Frontend checks

cd frontend
npm run lint
npm run typecheck
npm run test:unit
npm run build

اجرای تمام بررسی‌های اصلی فرانت‌اند:

npm run check

End-to-end tests

cd frontend
npx playwright install chromium
npm run test:e2e

API Overview

Base URL:

/api/v1/

Endpoint

کاربرد

POST /auth/otp/request/

درخواست کد OTP

POST /auth/otp/verify/

تأیید OTP و دریافت توکن

POST /auth/password/login/

ورود با شماره و رمز

GET/PATCH /auth/me/

دریافت یا ویرایش پروفایل

/auth/addresses/

مدیریت آدرس‌ها

/catalog/categories/

دسته‌بندی‌ها

/catalog/brands/

برندها

/catalog/products/

محصولات

GET /catalog/products/suggest/?q=

پیشنهاد زنده جست‌وجو

/catalog/favorites/

علاقه‌مندی‌ها

/catalog/comparison/

مقایسه محصولات

/catalog/reviews/

امتیازها و دیدگاه‌ها

POST /orders/checkout/

ثبت سفارش

/orders/admin/all/

مدیریت سفارش‌ها

GET /dashboard/overview/

خلاصه آمار مدیریت

/operations/inventory/

عملیات انبار

تمام APIهای مدیریتی نیازمند احراز هویت و سطح دسترسی مناسب هستند.

Production Checklist

قبل از انتشار نسخه واقعی:

مقدار DJANGO_DEBUG=False تنظیم شود.

برای DJANGO_SECRET_KEY یک مقدار امن و اختصاصی ساخته شود.

دامنه‌های واقعی در DJANGO_ALLOWED_HOSTS، CORS_ALLOWED_ORIGINS و CSRF_TRUSTED_ORIGINS قرار گیرند.

HTTPS، HSTS و Secure Cookie فعال شوند.

PostgreSQL و Redis با رمز و دسترسی محدود اجرا شوند.

سرویس ارسال پیامک و درگاه پرداخت واقعی تنظیم شوند.

فایل‌های Media روی فضای پایدار یا S3 نگهداری شوند.

بکاپ زمان‌بندی‌شده و تست دوره‌ای Restore انجام شود.

فایل .env، دیتابیس محلی، Media و Backupها وارد Git نشوند.

دستورهای migration، collectstatic و بررسی سلامت سرویس در فرایند Deploy اجرا شوند.

خطاهای متداول

تغییرات فرانت‌اند نمایش داده نمی‌شوند

ابتدا فایل‌ها را دوباره Build کنید و صفحه را با Ctrl + Shift + R تازه‌سازی کنید:

cd frontend
npm run build

تصویر آپلودشده نمایش داده نمی‌شود

بک‌اند باید در حال اجرا باشد.

آدرس API فرانت‌اند را بررسی کنید.

در محیط توسعه DJANGO_DEBUG=True باشد.

مسیر ثبت‌شده تصویر باید داخل backend/media قرار گرفته باشد.

تنظیمات CORS و آدرس Media را بررسی کنید.

خطای migration یا نبودن جدول

cd backend
python manage.py migrate
python manage.py showmigrations

پنل مدیریت به API متصل نمی‌شود

مطمئن شوید API روی پورت 8000 و فرانت‌اند روی پورت 5500 اجرا شده‌اند و آدرس فرانت‌اند داخل CORS_ALLOWED_ORIGINS وجود دارد.

Contributing

این مخزن در حال توسعه است. برای تغییرات جدید، بهتر است یک Branch جدا ایجاد شود و قبل از Merge، تست‌ها و Build پروژه اجرا شوند:

git checkout -b feature/short-description
npm run check
git add .
git commit -m "Add: short description"

گزارش باگ بهتر است شامل مراحل بازتولید، خروجی Console یا ترمینال، نسخه سیستم‌عامل و تصویر خطا باشد.

License

No open-source license has been assigned to this repository yet. Unless a license file is added, reuse, redistribution, or commercial use of the source code requires permission from the project owners.

Repository

github.com/Mr-Q-82/Final_Shop82
