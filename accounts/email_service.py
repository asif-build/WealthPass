import logging
import os
from urllib.parse import urlparse
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.utils.html import escape

logger = logging.getLogger(__name__)


class EmailService:
    """
    Production-grade Email Dispatch Service for WealthPass.
    Supports transactional emails for email verification, account activation,
    and password reset with cryptographic tokens.
    """

    @classmethod
    def get_base_url(cls, request=None) -> str:
        """
        Determines the trusted frontend application URL.
        Never trusts raw untrusted Host headers in production.
        """
        configured_url = os.getenv('FRONTEND_URL') or getattr(settings, 'FRONTEND_URL', None)
        if configured_url:
            return configured_url.rstrip('/')

        if request:
            origin = request.headers.get('Origin') or request.headers.get('origin')
            if origin:
                parsed = urlparse(origin)
                # Allow localhost or configured hosts
                if parsed.hostname in ['localhost', '127.0.0.1', 'wealthpass.in', 'wealthpass.com'] or parsed.hostname.endswith('.onrender.com') or parsed.hostname.endswith('.ngrok-free.dev'):
                    return origin.rstrip('/')

            referer = request.headers.get('Referer') or request.headers.get('referer')
            if referer:
                parsed = urlparse(referer)
                if parsed.scheme and parsed.netloc:
                    return f"{parsed.scheme}://{parsed.netloc}".rstrip('/')

        return 'http://localhost:8000'

    @classmethod
    def send_verification_email(cls, user, raw_token: str, request=None) -> tuple[bool, str | None]:
        """
        Dispatches account activation email with secure single-use token.
        """
        base_url = cls.get_base_url(request)
        verification_url = f"{base_url}/verify-email?token={raw_token}"
        support_email = getattr(settings, 'CONTACT_EMAIL', 'wealthpass.official@gmail.com')
        full_name = escape(user.get_full_name() or user.username)

        subject = "Verify your email — WealthPass"

        text_content = f"""Hello {full_name},

Thank you for registering with WealthPass.

Please verify your email address by opening the following secure link in your browser:
{verification_url}

This link is single-use and will expire in 24 hours.

If you did not create a WealthPass account, you can safely ignore this email.

Need assistance? Contact us at {support_email}.

WealthPass Technologies Pvt. Ltd.
"""

        html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Verify your email - WealthPass</title>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0b0b; color: #E1E0CC; margin: 0; padding: 40px 20px; }}
    .container {{ max-width: 560px; margin: 0 auto; background: #121212; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 40px; }}
    .logo {{ text-align: center; margin-bottom: 32px; }}
    .logo-text {{ font-size: 24px; font-weight: 700; color: #E1E0CC; letter-spacing: -0.04em; }}
    h1 {{ font-size: 22px; font-weight: 600; color: #FFFFFF; margin-bottom: 16px; line-height: 1.3; }}
    p {{ font-size: 14px; line-height: 1.6; color: #CCCCCC; margin-bottom: 24px; }}
    .btn-container {{ text-align: center; margin: 32px 0; }}
    .btn {{ display: inline-block; background-color: #E1E0CC; color: #000000; font-weight: 600; font-size: 14px; text-decoration: none; padding: 14px 32px; border-radius: 9999px; letter-spacing: 0.04em; }}
    .footer {{ font-size: 12px; color: #777777; border-top: 1px solid rgba(255, 255, 255, 0.06); padding-top: 24px; margin-top: 32px; line-height: 1.5; text-align: center; }}
    .link-alt {{ font-size: 12px; color: #888888; word-break: break-all; margin-top: 16px; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <span class="logo-text">WEALTHPASS</span>
    </div>
    <h1>Verify your email address</h1>
    <p>Hello {full_name},</p>
    <p>Thank you for creating an account with WealthPass. To secure your profile and begin searching for unclaimed assets and estate rights, please verify your email address.</p>
    <div class="btn-container">
      <a href="{verification_url}" class="btn">VERIFY EMAIL ADDRESS</a>
    </div>
    <p class="link-alt">Or copy and paste this link in your browser:<br><a href="{verification_url}" style="color: #E1E0CC;">{verification_url}</a></p>
    <p style="font-size: 12px; color: #888888;">This link is valid for 24 hours and can only be used once.</p>
    <div class="footer">
      &copy; WealthPass Technologies Pvt. Ltd. All rights reserved.<br>
      If you did not request this account, please ignore this message.
    </div>
  </div>
</body>
</html>"""

        try:
            from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'wealthpass.official@gmail.com')
            msg = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=from_email,
                to=[user.email]
            )
            msg.attach_alternative(html_content, "text/html")
            msg.send(fail_silently=False)
            logger.info("Verification email successfully dispatched to %s", user.email)
            return True, None
        except Exception as e:
            logger.error("Failed to send verification email to %s: %s", user.email, str(e))
            return False, str(e)

    @classmethod
    def send_password_reset_email(cls, user, raw_token: str, request=None) -> tuple[bool, str | None]:
        """
        Dispatches password reset link with single-use token.
        """
        base_url = cls.get_base_url(request)
        reset_url = f"{base_url}/reset-password?token={raw_token}"
        support_email = getattr(settings, 'CONTACT_EMAIL', 'wealthpass.official@gmail.com')
        full_name = escape(user.get_full_name() or user.username)

        subject = "Reset your password — WealthPass"

        text_content = f"""Hello {full_name},

We received a request to reset your WealthPass password.

To set a new password, open this secure link:
{reset_url}

This link is valid for 1 hour and can only be used once.

If you did not request a password reset, please secure your account or contact support immediately at {support_email}.

WealthPass Technologies Pvt. Ltd.
"""

        html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reset your password - WealthPass</title>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0b0b; color: #E1E0CC; margin: 0; padding: 40px 20px; }}
    .container {{ max-width: 560px; margin: 0 auto; background: #121212; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 40px; }}
    .logo {{ text-align: center; margin-bottom: 32px; }}
    .logo-text {{ font-size: 24px; font-weight: 700; color: #E1E0CC; letter-spacing: -0.04em; }}
    h1 {{ font-size: 22px; font-weight: 600; color: #FFFFFF; margin-bottom: 16px; line-height: 1.3; }}
    p {{ font-size: 14px; line-height: 1.6; color: #CCCCCC; margin-bottom: 24px; }}
    .btn-container {{ text-align: center; margin: 32px 0; }}
    .btn {{ display: inline-block; background-color: #E1E0CC; color: #000000; font-weight: 600; font-size: 14px; text-decoration: none; padding: 14px 32px; border-radius: 9999px; letter-spacing: 0.04em; }}
    .footer {{ font-size: 12px; color: #777777; border-top: 1px solid rgba(255, 255, 255, 0.06); padding-top: 24px; margin-top: 32px; line-height: 1.5; text-align: center; }}
    .link-alt {{ font-size: 12px; color: #888888; word-break: break-all; margin-top: 16px; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <span class="logo-text">WEALTHPASS</span>
    </div>
    <h1>Reset your password</h1>
    <p>Hello {full_name},</p>
    <p>We received a request to reset your WealthPass account password. Click the button below to choose a new password.</p>
    <div class="btn-container">
      <a href="{reset_url}" class="btn">RESET PASSWORD</a>
    </div>
    <p class="link-alt">Or copy and paste this link in your browser:<br><a href="{reset_url}" style="color: #E1E0CC;">{reset_url}</a></p>
    <p style="font-size: 12px; color: #888888;">This link is valid for 1 hour. If you did not request this, you can ignore this email.</p>
    <div class="footer">
      &copy; WealthPass Technologies Pvt. Ltd. All rights reserved.<br>
      Security & Recovery Support: {support_email}
    </div>
  </div>
</body>
</html>"""

        try:
            from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'wealthpass.official@gmail.com')
            msg = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=from_email,
                to=[user.email]
            )
            msg.attach_alternative(html_content, "text/html")
            msg.send(fail_silently=False)
            logger.info("Password reset email successfully dispatched to %s", user.email)
            return True, None
        except Exception as e:
            logger.error("Failed to send password reset email to %s: %s", user.email, str(e))
            return False, str(e)
