from django.urls import path
from . import views

urlpatterns = [
    path('api/auth/register/', views.api_register, name='api_register'),
    path('api/auth/login/', views.api_login, name='api_login'),
    path('api/auth/verify-email/', views.api_verify_email, name='api_verify_email'),
    path('api/auth/resend-verification/', views.api_resend_verification, name='api_resend_verification'),
    path('api/auth/forgot-password/', views.api_forgot_password, name='api_forgot_password'),
    path('api/auth/reset-password/', views.api_reset_password, name='api_reset_password'),
    path('api/auth/send-otp/', views.api_send_otp, name='api_send_otp'),
    path('api/auth/verify-otp/', views.api_verify_otp, name='api_verify_otp'),
    path('api/auth/resend-otp/', views.api_resend_otp, name='api_resend_otp'),
    path('api/auth/me/', views.api_me, name='api_me'),
    path('api/auth/logout/', views.api_logout, name='api_logout'),
    path('api/auth/csrf/', views.api_csrf, name='api_csrf'),
    path('api/auth/change-password/', views.api_change_password, name='api_change_password'),
    path('api/auth/terminate-other-sessions/', views.api_terminate_other_sessions, name='api_terminate_other_sessions'),
    path('api/auth/activity/', views.api_user_activity, name='api_user_activity'),
]
