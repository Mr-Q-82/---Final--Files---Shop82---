from rest_framework.test import APITestCase

from apps.accounts.models import User, Wallet, WalletTransaction


class WalletTopupV18Tests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(phone="+989120000082")
        self.client.force_authenticate(self.user)

    def test_user_can_top_up_wallet_and_transaction_is_recorded(self):
        response = self.client.post(
            "/api/v1/auth/wallet/", {"amount": 500_000}, format="json"
        )
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["balance"], 500_000)
        transaction = WalletTransaction.objects.get(
            wallet=Wallet.objects.get(user=self.user)
        )
        self.assertEqual(transaction.transaction_type, WalletTransaction.Type.CREDIT)
        self.assertTrue(transaction.reference.startswith("TOPUP-"))

    def test_invalid_top_up_amount_is_rejected(self):
        response = self.client.post(
            "/api/v1/auth/wallet/", {"amount": 1_000}, format="json"
        )
        self.assertEqual(response.status_code, 400)
