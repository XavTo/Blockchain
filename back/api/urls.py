# api/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AssetViewSet, TradeViewSet, execute_trade, register, login, logout, dashboard_data, create_asset, list_assets, get_wallet_info

router = DefaultRouter()
router.register(r'assets', AssetViewSet)
router.register(r'trades', TradeViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('execute-trade/', execute_trade, name='execute-trade'),
    path('register/', register, name="register"),
    path('login/', login, name="login"),
    path('logout/', logout, name="logout"),
    path('dashboard/', dashboard_data, name="dashboard-data"),
    path('asset/', create_asset, name="create-asset"),
    path('list/', list_assets, name="list-assets"),
    path('wallet/', get_wallet_info, name='get_wallet_info'),
]
