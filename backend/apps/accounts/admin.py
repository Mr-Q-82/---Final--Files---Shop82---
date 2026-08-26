from django.contrib import admin
from .models import Address, LoyaltyPointEntry, LoyaltyProfile, OTP, ReferralEvent, User

admin.site.register([User, Address, OTP, LoyaltyProfile, LoyaltyPointEntry, ReferralEvent])
