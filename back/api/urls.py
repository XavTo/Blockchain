# api/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AssetViewSet, TradeViewSet, execute_trade, register, login, logout

router = DefaultRouter()
router.register(r'assets', AssetViewSet)
router.register(r'trades', TradeViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('execute-trade/', execute_trade, name='execute-trade'),
    path('register/', register, name="register"),
    path('login/', login, name="login"),
    path('logout/', logout, name="logout"),
]
