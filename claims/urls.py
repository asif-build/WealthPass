from django.urls import path
from . import views

urlpatterns = [
    path('', views.landing, name='landing'),
    path('search/', views.search, name='search'),
    path('verify/<uuid:session_id>/', views.verify, name='verify'),
    path('results/<uuid:session_id>/', views.results, name='results'),
    path('loan/<uuid:session_id>/', views.loan, name='loan'),
    path('accept-loan/<uuid:session_id>/', views.accept_loan, name='accept_loan'),
    path('success/<uuid:session_id>/', views.success, name='success'),
]
