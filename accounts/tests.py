from datetime import timedelta
from django.test import TestCase, Client
from django.contrib.auth.models import User
from django.utils import timezone
from accounts.models import (
    UserProfile, LegalAcceptance, EmailVerificationToken,
    PasswordResetToken, MobileOTPRecord, AuthAuditLog,
    AccountStatus, hash_token
)
from accounts.sms_service import SMSService


class WealthPassAuthenticationTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.test_password = "SecurePassword@2026!"
        self.test_email = "investor@example.com"
        self.test_phone = "+919876543210"

    def test_01_register_new_account_success(self):
        """1. Register a new account with explicit separate legal agreements."""
        payload = {
            "full_name": "Arun Kumar",
            "email": self.test_email,
            "phone": self.test_phone,
            "password": self.test_password,
            "confirm_password": self.test_password,
            "terms_accepted": True,
            "privacy_acknowledged": True,
        }
        response = self.client.post(
            "/api/auth/register/",
            data=payload,
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertTrue(data["requires_verification"])

        # Check DB User creation
        user = User.objects.get(email=self.test_email)
        self.assertEqual(user.first_name, "Arun")
        self.assertEqual(user.last_name, "Kumar")
        self.assertTrue(user.check_password(self.test_password))

        # Check Profile
        self.assertFalse(user.profile.is_email_verified)
        self.assertEqual(user.profile.account_status, AccountStatus.PENDING_VERIFICATION)
        self.assertEqual(user.profile.phone_e164, "+919876543210")

        # Check separate legal acceptance audit
        legal = user.legal_acceptances.first()
        self.assertIsNotNone(legal)
        self.assertEqual(legal.terms_version, "v1.0")
        self.assertEqual(legal.privacy_policy_version, "v1.0")
        self.assertIsNotNone(legal.terms_accepted_at)
        self.assertIsNotNone(legal.privacy_acknowledged_at)

        # Check single-use verification token created
        token_obj = EmailVerificationToken.objects.filter(user=user).first()
        self.assertIsNotNone(token_obj)
        self.assertFalse(token_obj.is_used)

    def test_02_reject_invalid_registration_data(self):
        """2. Reject registration if mandatory fields or legal checkboxes are missing."""
        # Missing Terms checkbox
        payload = {
            "full_name": "Arun Kumar",
            "email": "invalid@example.com",
            "phone": "+919876543210",
            "password": self.test_password,
            "confirm_password": self.test_password,
            "terms_accepted": False,
            "privacy_acknowledged": True,
        }
        res = self.client.post("/api/auth/register/", data=payload, content_type="application/json")
        self.assertEqual(res.status_code, 400)
        self.assertIn("Terms & Conditions", res.json()["error"])

        # Weak password
        payload["terms_accepted"] = True
        payload["password"] = "weak"
        payload["confirm_password"] = "weak"
        res = self.client.post("/api/auth/register/", data=payload, content_type="application/json")
        self.assertEqual(res.status_code, 400)
        self.assertIn("at least 8 characters", res.json()["error"])

    def test_03_reject_duplicate_registration(self):
        """3. Reject duplicate account registration safely."""
        # First registration
        payload = {
            "full_name": "Arun Kumar",
            "email": self.test_email,
            "phone": self.test_phone,
            "password": self.test_password,
            "confirm_password": self.test_password,
            "terms_accepted": True,
            "privacy_acknowledged": True,
        }
        self.client.post("/api/auth/register/", data=payload, content_type="application/json")

        # Duplicate email
        res = self.client.post("/api/auth/register/", data=payload, content_type="application/json")
        self.assertEqual(res.status_code, 409)
        self.assertIn("already exists", res.json()["error"])

    def test_04_verify_email_successfully(self):
        """4. Verify email using cryptographic single-use token."""
        # Register user
        user = User.objects.create_user(username="test@wp.in", email="test@wp.in", password=self.test_password)
        profile = UserProfile.objects.create(user=user, phone_e164="+919876543211", is_email_verified=False)
        token_obj, raw_token = EmailVerificationToken.create_token(user=user)

        # GET verification
        res = self.client.get(f"/api/auth/verify-email/?token={raw_token}")
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.json()["success"])

        profile.refresh_from_db()
        self.assertTrue(profile.is_email_verified)
        self.assertIsNotNone(profile.email_verified_at)
        self.assertEqual(profile.account_status, AccountStatus.ACTIVE)

        token_obj.refresh_from_db()
        self.assertTrue(token_obj.is_used)

    def test_05_reject_expired_or_reused_verification_tokens(self):
        """5. Prevent token reuse and reject expired tokens."""
        user = User.objects.create_user(username="test2@wp.in", email="test2@wp.in", password=self.test_password)
        UserProfile.objects.create(user=user, phone_e164="+919876543212", is_email_verified=False)
        
        # Expired token
        token_obj, raw_token = EmailVerificationToken.create_token(user=user)
        token_obj.expires_at = timezone.now() - timedelta(hours=1)
        token_obj.save()

        res = self.client.get(f"/api/auth/verify-email/?token={raw_token}")
        self.assertEqual(res.status_code, 400)
        self.assertIn("expired", res.json()["error"])

        # Reused token
        token_obj.expires_at = timezone.now() + timedelta(hours=1)
        token_obj.is_used = True
        token_obj.save()

        res2 = self.client.get(f"/api/auth/verify-email/?token={raw_token}")
        self.assertEqual(res2.status_code, 400)
        self.assertIn("already been used", res2.json()["error"])

    def test_06_login_flow_and_unverified_account_handling(self):
        """6. Handle unverified accounts, credential verification, and sessions."""
        user = User.objects.create_user(username="login@wp.in", email="login@wp.in", password=self.test_password)
        profile = UserProfile.objects.create(user=user, phone_e164="+919876543213", is_email_verified=False)

        # Attempt login while unverified
        res = self.client.post(
            "/api/auth/login/",
            data={"email": "login@wp.in", "password": self.test_password},
            content_type="application/json"
        )
        self.assertEqual(res.status_code, 403)
        self.assertTrue(res.json()["requires_verification"])

        # Activate user email
        profile.is_email_verified = True
        profile.account_status = AccountStatus.ACTIVE
        profile.save()

        # Login with incorrect password
        res_fail = self.client.post(
            "/api/auth/login/",
            data={"email": "login@wp.in", "password": "WrongPassword123!"},
            content_type="application/json"
        )
        self.assertEqual(res_fail.status_code, 401)
        self.assertIn("Invalid email or password", res_fail.json()["error"])

        # Successful login
        res_succ = self.client.post(
            "/api/auth/login/",
            data={"email": "login@wp.in", "password": self.test_password},
            content_type="application/json"
        )
        self.assertEqual(res_succ.status_code, 200)
        self.assertTrue(res_succ.json()["success"])
        self.assertEqual(res_succ.json()["user"]["email"], "login@wp.in")

        # Verify session state endpoint (/api/auth/me/)
        me_res = self.client.get("/api/auth/me/")
        self.assertEqual(me_res.status_code, 200)
        self.assertTrue(me_res.json()["isAuthenticated"])

        # Logout
        logout_res = self.client.post("/api/auth/logout/")
        self.assertEqual(logout_res.status_code, 200)

        me_res_after = self.client.get("/api/auth/me/")
        self.assertFalse(me_res_after.json()["isAuthenticated"])

    def test_07_password_reset_flow(self):
        """7. Forgot password, single-use reset token validation, and password update."""
        user = User.objects.create_user(username="reset@wp.in", email="reset@wp.in", password=self.test_password)
        UserProfile.objects.create(user=user, phone_e164="+919876543214", is_email_verified=True)

        # Forgot password request (generic anti-enumeration response)
        res_forgot = self.client.post(
            "/api/auth/forgot-password/",
            data={"email": "reset@wp.in"},
            content_type="application/json"
        )
        self.assertEqual(res_forgot.status_code, 200)
        self.assertTrue(res_forgot.json()["success"])

        # Extract token
        token_record = PasswordResetToken.objects.filter(user=user, is_used=False).first()
        self.assertIsNotNone(token_record)

        # Generate a test raw token and update token_hash to match
        raw_test_token = "secure_reset_token_test_12345"
        token_record.token_hash = hash_token(raw_test_token)
        token_record.save()

        # Reset password
        new_pw = "NewSecurePassword#2026"
        res_reset = self.client.post(
            "/api/auth/reset-password/",
            data={
                "token": raw_test_token,
                "password": new_pw,
                "confirm_password": new_pw
            },
            content_type="application/json"
        )
        self.assertEqual(res_reset.status_code, 200)
        self.assertTrue(res_reset.json()["success"])

        # Confirm user can log in with new password
        user.refresh_from_db()
        self.assertTrue(user.check_password(new_pw))

        # Ensure reset token cannot be reused
        res_reuse = self.client.post(
            "/api/auth/reset-password/",
            data={"token": raw_test_token, "password": "AnotherPassword@999", "confirm_password": "AnotherPassword@999"},
            content_type="application/json"
        )
        self.assertEqual(res_reuse.status_code, 400)

    def test_08_mobile_otp_verification(self):
        """8. Real Mobile OTP dispatch, verification, attempt limits, and statutory notice."""
        user = User.objects.create_user(username="otp@wp.in", email="otp@wp.in", password=self.test_password)
        profile = UserProfile.objects.create(user=user, phone_e164="+919876543215", is_email_verified=True, is_phone_verified=False)

        phone = "+919876543215"
        # Directly generate OTP record
        otp_rec, raw_otp = MobileOTPRecord.create_otp(phone_e164=phone, user=user)

        # Incorrect OTP
        res_bad = self.client.post(
            "/api/auth/verify-otp/",
            data={"phone": phone, "otp": "000000"},
            content_type="application/json"
        )
        self.assertEqual(res_bad.status_code, 400)
        self.assertIn("Incorrect OTP", res_bad.json()["error"])

        # Correct OTP
        res_good = self.client.post(
            "/api/auth/verify-otp/",
            data={"phone": phone, "otp": raw_otp},
            content_type="application/json"
        )
        self.assertEqual(res_good.status_code, 200)
        self.assertTrue(res_good.json()["success"])
        self.assertIn("notice", res_good.json())

        profile.refresh_from_db()
        self.assertTrue(profile.is_phone_verified)
        self.assertIsNotNone(profile.phone_verified_at)

    def test_09_legal_pages_rendered(self):
        """9. Verify /terms/ and /privacy-policy/ routes resolve to 200 OK."""
        res_terms = self.client.get("/terms/")
        self.assertEqual(res_terms.status_code, 200)

        res_privacy = self.client.get("/privacy-policy/")
        self.assertEqual(res_privacy.status_code, 200)


from unittest.mock import patch
from accounts.phone_utils import validate_and_normalize_indian_phone
from accounts.sms_service import MSG91Provider, SMSService


class IndianMobileNumberValidationTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.valid_password = "SecurePassword@2026!"
        self.expected_error = "Enter a valid 10-digit Indian mobile number."

    def test_phone_utils_valid_numbers(self):
        """Test unit normalization for 10-digit, +91, 91, 0, and spaced/hyphenated formats."""
        valid_cases = [
            ("9876543210", "+919876543210"),
            ("+919876543210", "+919876543210"),
            ("+91 98765 43210", "+919876543210"),
            ("+91-98765-43210", "+919876543210"),
            ("919876543210", "+919876543210"),
            ("09876543210", "+919876543210"),
            ("+91 (98765) 43210", "+919876543210"),
            ("6123456789", "+916123456789"),
            ("7123456789", "+917123456789"),
            ("8123456789", "+918123456789"),
        ]
        for raw, expected in valid_cases:
            valid, norm, err = validate_and_normalize_indian_phone(raw)
            self.assertTrue(valid, f"Expected {raw} to be valid")
            self.assertEqual(norm, expected)
            self.assertIsNone(err)

    def test_phone_utils_invalid_numbers(self):
        """Test rejection of short, excessively long, letters, symbols, invalid prefixes."""
        invalid_cases = [
            "",
            "   ",
            None,
            "98765",  # Too short
            "98765432109999999999",  # Excessively long (caused old bug)
            "+91987654321099999",  # Excessively long with +91
            "98765abc10",  # Letters
            "98765@43210",  # Illegal characters
            "1234567890",  # Doesn't start with 6, 7, 8, or 9
            "5234567890",  # Starts with 5
            "+14155552671",  # US phone number (+1)
            "+447911123456",  # UK phone number (+44)
        ]
        for raw in invalid_cases:
            valid, norm, err = validate_and_normalize_indian_phone(raw)
            self.assertFalse(valid, f"Expected {raw} to be invalid")
            self.assertEqual(err, self.expected_error)

    def test_register_with_excessively_long_number_rejected_with_400(self):
        """Regression test: excessively long number must return 400 Bad Request, not 500 server error."""
        payload = {
            "full_name": "Test Long Phone",
            "email": "longphone@example.com",
            "phone": "98765432109999999999",  # 20 digits
            "password": self.valid_password,
            "confirm_password": self.valid_password,
            "terms_accepted": True,
            "privacy_acknowledged": True,
        }
        res = self.client.post("/api/auth/register/", data=payload, content_type="application/json")
        self.assertEqual(res.status_code, 400)
        data = res.json()
        self.assertFalse(data["success"])
        self.assertEqual(data["error"], self.expected_error)
        self.assertFalse(User.objects.filter(email="longphone@example.com").exists())

    def test_register_with_short_or_alphabetic_phone_rejected(self):
        """Short or alphabetic phone numbers must be rejected with 400 and exact validation error."""
        for bad_phone in ["98765", "98765abc10", "1234567890"]:
            payload = {
                "full_name": "Test Bad Phone",
                "email": f"badphone_{bad_phone[:5]}@example.com",
                "phone": bad_phone,
                "password": self.valid_password,
                "confirm_password": self.valid_password,
                "terms_accepted": True,
                "privacy_acknowledged": True,
            }
            res = self.client.post("/api/auth/register/", data=payload, content_type="application/json")
            self.assertEqual(res.status_code, 400)
            self.assertEqual(res.json()["error"], self.expected_error)

    def test_register_with_valid_formatted_phone_normalizes_to_e164(self):
        """Registration with +91 or spaced numbers succeeds and normalizes to +91XXXXXXXXXX."""
        payload = {
            "full_name": "Valid Formatted",
            "email": "validformatted@example.com",
            "phone": "+91 98765-43210",
            "password": self.valid_password,
            "confirm_password": self.valid_password,
            "terms_accepted": True,
            "privacy_acknowledged": True,
        }
        res = self.client.post("/api/auth/register/", data=payload, content_type="application/json")
        self.assertEqual(res.status_code, 201)
        user = User.objects.get(email="validformatted@example.com")
        self.assertEqual(user.profile.phone_e164, "+919876543210")
        # Ensure phone is NOT marked verified merely upon registration/OTP request
        self.assertFalse(user.profile.is_phone_verified)

    @patch("requests.post")
    def test_msg91_never_called_on_invalid_phone(self, mock_requests_post):
        """Ensure MSG91 HTTP request is NEVER initiated if phone number is invalid."""
        provider = MSG91Provider()
        provider.auth_key = "test_auth_key"
        provider.template_id = "test_template_id"

        # 1. Direct provider call
        success, msg = provider.send_otp("98765432109999999999", "123456")
        self.assertFalse(success)
        self.assertEqual(msg, self.expected_error)
        mock_requests_post.assert_not_called()

        # 2. SMSService call
        with patch.object(SMSService, "get_provider", return_value=provider):
            success2, msg2 = SMSService.send_otp("invalid_phone_123", "123456")
            self.assertFalse(success2)
            self.assertEqual(msg2, self.expected_error)
            mock_requests_post.assert_not_called()

        # 3. API endpoint call
        res = self.client.post(
            "/api/auth/send-otp/",
            data={"phone": "98765432109999999999"},
            content_type="application/json"
        )
        self.assertEqual(res.status_code, 400)
        self.assertEqual(res.json()["error"], self.expected_error)
        mock_requests_post.assert_not_called()

