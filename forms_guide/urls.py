"""
URL routing for forms_guide.
"""
from django.urls import path
from . import views

urlpatterns = [
    path('banks/', views.bank_directory_view, name='bank_directory_view'),
    path('fill-form/', views.fill_form_online_view, name='fill_form_online'),
    path('fill-form/print/', views.fill_form_print_view, name='fill_form_print'),
    path('api/banks/', views.api_bank_directory, name='api_bank_directory'),
    path('api/buddy/ask/', views.api_buddy_ask, name='api_buddy_ask'),
    path('api/buddy/section/', views.api_buddy_section, name='api_buddy_section'),
    path('energy/', views.energy_benchmark_view, name='energy_benchmark_view'),
]

