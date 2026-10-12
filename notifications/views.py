import json
import time
import uuid
from typing import Dict, Any
from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from django.http import JsonResponse, StreamingHttpResponse, HttpResponseForbidden, HttpResponseBadRequest
from django.utils import timezone
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_http_methods

from .models import (
    Notification,
    NotificationPreference,
    PushSubscription,
    ExpoDeviceToken,
    NotificationCategory,
)
from .services import NotificationService


def serialize_notification(n: Notification) -> Dict[str, Any]:
    return {
        'id': str(n.id),
        'event_type': n.event_type,
        'category': n.category,
        'category_label': n.get_category_display(),
        'type': n.notification_type,
        'priority': n.priority,
        'title': n.title,
        'message': n.message,
        'related_object_type': n.related_object_type,
        'related_object_id': n.related_object_id,
        'safe_internal_route': n.safe_internal_route,
        'action_label': n.action_label,
        'action_url': n.action_url,
        'is_read': n.is_read,
        'read_at': n.read_at.isoformat() if n.read_at else None,
        'is_archived': n.is_archived,
        'created_at': n.created_at.isoformat(),
        'time_ago': _format_time_ago(n.created_at),
        'delivery_status': n.delivery_status,
    }


def _format_time_ago(dt) -> str:
    now = timezone.now()
    diff = now - dt
    seconds = int(diff.total_seconds())
    if seconds < 60:
        return 'just now'
    minutes = seconds // 60
    if minutes < 60:
        return f'{minutes}m ago'
    hours = minutes // 60
    if hours < 24:
        return f'{hours}h ago'
    days = hours // 24
    if days < 7:
        return f'{days}d ago'
    return dt.strftime('%d %b %Y')


@login_required
@require_http_methods(['GET'])
def api_notification_list(request):
    """
    Paginated notification list strictly scoped to request.user.
    Supports query parameters:
      - unread_only (bool)
      - category (string)
      - limit (int, default 20, max 100)
      - page (int, default 1)
      - since_id (UUID string)
    """
    user = request.user
    qs = Notification.objects.filter(user=user, is_archived=False)

    unread_only = request.GET.get('unread_only', '').lower() in ('true', '1')
    if unread_only:
        qs = qs.filter(is_read=False)

    category = request.GET.get('category')
    if category and category in NotificationCategory.values:
        qs = qs.filter(category=category)

    since_id = request.GET.get('since_id')
    if since_id:
        try:
            since_uuid = uuid.UUID(since_id)
            since_obj = Notification.objects.filter(id=since_uuid, user=user).first()
            if since_obj:
                qs = qs.filter(created_at__gt=since_obj.created_at)
        except ValueError:
            pass

    try:
        limit = min(int(request.GET.get('limit', 20)), 100)
        page_num = max(int(request.GET.get('page', 1)), 1)
    except ValueError:
        limit = 20
        page_num = 1

    paginator = Paginator(qs, limit)
    page_obj = paginator.get_page(page_num)

    unread_count = Notification.objects.filter(user=user, is_read=False, is_archived=False).count()

    return JsonResponse({
        'success': True,
        'notifications': [serialize_notification(n) for n in page_obj],
        'unread_count': unread_count,
        'total_count': paginator.count,
        'page': page_num,
        'total_pages': paginator.num_pages,
        'has_next': page_obj.has_next(),
    })


@login_required
@require_http_methods(['GET'])
def api_unread_count(request):
    """
    Lightweight unread count endpoint for navbar badges and polling.
    """
    count = Notification.objects.filter(user=request.user, is_read=False, is_archived=False).count()
    return JsonResponse({
        'success': True,
        'unread_count': count,
    })


@login_required
@require_http_methods(['POST'])
def api_mark_as_read(request, notification_id):
    """
    Marks a single notification as read.
    Enforces object-level authorization (IDOR prevention).
    """
    try:
        notif_uuid = uuid.UUID(str(notification_id))
    except (ValueError, TypeError):
        return HttpResponseBadRequest(json.dumps({'success': False, 'error': 'Invalid notification ID format.'}), content_type='application/json')

    # Query only for current user's notification
    notification = Notification.objects.filter(id=notif_uuid, user=request.user).first()
    if not notification:
        # Check if exists for another user to return 403 or generic 404
        if Notification.objects.filter(id=notif_uuid).exists():
            return HttpResponseForbidden(json.dumps({'success': False, 'error': 'Unauthorized to modify this notification.'}), content_type='application/json')
        return JsonResponse({'success': False, 'error': 'Notification not found.'}, status=404)

    notification.mark_as_read()
    unread_count = Notification.objects.filter(user=request.user, is_read=False, is_archived=False).count()

    return JsonResponse({
        'success': True,
        'notification_id': str(notification.id),
        'is_read': True,
        'unread_count': unread_count,
    })


@login_required
@require_http_methods(['POST'])
def api_mark_all_read(request):
    """
    Marks all notifications as read for the authenticated user.
    """
    user = request.user
    updated_count = Notification.objects.filter(user=user, is_read=False).update(
        is_read=True,
        read_at=timezone.now(),
        updated_at=timezone.now()
    )
    return JsonResponse({
        'success': True,
        'marked_read_count': updated_count,
        'unread_count': 0,
    })


@login_required
@require_http_methods(['POST'])
def api_archive_notification(request, notification_id):
    """
    Archives / dismisses a single notification for the authenticated user.
    """
    try:
        notif_uuid = uuid.UUID(str(notification_id))
    except (ValueError, TypeError):
        return HttpResponseBadRequest(json.dumps({'success': False, 'error': 'Invalid notification ID format.'}), content_type='application/json')

    notification = Notification.objects.filter(id=notif_uuid, user=request.user).first()
    if not notification:
        if Notification.objects.filter(id=notif_uuid).exists():
            return HttpResponseForbidden(json.dumps({'success': False, 'error': 'Unauthorized to modify this notification.'}), content_type='application/json')
        return JsonResponse({'success': False, 'error': 'Notification not found.'}, status=404)

    notification.archive()
    unread_count = Notification.objects.filter(user=request.user, is_read=False, is_archived=False).count()

    return JsonResponse({
        'success': True,
        'notification_id': str(notification.id),
        'is_archived': True,
        'unread_count': unread_count,
    })


@login_required
@require_http_methods(['GET', 'POST', 'PUT'])
def api_notification_preferences(request):
    """
    View or update notification preferences for request.user.
    Security alerts are mandatory and cannot be disabled.
    """
    user = request.user
    prefs = NotificationService.get_user_preferences(user)

    if request.method == 'GET':
        return JsonResponse({
            'success': True,
            'preferences': {
                'email_account_security': True,  # Mandatory
                'email_discovery_updates': prefs.email_discovery_updates,
                'email_relationship_updates': prefs.email_relationship_updates,
                'email_claims_progress': prefs.email_claims_progress,
                'in_app_discovery_updates': prefs.in_app_discovery_updates,
                'in_app_relationship_updates': prefs.in_app_relationship_updates,
                'in_app_claims_progress': prefs.in_app_claims_progress,
                'web_push_enabled': prefs.web_push_enabled,
                'web_push_discovery': prefs.web_push_discovery,
                'web_push_relationship': prefs.web_push_relationship,
                'web_push_claims': prefs.web_push_claims,
            }
        })

    # Update preferences
    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        return HttpResponseBadRequest(json.dumps({'success': False, 'error': 'Invalid JSON body.'}), content_type='application/json')

    if 'email_discovery_updates' in data:
        prefs.email_discovery_updates = bool(data['email_discovery_updates'])
    if 'email_relationship_updates' in data:
        prefs.email_relationship_updates = bool(data['email_relationship_updates'])
    if 'email_claims_progress' in data:
        prefs.email_claims_progress = bool(data['email_claims_progress'])

    if 'in_app_discovery_updates' in data:
        prefs.in_app_discovery_updates = bool(data['in_app_discovery_updates'])
    if 'in_app_relationship_updates' in data:
        prefs.in_app_relationship_updates = bool(data['in_app_relationship_updates'])
    if 'in_app_claims_progress' in data:
        prefs.in_app_claims_progress = bool(data['in_app_claims_progress'])

    if 'web_push_enabled' in data:
        prefs.web_push_enabled = bool(data['web_push_enabled'])
    if 'web_push_discovery' in data:
        prefs.web_push_discovery = bool(data['web_push_discovery'])
    if 'web_push_relationship' in data:
        prefs.web_push_relationship = bool(data['web_push_relationship'])
    if 'web_push_claims' in data:
        prefs.web_push_claims = bool(data['web_push_claims'])

    prefs.save()

    return JsonResponse({
        'success': True,
        'message': 'Notification preferences updated successfully.',
        'preferences': {
            'email_account_security': True,
            'email_discovery_updates': prefs.email_discovery_updates,
            'email_relationship_updates': prefs.email_relationship_updates,
            'email_claims_progress': prefs.email_claims_progress,
            'in_app_discovery_updates': prefs.in_app_discovery_updates,
            'in_app_relationship_updates': prefs.in_app_relationship_updates,
            'in_app_claims_progress': prefs.in_app_claims_progress,
            'web_push_enabled': prefs.web_push_enabled,
            'web_push_discovery': prefs.web_push_discovery,
            'web_push_relationship': prefs.web_push_relationship,
            'web_push_claims': prefs.web_push_claims,
        }
    })


@login_required
@require_http_methods(['POST'])
def api_push_subscribe(request):
    """
    Registers a Web Push subscription token for the authenticated user.
    """
    try:
        data = json.loads(request.body.decode('utf-8'))
        endpoint = str(data.get('endpoint', '')).strip()
        keys = data.get('keys', {})
        p256dh = str(keys.get('p256dh', '')).strip()
        auth = str(keys.get('auth', '')).strip()
    except Exception:
        return HttpResponseBadRequest(json.dumps({'success': False, 'error': 'Invalid payload.'}), content_type='application/json')

    if not endpoint or not p256dh or not auth:
        return HttpResponseBadRequest(json.dumps({'success': False, 'error': 'Missing endpoint, p256dh, or auth keys.'}), content_type='application/json')

    sub, created = PushSubscription.objects.update_or_create(
        user=request.user,
        endpoint=endpoint,
        defaults={
            'p256dh_key': p256dh,
            'auth_secret': auth,
            'user_agent': request.META.get('HTTP_USER_AGENT', ''),
            'device_name': data.get('device_name', 'Web Browser'),
            'is_active': True,
            'last_used_at': timezone.now(),
        }
    )

    # Enable web push in preferences
    prefs = NotificationService.get_user_preferences(request.user)
    prefs.web_push_enabled = True
    prefs.save(update_fields=['web_push_enabled', 'updated_at'])

    return JsonResponse({
        'success': True,
        'message': 'Web push subscription registered successfully.',
        'subscription_id': str(sub.id),
    })


@login_required
@require_http_methods(['POST'])
def api_push_unsubscribe(request):
    """
    Deactivates Web Push subscription for the authenticated user.
    """
    try:
        data = json.loads(request.body.decode('utf-8'))
        endpoint = str(data.get('endpoint', '')).strip()
    except Exception:
        endpoint = ''

    if endpoint:
        PushSubscription.objects.filter(user=request.user, endpoint=endpoint).update(is_active=False)
    else:
        PushSubscription.objects.filter(user=request.user).update(is_active=False)

    return JsonResponse({
        'success': True,
        'message': 'Web push subscription deactivated.',
    })


@login_required
@require_http_methods(['POST'])
def api_expo_register(request):
    """
    Registers an Expo Push token for future React Native/Expo mobile app compatibility.
    """
    try:
        data = json.loads(request.body.decode('utf-8'))
        expo_token = str(data.get('expo_push_token', '')).strip()
        platform = str(data.get('device_platform', 'unknown')).strip().lower()
    except Exception:
        return HttpResponseBadRequest(json.dumps({'success': False, 'error': 'Invalid payload.'}), content_type='application/json')

    if not expo_token:
        return HttpResponseBadRequest(json.dumps({'success': False, 'error': 'expo_push_token is required.'}), content_type='application/json')

    token_obj, _ = ExpoDeviceToken.objects.update_or_create(
        user=request.user,
        expo_push_token=expo_token,
        defaults={
            'device_platform': platform,
            'is_active': True,
        }
    )

    return JsonResponse({
        'success': True,
        'message': 'Expo device push token registered.',
        'device_id': str(token_obj.id),
    })


@login_required
def api_notification_stream(request):
    """
    Real-Time Server-Sent Events (SSE) stream for authenticated users.
    Streams new incoming notifications without requiring Redis or extra daemon services.
    Supports reconnection and multi-tab sync.
    """
    user = request.user

    def event_stream():
        # 1. Send initial heartbeat and current unread count
        initial_unread = Notification.objects.filter(user=user, is_read=False, is_archived=False).count()
        yield f"event: connected\ndata: {json.dumps({'connected': True, 'unread_count': initial_unread})}\n\n"

        last_check = timezone.now()
        # Stream for up to 30 seconds per HTTP connection (standard SSE lifecycle)
        # Frontend auto-reconnects smoothly via native EventSource
        for _ in range(15):
            time.sleep(2)
            now = timezone.now()
            # Fetch new notifications created since last check
            new_notifications = Notification.objects.filter(
                user=user,
                is_archived=False,
                created_at__gte=last_check
            ).order_by('created_at')

            for notif in new_notifications:
                payload = serialize_notification(notif)
                yield f"event: notification\ndata: {json.dumps(payload)}\n\n"

            last_check = now
            # Send periodic heartbeat comment to keep connection alive through proxies
            yield f": heartbeat {int(now.timestamp())}\n\n"

    response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
    response['Cache-Control'] = 'no-cache, no-transform'
    response['X-Accel-Buffering'] = 'no'
    return response
