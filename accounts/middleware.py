import time
from django.conf import settings
from django.contrib.auth import logout
from django.http import JsonResponse
from django.shortcuts import redirect
from django.utils import timezone
from .models import AuthAuditLog


class SessionSecurityMiddleware:
    """
    Enterprise Fintech Session Security Middleware:
    1. Enforces server-side inactivity timeout (default 30 mins).
    2. Enforces absolute session lifetime.
    3. Adds strict Cache-Control headers to private endpoints to prevent browser history caching.
    4. Records security audit logs on session expiration.
    """

    def __init__(self, get_response):
        self.get_response = get_response
        self.inactivity_timeout = getattr(settings, 'SESSION_INACTIVITY_TIMEOUT', 1800)  # 30 mins
        self.absolute_timeout = getattr(settings, 'SESSION_ABSOLUTE_TIMEOUT', 86400 * 14)  # 14 days

    def __call__(self, request):
        now_ts = int(time.time())

        if request.user.is_authenticated:
            last_activity = request.session.get('_wp_last_activity')
            session_created = request.session.get('_wp_session_created')

            # Check inactivity timeout
            if last_activity and (now_ts - last_activity > self.inactivity_timeout):
                user = request.user
                ip_addr = request.META.get('REMOTE_ADDR') or '127.0.0.1'

                AuthAuditLog.objects.create(
                    user=user,
                    event_type='SESSION_TIMEOUT',
                    ip_address=ip_addr,
                    user_agent=request.META.get('HTTP_USER_AGENT', ''),
                    details={'reason': 'Inactivity timeout reached', 'inactivity_seconds': now_ts - last_activity}
                )

                logout(request)

                if self._is_api_request(request):
                    response = JsonResponse({
                        'success': False,
                        'error': 'Session expired due to inactivity. Please sign in again.',
                        'code': 'SESSION_EXPIRED',
                        'session_expired': True
                    }, status=401)
                    self._add_anti_cache_headers(response)
                    return response

                return redirect('/login?reason=timeout')

            # Check absolute lifetime
            if session_created and (now_ts - session_created > self.absolute_timeout):
                logout(request)
                if self._is_api_request(request):
                    response = JsonResponse({
                        'success': False,
                        'error': 'Session expired. Please sign in again.',
                        'code': 'SESSION_EXPIRED',
                        'session_expired': True
                    }, status=401)
                    self._add_anti_cache_headers(response)
                    return response
                return redirect('/login?reason=expired')

            # Update activity timestamps
            request.session['_wp_last_activity'] = now_ts
            if not session_created:
                request.session['_wp_session_created'] = now_ts

        response = self.get_response(request)

        # Apply strict anti-caching headers on all authenticated and private API responses
        if request.user.is_authenticated or self._is_private_path(request.path):
            self._add_anti_cache_headers(response)

        # Security baseline headers
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'

        return response

    def _is_api_request(self, request) -> bool:
        if request.path.startswith('/api/'):
            return True
        accept = request.META.get('HTTP_ACCEPT', '')
        return 'application/json' in accept or request.headers.get('x-requested-with') == 'XMLHttpRequest'

    def _is_private_path(self, path: str) -> bool:
        private_prefixes = [
            '/api/auth/me',
            '/api/user/',
            '/api/verify',
            '/api/consent',
            '/api/relationship',
            '/api/discover',
            '/api/claim-preparation',
            '/dashboard',
            '/verify',
            '/results',
            '/loan',
            '/accept-loan',
            '/success',
            '/print-forms',
        ]
        return any(path.startswith(prefix) for prefix in private_prefixes)

    def _add_anti_cache_headers(self, response):
        response['Cache-Control'] = 'no-cache, no-store, must-revalidate, private, max-age=0'
        response['Pragma'] = 'no-cache'
        response['Expires'] = '0'
