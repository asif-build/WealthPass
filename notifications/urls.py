from django.urls import path
from . import views

urlpatterns = [
    path('api/notifications/', views.api_notification_list, name='api_notification_list'),
    path('api/notifications/unread-count/', views.api_unread_count, name='api_unread_count'),
    path('api/notifications/<str:notification_id>/read/', views.api_mark_as_read, name='api_mark_as_read'),
    path('api/notifications/mark-all-read/', views.api_mark_all_read, name='api_mark_all_read'),
    path('api/notifications/<str:notification_id>/archive/', views.api_archive_notification, name='api_archive_notification'),
    path('api/notifications/preferences/', views.api_notification_preferences, name='api_notification_preferences'),
    path('api/notifications/push/subscribe/', views.api_push_subscribe, name='api_push_subscribe'),
    path('api/notifications/push/unsubscribe/', views.api_push_unsubscribe, name='api_push_unsubscribe'),
    path('api/notifications/expo/register/', views.api_expo_register, name='api_expo_register'),
    path('api/notifications/stream/', views.api_notification_stream, name='api_notification_stream'),
]
