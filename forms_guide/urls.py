"""
URL routing for forms_guide.
"""
from django.urls import path
from . import views

urlpatterns = [
    path('banks/', views.bank_directory_view, name='bank_directory_view'),
    path('api/banks/', views.api_bank_directory, name='api_bank_directory'),
]
